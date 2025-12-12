import { useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchMovieShowtimes } from '../src/api/movies';
import { MovieHeader } from "../src/components/movie/MovieHeader";
import { MovieMeta } from "../src/components/movie/MovieMeta";
import { MoviePlot } from "../src/components/movie/MoviePlot";
import { MovieShowtimes } from "../src/components/movie/MovieShowtimes";
import { MovieTrailer } from "../src/components/movie/MovieTrailer";
import { COLORS, SPACING } from "../src/constants/theme";
import useFavourites from '../src/hooks/useFavourites';
import { Movie, ShowTime } from "../src/types/types";

export default function MoviePage() {
    const route = useRoute() as {
        params?: {
            movieId: string;
            movieTitle?: string;
            movieData?: string;
            cinemaId?: string;
        };
    };

    const movie: Movie | null = useMemo(() => {
        if (route.params?.movieData) {
            try {
                const data = JSON.parse(route.params.movieData);
                const cinemaId = route.params?.cinemaId;
                // DEBUG: show incoming cinemaId when navigating from a cinema
                try {
                    console.log('[MoviePage] useMemo arrived with cinemaId=', cinemaId);
                } catch {}

                // Normalize showtimes: prefer 'schedule' or flatten 'showtimes'
                let showtimes: any[] | undefined = undefined;
                if (data.schedule && Array.isArray(data.schedule)) {
                    showtimes = data.schedule;
                } else if (data.showtimes && Array.isArray(data.showtimes)) {
                    showtimes = data.showtimes.flatMap((st: any) =>
                        st && Array.isArray(st.schedule) ? st.schedule : st
                    );
                }

                // If a cinemaId was provided (user selected a cinema when opening the movie), filter to that cinema.
                // Be permissive about where the showtime's cinema id might be stored.
                if (cinemaId && Array.isArray(showtimes)) {
                    // Project API uses a primitive `cinemaId` on showtimes.
                    // Fall back to `cinema.id` only if `cinemaId` is missing.
                    const extractShowtimeCinemaId = (s: any) => {
                        if (!s) return undefined;
                        if (s.cinemaId !== undefined) return s.cinemaId;
                        if (s.cinema && (s.cinema.id !== undefined)) return s.cinema.id;
                        return undefined;
                    };

                    showtimes = showtimes.filter((s: any) => {
                        const stCinema = extractShowtimeCinemaId(s);
                        return stCinema !== undefined && String(stCinema) === String(cinemaId);
                    });
                }

                // Rely on server-side normalization where possible and keep a small
                // client-side extractor for common shapes (arrays of objects, strings).
                const extractNames = (v: any): string[] | undefined => {
                    if (!v && v !== 0) return undefined;
                    if (Array.isArray(v)) {
                        const names = v
                            .map((it: any) => {
                                if (!it) return undefined;
                                if (typeof it === "string") return it;
                                return it.name || it.Name || it.NameEN || undefined;
                            })
                            .filter(Boolean) as string[];
                        return names.length > 0 ? names : undefined;
                    }
                    if (typeof v === "string") {
                        const parts = v.split(/,|;|\band\b/).map((s: string) => s.trim()).filter(Boolean);
                        return parts.length > 0 ? parts : undefined;
                    }
                    return undefined;
                };

                const directors = extractNames(data.directors) || extractNames(data.directors_abridged) || data.directors;
                const writers = extractNames(data.writers) || extractNames(data.writers_abridged) || extractNames(data.omdb?.[0]?.Writer) || data.writers;
                const actors = extractNames(data.actors) || extractNames(data.actors_abridged) || data.actors;
                const genres = extractNames(data.genres) || data.genres;

                if (showtimes) {
                    return { ...data, showtimes, directors, writers, actors, genres };
                }

                return { ...data, directors, writers, actors, genres };
            } catch {
                return null;
            }
        }
        return null;
    }, [route.params?.movieData, route.params?.cinemaId]);

    const [extraShowtimes, setExtraShowtimes] = useState<ShowTime[] | null>(null);


    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!movie) return;
            const cinemaId = route.params?.cinemaId;
            const existing = (movie.showtimes || movie.schedule) as any[] | undefined;

            // DEBUG: log params and showtime state when page mounts
            try {
                console.log('[MoviePage] params=', route.params, 'movie.id=', (movie as any).id ?? (movie as any)._id ?? route.params?.movieId, 'existingShowtimes=', existing?.length ?? 0);
            } catch {}
            if (!cinemaId) return;
            if (existing && existing.length > 0) return; // already have showtimes

            const mid = (movie as any).id ?? (movie as any)._id ?? (route.params?.movieId ?? undefined);
            if (!mid) return;
            try {
                console.log('[MoviePage] fetching showtimes for', String(mid), 'cinemaId=', String(cinemaId));
                const fetched = await fetchMovieShowtimes(String(mid), String(cinemaId));
                console.log('[MoviePage] fetched showtimes count=', Array.isArray(fetched) ? fetched.length : 'not-array');

                let fallback: ShowTime[] | undefined;
                if (Array.isArray(fetched) && fetched.length === 0) {
                    try {
                        console.log('[MoviePage] trying fallback fetch without cinema filter');
                        const fb = await fetchMovieShowtimes(String(mid));
                        console.log('[MoviePage] fallback fetched count=', Array.isArray(fb) ? fb.length : 'not-array');
                        if (Array.isArray(fb) && fb.length > 0) {
                            fallback = fb as ShowTime[];
                        }
                    } catch (e) {
                        console.warn('Fallback showtimes fetch failed', e);
                    }
                }

                const toUse = (Array.isArray(fetched) && fetched.length > 0) ? fetched as ShowTime[] : fallback;
                if (toUse && toUse.length > 0) {
                    if (!mounted) return;
                    setExtraShowtimes(toUse as ShowTime[]);
                }
            } catch (err) {
                // ignore failure — MovieShowtimes will show empty state
                console.warn('Failed to fetch showtimes for movie', err);
            }
        })();
        return () => { mounted = false; };
    }, [movie, route.params?.cinemaId, route.params?.movieId, route.params]);

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
            <MovieHeader
                poster={movie.poster}
                title={movie.title}
                year={movie.year}
                rating={movie.rating}
                duration={movie.durationMinutes}
                country={movie.country}
            />

            <View style={styles.favRow}>
                <AddToFavButton movie={movie} />
            </View>

            <MovieMeta
                directors={movie.directors}
                writers={movie.writers}
                actors={movie.actors}
                genres={movie.genres}
                ratings={movie.ratings}
            />

            <MoviePlot plot={movie.plot} />

            {(movie.showtimes || movie.schedule) &&
            (movie.showtimes?.length || movie.schedule?.length) ? (
                <MovieShowtimes
                    showtimes={(extraShowtimes ?? (movie.showtimes || movie.schedule)) as any}
                />
            ) : null}

            <MovieTrailer trailers={movie.trailers} />
        </ScrollView>
    );
}

function AddToFavButton({ movie }: { movie: Movie }) {
    const { favourites, add } = useFavourites();
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const isFav = favourites.some((m) => m.id === movie.id);

    const handleAdd = async () => {
        if (busy) return;
        setBusy(true);
        try {
            if (isFav) {
                setMsg('Already in favourites');
            } else {
                await add(movie);
                setMsg('Added to favourites');
            }
        } catch (err) {
            console.warn('Failed to add favourite', err);
            setMsg('Failed to add');
        } finally {
            setBusy(false);
            setTimeout(() => setMsg(null), 1600);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleAdd}
            style={[styles.favButton, isFav ? styles.favButtonActive : null]}
            disabled={busy}
        >
            <Text style={styles.favButtonText}>{isFav ? 'In Favourites' : 'Add to Favourites'}</Text>
            {msg ? <Text style={styles.favMsg}>{msg}</Text> : null}
        </TouchableOpacity>
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
    favRow: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    favButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
        width: '80%',
    },
    favButtonActive: {
        backgroundColor: '#888',
    },
    favButtonText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    favMsg: {
        marginTop: SPACING.xs,
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});
