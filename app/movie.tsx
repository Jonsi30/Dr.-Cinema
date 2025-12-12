import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { fetchMovieById, fetchMovies, fetchRottenTomatoesFor } from "../src/api/movies";
import { MovieHeader } from "../src/components/movie/MovieHeader";
import { MovieMeta } from "../src/components/movie/MovieMeta";
import { MoviePlot } from "../src/components/movie/MoviePlot";
import { MovieReviews } from "../src/components/movie/MovieReviews";
import { MovieShareButton } from "../src/components/movie/MovieShareButton";
import { MovieShowtimes } from "../src/components/movie/MovieShowtimes";
import { MovieTrailer } from "../src/components/movie/MovieTrailer";
import { COLORS, SPACING } from "../src/constants/theme";
import useFavourites from "../src/hooks/useFavourites";
import { Movie } from "../src/types/types";

export default function MoviePage() {
    const route = useRoute() as {
        params?: {
            movieId: string;
            movieTitle?: string;
            movieData?: string;
            cinemaId?: string;
        };
    };

    const movieFromParams: Movie | null = useMemo(() => {
        if (route.params?.movieData) {
            try {
                const data = JSON.parse(route.params.movieData);

                // Handle API response format with schedule property
                if (data.schedule && Array.isArray(data.schedule)) {
                    // Has schedule array - map it to showtimes
                    return { ...data, showtimes: data.schedule };
                }

                // Handle showtimes that are already objects with cinema/schedule inside
                if (data.showtimes && Array.isArray(data.showtimes)) {
                    const flattenedShowtimes = data.showtimes.flatMap(
                        (st: any) => {
                            if (st.schedule && Array.isArray(st.schedule)) {
                                return st.schedule;
                            }
                            return st;
                        }
                    );
                    return { ...data, showtimes: flattenedShowtimes };
                }

                return data;
            } catch {
                return null;
            }
        }
        return null;
    }, [route.params?.movieData]);

    const [movie, setMovie] = useState<Movie | null>(movieFromParams);

    // helper to coerce various rating shapes to a display string (shared)
    const normalizeRatingValue = (r: any): string | undefined => {
        if (r === undefined || r === null) return undefined;
        if (typeof r === 'string') {
            const s = r.trim();
            if (!s) return undefined;
            // Some sources serialize certificate objects as JSON strings
            if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
                try {
                    const parsed = JSON.parse(s);
                    // fall through to object handling
                    r = parsed;
                } catch {
                    return s;
                }
            } else {
                return s;
            }
        }
        if (typeof r === 'number') return String(r);
        if (typeof r === 'object') {
            // common certificate shapes: { is: '12 ára', number: '12', color: 'red' }
            if (r.is) return String(r.is);
            if (r.number) return String(r.number) + (r.suffix ? String(r.suffix) : '');
            if (r.name) return String(r.name);
            if (r.Rated) return String(r.Rated);
            // fallback to any string-like properties
            for (const k of ['rating','name','value','code']) {
                if ((r as any)[k]) return String((r as any)[k]);
            }
            return undefined;
        }
        try { return String(r); } catch { return undefined; }
    };

    // Normalize various incoming movie shapes to a consistent `Movie` shape
    const normalizeMovie = useCallback((raw: any): Movie => {
        if (!raw) return raw as Movie;
        const id = typeof raw.id === 'number' ? raw.id : (raw._id ? parseInt(String(raw._id), 10) : (raw.id ? parseInt(String(raw.id), 10) : 0));
        const title = raw.title || raw.name || "";
        const poster = raw.poster || raw.image || raw.poster_url || raw.thumbnail || undefined;
        const year = raw.year ? String(raw.year) : raw.releaseYear ? String(raw.releaseYear) : undefined;
        const durationMinutes = raw.durationMinutes || raw.duration || raw.length || undefined;
        const actors = Array.isArray(raw.actors_abridged) ? raw.actors_abridged.map((a: any) => a?.name || String(a)).filter(Boolean) : (Array.isArray(raw.actors) ? raw.actors.map((a: any) => typeof a === 'string' ? a : (a?.name || a?.Name || '')).filter(Boolean) : []);
        const directors = Array.isArray(raw.directors_abridged) ? raw.directors_abridged.map((d: any) => d?.name || String(d)).filter(Boolean) : (Array.isArray(raw.directors) ? raw.directors.map((d: any) => typeof d === 'string' ? d : (d?.name || d?.Name || '')).filter(Boolean) : []);
        let writers = Array.isArray(raw.writers_abridged)
            ? raw.writers_abridged.map((w: any) => w?.name || String(w)).filter(Boolean)
            : (Array.isArray(raw.writers) ? raw.writers.map((w: any) => typeof w === 'string' ? w : (w?.name || w?.Name || '')).filter(Boolean) : []);
        // Accept OMDb-style Writer string (comma-separated) or raw.Writer fields
        try {
            const omdbWriter = (Array.isArray(raw.omdb) ? raw.omdb[0] : raw.omdb)?.Writer || raw.Writer || raw.writer || raw.writersString;
            if ((!writers || writers.length === 0) && typeof omdbWriter === 'string' && omdbWriter.trim()) {
                writers = omdbWriter.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
        } catch {
            // ignore
        }
        const genres = Array.isArray(raw.genres) ? raw.genres.map((g: any) => typeof g === 'string' ? g : (g?.name || g?.Name || g?.NameEN || '')).filter(Boolean) : [];
        const country = raw.country || raw.countryOfOrigin || raw.origin || undefined;

        // content rating (age) candidates
        const contentRating = raw.rating || raw.rated || raw.certificate || raw.certificateIS || raw.omdb?.rated || undefined;


        // omdb-like (API sometimes returns an array)
        const omdbRaw = Array.isArray(raw.omdb) ? raw.omdb[0] : raw.omdb;
        const omdb = omdbRaw || (raw.ratings && (raw.ratings.imdb || raw.ratings.rotten_critics) ? {
            imdbRating: raw.ratings?.imdb ? String(raw.ratings.imdb) : (raw.omdb?.imdbRating ? String(raw.omdb.imdbRating) : undefined),
            tomatoRating: raw.ratings?.rotten_critics ? `${raw.ratings.rotten_critics}%` : (raw.omdb?.tomatoRating ? String(raw.omdb.tomatoRating) : undefined),
            rated: contentRating || "",
        } : undefined);

        const ratingsObj: any = {};
        if (raw.ratings?.imdb !== undefined) {
            const im = parseFloat(String(raw.ratings.imdb));
            if (!Number.isNaN(im)) ratingsObj.imdb = im;
        } else if (raw.omdb?.imdbRating) {
            const im = parseFloat(String(raw.omdb.imdbRating));
            if (!Number.isNaN(im)) ratingsObj.imdb = im;
        }
        const rtCandidate = raw.ratings?.rotten_critics ?? raw.ratings?.rottenTomatoes ?? raw.ratings?.rotten_audience ?? raw.omdb?.tomatoRating ?? raw.ratings?.rotten_critics_score;
        if (rtCandidate !== undefined && rtCandidate !== null) {
            const parsed = parseInt(String(rtCandidate).replace(/[^0-9]/g, ''), 10);
            if (!Number.isNaN(parsed)) ratingsObj.rottenTomatoes = parsed;
            else if (String(rtCandidate).trim()) ratingsObj.rottenTomatoes = String(rtCandidate).trim();
        }

        // showtimes normalization (best effort)
        let showtimes: any[] = [];
        if (Array.isArray(raw.showtimes)) {
            showtimes = raw.showtimes.flatMap((st: any) => {
                if (st.schedule && Array.isArray(st.schedule)) {
                    return st.schedule.map((s: any) => ({
                        time: s.time || s.startsAt || s.start || '',
                        theater: { id: st.cinema?.id ?? s.cinemaId ?? 0 },
                        purchaseUrl: s.purchaseUrl || s.purchase_url || s.purchase || s.url || st.purchaseUrl || st.purchase_url || undefined,
                        purchase_url: s.purchase_url || s.purchaseUrl || s.purchase || s.url || st.purchase_url || st.purchaseUrl || undefined,
                        auditorium: s.auditorium || s.hall || s.room || undefined,
                        info: s.info || s.note || undefined,
                    }));
                }
                if (st.time || st.startsAt) return [{
                    time: st.time || st.startsAt,
                    theater: { id: st.cinema?.id ?? st.cinemaId ?? 0 },
                    purchaseUrl: st.purchaseUrl || st.purchase_url || st.purchase || st.url || undefined,
                    purchase_url: st.purchase_url || st.purchaseUrl || st.purchase || st.url || undefined,
                    auditorium: st.auditorium || st.hall || st.room || undefined,
                    info: st.info || st.note || undefined,
                }];
                return [];
            });
        }
        if (Array.isArray(raw.schedule) && showtimes.length === 0) {
            showtimes = raw.schedule.map((s: any) => ({ time: s.time || s.startsAt || '', theater: { id: s.cinema?.id ?? s.cinemaId ?? 0 } }));
        }

        // trailers normalization: accept several common shapes (trailers, videos.results, trailerUrl, youtubeId)
        let trailers: any[] | undefined;
        try {
            if (Array.isArray(raw.trailers) && raw.trailers.length > 0) {
                trailers = raw.trailers;
            } else if (raw.videos && Array.isArray(raw.videos.results) && raw.videos.results.length > 0) {
                trailers = raw.videos.results;
            } else if (raw.videos && Array.isArray(raw.videos) && raw.videos.length > 0) {
                trailers = raw.videos;
            } else if (raw.trailer && Array.isArray(raw.trailer)) {
                trailers = raw.trailer;
            } else if (raw.trailer && typeof raw.trailer === 'object') {
                trailers = [raw.trailer];
            } else if (raw.trailerUrl && typeof raw.trailerUrl === 'string') {
                trailers = [{ url: raw.trailerUrl }];
            } else if (raw.youtubeId && typeof raw.youtubeId === 'string') {
                trailers = [{ key: raw.youtubeId, site: 'YouTube' }];
            }
        } catch {
            trailers = undefined;
        }

        const ratingTop = normalizeRatingValue(contentRating) ?? normalizeRatingValue(omdb?.rated);

        return {
            id: id || 0,
            title: title,
            plot: raw.plot || raw.description || raw.synopsis,
            year: year,
            poster: poster,
            durationMinutes: durationMinutes,
            omdb: omdb,
            rating: ratingTop,
            actors: actors,
            directors: directors,
            writers: writers,
            genres: genres,
            showtimes: showtimes,
            trailers: trailers,
            country: country,
            ratings: Object.keys(ratingsObj).length > 0 ? ratingsObj : undefined,
        } as Movie;
    }, []);

    // If the parsed movie doesn't include normalized ratings, try to fetch a fuller
    // representation (the cinema flow uses `src/api/movies.ts` which populates `ratings`).
    useEffect(() => {
        let mounted = true;
        setMovie(movieFromParams ? normalizeMovie(movieFromParams) : null);
        const tryFetch = async () => {
            if (!movieFromParams) return;

            // Always attempt to get enriched record from API by title so cinema & all-movies share same data
            let fetched: any = null;
            const title = movieFromParams.title;
            if (title) {
                try {
                    // prefer a cinema-scoped lookup if the navigator provided one (this mirrors the cinema flow)
                    const cinemaIdParam = route.params?.cinemaId ?? (movieFromParams as any)?.showtimes?.[0]?.theater?.id ?? (movieFromParams as any)?.showtimes?.[0]?.cinemaId;
                    const results = await fetchMovies({ title, cinemaId: cinemaIdParam ? String(cinemaIdParam) : undefined });
                    fetched = results?.[0] ?? null;

                    // If fetched exists but lacks a Rotten Tomatoes score, try alternate title variants
                    const hasRt = (f: any) => f && ((f.ratings && f.ratings.rottenTomatoes !== undefined && f.ratings.rottenTomatoes !== null) || (f.omdb && (f.omdb.tomatoRating || f.omdb.tomatoMeter)));
                    if (fetched && !hasRt(fetched)) {
                        const candidates = Array.from(new Set([
                            movieFromParams.title,
                            (movieFromParams as any).original_title,
                            (movieFromParams as any).titleEN,
                            (movieFromParams as any).name,
                            (movieFromParams as any).nameEN,
                            (movieFromParams as any).alternateTitle,
                        ].filter(Boolean).map(String)));

                        for (const cand of candidates) {
                            if (!cand || cand === title) continue;
                            try {
                                const alt = await fetchMovies({ title: cand });
                                const altFirst = alt?.[0] ?? null;
                                if (altFirst) {
                                    if (hasRt(altFirst)) {
                                        fetched = altFirst;
                                        break;
                                    }
                                }
                            } catch (err) {
                                console.debug('[MoviePage] alternate title lookup failed for', cand, err);
                            }
                        }
                    }
                } catch (e) {
                    console.debug('[MoviePage] fetchMovies(title) failed, falling back to fetchMovieById', e);
                    try {
                        fetched = await fetchMovieById(title);
                    } catch (err) {
                        console.debug('[MoviePage] fetchMovieById also failed', err);
                        fetched = null;
                    }
                }
            }

            if (mounted && fetched) {
                const norm = normalizeMovie(fetched as any);
                    const merged: any = { ...norm };

                    // Preserve original writers if fetched result lacks them
                    const origWriters = (movieFromParams as any)?.writers || (movieFromParams as any)?.omdb?.Writer || (movieFromParams as any)?.Writer || (movieFromParams as any)?.writer;
                    if ((!merged.writers || merged.writers.length === 0) && origWriters) {
                        if (Array.isArray(origWriters)) merged.writers = origWriters;
                        else if (typeof origWriters === 'string') merged.writers = String(origWriters).split(',').map((s: string) => s.trim()).filter(Boolean);
                    }

                    // Ensure trailers from fetched data are included. If fetched didn't include trailers,
                    // preserve any trailers from the original params. Prefer fetched trailers when available.
                    merged.trailers = (merged as any).trailers || (movieFromParams as any).trailers || undefined;

                    const originalRatingRaw = (movieFromParams as any)?.rating ?? (movieFromParams as any)?.rated ?? (movieFromParams as any)?.omdb?.rated;
                    const originalRating = ((): string | undefined => {
                        if (!originalRatingRaw) return undefined;
                        if (typeof originalRatingRaw === 'string') return originalRatingRaw;
                        if (typeof originalRatingRaw === 'number') return String(originalRatingRaw);
                        if (typeof originalRatingRaw === 'object') return normalizeRatingValue(originalRatingRaw);
                        return String(originalRatingRaw);
                    })();
                    if (originalRating && !(merged as any).rating && !(merged as any).omdb?.rated) {
                        merged.rating = originalRating;
                        merged.omdb = merged.omdb || {};
                        if (!merged.omdb.rated) merged.omdb.rated = String(originalRating);
                    }

                    const origRT = (movieFromParams as any)?.ratings?.rottenTomatoes ?? (movieFromParams as any)?.omdb?.tomatoRating;
                    const fetchedRT = (merged as any)?.ratings?.rottenTomatoes ?? (merged as any)?.omdb?.tomatoRating;
                    if (origRT && !fetchedRT) {
                        merged.ratings = merged.ratings || {};
                        const parsed = parseInt(String(origRT).replace(/[^0-9]/g, ""), 10);
                        merged.ratings.rottenTomatoes = !Number.isNaN(parsed) ? parsed : String(origRT).trim();
                        merged.omdb = merged.omdb || {};
                        if (!merged.omdb.tomatoRating) merged.omdb.tomatoRating = typeof origRT === 'number' ? `${origRT}%` : String(origRT);
                    }

                    // If rotten tomatoes still missing, try TMDB/OMDb enrichment client-side
                    if (!((merged as any)?.ratings?.rottenTomatoes)) {
                        try {
                            const tmdbId = (fetched as any)?.tmdb_id || (fetched as any)?.tmdbId || (fetched as any)?.trailers?.[0]?.id;
                            const imdbId = (fetched as any)?.imdb_id || (fetched as any)?.imdbId || (fetched as any)?.omdb?.imdbID;
                            const rtFound = await fetchRottenTomatoesFor(tmdbId, imdbId);
                            if (rtFound && !Number.isNaN(rtFound)) {
                                merged.ratings = merged.ratings || {};
                                merged.ratings.rottenTomatoes = rtFound;
                                merged.omdb = merged.omdb || {};
                                if (!merged.omdb.tomatoRating) merged.omdb.tomatoRating = `${rtFound}%`;
                            }
                        } catch (e) {
                            console.debug('[MoviePage] client-side RT enrichment failed', e);
                        }
                    }

                    // Ensure rating fields are strings (coerce certificate objects)
                    if ((merged as any).rating) {
                        const coerced = normalizeRatingValue((merged as any).rating) || String((merged as any).rating);
                        (merged as any).rating = coerced;
                    }
                    if ((merged as any).omdb && (merged as any).omdb.rated) {
                        const coercedOmdb = normalizeRatingValue((merged as any).omdb.rated) || String((merged as any).omdb.rated);
                        (merged as any).omdb.rated = coercedOmdb;
                    }
                    setMovie(merged as Movie);
                }
        };
        tryFetch();
        return () => {
            mounted = false;
        };
    }, [movieFromParams, normalizeMovie, route.params?.cinemaId]);

    const { favourites, add, remove } = useFavourites();

    const isFavourite = useMemo(() => {
        try {
            return favourites.some((f) => f.id === movie?.id);
        } catch {
            return false;
        }
    }, [favourites, movie?.id]);

    const FavouriteAction = (
        <TouchableOpacity
            onPress={async () => {
                if (!movie) return;
                if (isFavourite) {
                    Alert.alert(
                        "Remove favourite",
                        `Remove ${
                            movie.title ?? "this movie"
                        } from favourites?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Remove",
                                style: "destructive",
                                onPress: () =>
                                    remove(String(movie.id ?? movie.title)),
                            },
                        ]
                    );
                } else {
                    await add(movie);
                }
            }}
            style={[
                styles.favButton,
                isFavourite ? styles.favButtonDanger : undefined,
            ]}
        >
            <Text style={styles.favButtonText}>
                {isFavourite ? "Remove favourite" : "Add to favourites"}
            </Text>
        </TouchableOpacity>
    );

    const navigation = useNavigation();

    useLayoutEffect(() => {
        try {
            // prefer movie title from parsed data, then route param, fallback to generic
            const title = movie?.title ?? route.params?.movieTitle ?? "Movie";
            navigation.setOptions({ title });
        } catch {
            // ignore
        }
    }, [navigation, movie?.title, route.params?.movieTitle]);

    if (!movie) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Movie data not available</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
        >
            {/* Prefer content/age rating (movie.rating or omdb.rated). Fall back to IMDb only if no age rating present. */}
            <MovieHeader
                poster={movie.poster}
                title={movie.title}
                year={movie.year ? Number(movie.year) : undefined}
                rating={
                    (movie as any).rating ?? movie.omdb?.rated ?? (movie.omdb?.imdbRating ? String(movie.omdb.imdbRating) : undefined)
                }
                duration={movie.durationMinutes}
                country={movie.country}
                actions={FavouriteAction}
            />

            <MovieMeta
                directors={movie.directors}
                writers={(movie as any).writers}
                actors={movie.actors}
                genres={movie.genres}
                ratings={movie.ratings}
            />

            <MoviePlot plot={movie.plot} />

            {(movie.showtimes || (movie as any).schedule) &&
            (movie.showtimes?.length || (movie as any).schedule?.length) ? (
                <MovieShowtimes
                    showtimes={
                        (movie.showtimes || (movie as any).schedule) as any
                    }
                />
            ) : null}

            <MovieTrailer trailers={(movie as any).trailers} />

            <MovieReviews movieId={String(movie.id ?? movie.title)} />

            <MovieShareButton
                movieId={String(movie.id!)}
                title={movie.title}
                year={movie.year}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: SPACING.lg,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    favButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderRadius: 8,
    },
    favButtonDanger: {
        backgroundColor: "#d9534f",
    },
    favButtonText: {
        color: COLORS.white,
        fontWeight: "600",
    },
});
