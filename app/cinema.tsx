import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { fetchCinemas } from "../src/api/cinemas";
import { fetchMovies } from "../src/api/movies";
import { MovieShowtimes } from "../src/components/movie/MovieShowtimes";
import { COLORS, FONT_SIZES, SPACING } from "../src/constants/theme";
import { Cinema, Movie, ShowTime } from "../src/types/types";

export default function CinemaDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const id = params?.id as string | undefined;

    const [cinema, setCinema] = useState<Cinema | null>(null);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
        setLoading(true);
        setError(null);
        try {
            if (!id) {
            setError("No cinema ID provided");
            return;
            }

            const allCinemas = await fetchCinemas();
            const cinemaData = allCinemas.find((c) => String(c.id) === String(id));

            if (!cinemaData) {
            setError("Cinema not found");
            return;
            }

            if (mounted) setCinema(cinemaData);

            const fetched = await fetchMovies({ cinemaId: id });
            if (mounted) setMovies(fetched || []);
        } catch (e: any) {
            if (mounted) setError(String(e?.message ?? e));
        } finally {
            if (mounted) setLoading(false);
        }
        }
        load();
        return () => {
        mounted = false;
        };
    }, [id]);

    const normalizeShowtimesForCinema = (movie: Movie, cinemaId?: string, cinemaName?: string): ShowTime[] => {
        const out: ShowTime[] = [];

        const pushNormalized = (raw: any, parentCinema?: { id?: any; name?: any }) => {
        if (!raw) return;
        const timeVal = raw.time ?? raw.startsAt ?? raw.starts_at ?? raw.start ?? undefined;
        const startsAtVal = raw.startsAt ?? raw.starts_at ?? undefined;
        const purchase = raw.purchase_url ?? raw.purchaseUrl ?? raw.ticket_url ?? raw.buyUrl ?? raw.url ?? undefined;
        const auditorium = raw.auditorium ?? raw.hall ?? raw.room ?? undefined;

        const cinemaIdFromRaw =
            raw.cinemaId ??
            raw.cinema_id ??
            (raw.cinema && (raw.cinema.id ?? raw.cinema._id ?? raw.cinemaId)) ??
            undefined;

        const cinemaIdFinal = cinemaIdFromRaw ?? parentCinema?.id;
        const cinemaNameFinal = parentCinema?.name ?? (raw.cinema && raw.cinema.name) ?? undefined;

        out.push({
            cinemaId: cinemaIdFinal !== undefined ? String(cinemaIdFinal) : undefined,
            time: timeVal ? String(timeVal) : undefined,
            startsAt: startsAtVal ? String(startsAtVal) : undefined,
            purchaseUrl: purchase ? String(purchase) : undefined,
            purchase_url: purchase ? String(purchase) : undefined,
            auditorium: auditorium ? String(auditorium) : undefined,
            cinemaName: cinemaNameFinal ? String(cinemaNameFinal) : undefined,
        } as unknown as ShowTime);
        };

        if (Array.isArray((movie as any).showtimes)) {
        for (const entry of (movie as any).showtimes) {
            if (entry && Array.isArray(entry.schedule) && entry.cinema) {
            const parentCinema = { id: entry.cinema.id ?? entry.cinema._id ?? entry.cinemaId, name: entry.cinema.name ?? entry.cinemaName };
            for (const sch of entry.schedule) pushNormalized(sch, parentCinema);
            continue;
            }
            if (entry && (entry.time || entry.startsAt || entry.purchase_url || entry.purchaseUrl)) {
            const parentCinema = entry.cinema ? { id: entry.cinema.id ?? entry.cinema._id, name: entry.cinema.name } : undefined;
            pushNormalized(entry, parentCinema);
            continue;
            }
            if (entry && Array.isArray(entry.schedule)) {
            for (const sch of entry.schedule) {
                const parentCinema = entry.cinema ? { id: entry.cinema.id ?? entry.cinema._id, name: entry.cinema.name } : undefined;
                pushNormalized(sch, parentCinema);
            }
            }
        }
        }

        if (Array.isArray((movie as any).schedule)) {
        for (const sch of (movie as any).schedule) pushNormalized(sch, undefined);
        }

        if (out.length === 0) {
        const possibleArrays = Object.values(movie).filter((v) => Array.isArray(v)) as any[];
        for (const arr of possibleArrays) {
            for (const item of arr) {
            if (item && (item.time || item.startsAt || item.purchase_url || item.purchaseUrl)) {
                if (Array.isArray(item.schedule)) {
                const parentCinema = item.cinema ? { id: item.cinema.id ?? item.cinema._id, name: item.cinema.name } : undefined;
                for (const sch of item.schedule) pushNormalized(sch, parentCinema);
                } else {
                const parentCinema = item.cinema ? { id: item.cinema.id ?? item.cinema._id, name: item.cinema.name } : undefined;
                pushNormalized(item, parentCinema);
                }
            }
            }
        }
        }

        if (out.length === 0) return [];

        const selectedCinemaId = cinemaId ? String(cinemaId) : undefined;
        const selectedCinemaName = cinemaName ? String(cinemaName).toLowerCase() : undefined;

        const filtered = out.filter((s: any) => {
        if (!selectedCinemaId && !selectedCinemaName) return true;
        if (s.cinemaId && selectedCinemaId && String(s.cinemaId) === String(selectedCinemaId)) return true;
        if (s.cinemaName && selectedCinemaName && String(s.cinemaName).toLowerCase() === selectedCinemaName) return true;
        if (s.cinemaName && selectedCinemaName) {
            const raw = String(s.cinemaName).toLowerCase();
            if (raw.includes(selectedCinemaName) || selectedCinemaName.includes(raw)) return true;
        }
        return false;
        });

        const parseKey = (s: ShowTime) => {
        if (s.startsAt) {
            const ts = Date.parse(s.startsAt);
            if (!isNaN(ts)) return ts;
        }
        if (s.time) {
            const m = String(s.time).match(/(\d{1,2}):(\d{2})/);
            if (m) {
            const hh = Number(m[1]);
            const mm = Number(m[2]);
            return hh * 60 + mm;
            }
        }
        return Number.POSITIVE_INFINITY;
        };

        filtered.sort((a, b) => (parseKey(a) as number) - (parseKey(b) as number));
        return filtered;
    };

    const moviesWithShowtimes = useMemo(() => {
        if (!movies || movies.length === 0) return [];
        return movies
        .map((m) => {
            const s = normalizeShowtimesForCinema(m, id, cinema?.name);
            return { movie: m, showtimes: s };
        })
        .filter((x) => x.showtimes && x.showtimes.length > 0)
        .map((x) => {
            return { ...x.movie, __normalizedShowtimes: x.showtimes } as unknown as Movie & { __normalizedShowtimes?: ShowTime[] };
        });
    }, [movies, id, cinema?.name]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
    if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;
    if (!cinema) return <View style={styles.center}><Text>Could not load cinema details.</Text></View>;

    const getAddressString = () => {
        if (typeof cinema.address === "string") return cinema.address;
        if (cinema.address && typeof cinema.address === "object") {
        const parts: string[] = [];
        if ((cinema.address as any).street) parts.push((cinema.address as any).street);
        if ((cinema.address as any).city) parts.push((cinema.address as any).city);
        if ((cinema.address as any).zipcode) parts.push((cinema.address as any).zipcode);
        return parts.join(", ");
        }
        return null;
    };

    const addressString = getAddressString();

    const getWebsiteUrl = () => {
        if (!cinema.website) return null;
        if (cinema.website.startsWith("http://") || cinema.website.startsWith("https://")) return cinema.website;
        return `https://${cinema.website}`;
    };

    const websiteUrl = getWebsiteUrl();

    const cleanDescription = cinema.description
        ? String(cinema.description).replace(/<br\s*\/?>/gi, "\n").replace(/<\/?b>/gi, "").trim()
        : "";

    return (
        <View style={styles.container}>
        <View style={styles.headerCard}>
            <Text style={styles.name}>{cinema.name}</Text>
            {cleanDescription ? <Text style={styles.desc}>{cleanDescription}</Text> : null}
            {addressString ? <Text style={styles.meta}>Address: {addressString}</Text> : null}
            {cinema.phone ? <Text style={styles.meta}>Phone: {cinema.phone}</Text> : null}
            {websiteUrl ? (
            <Text style={[styles.meta, styles.link]} onPress={() => websiteUrl && Linking.openURL(websiteUrl)}>
                {cinema.website}
            </Text>
            ) : null}
        </View>

        <Text style={styles.sectionTitle}>Movies & Showtimes</Text>

        <FlatList
            data={moviesWithShowtimes}
            keyExtractor={(m: any, index) => `${m.id ?? m.title ?? index}-${index}`}
            renderItem={({ item }: { item: any }) => {
            const relevantShowtimes: ShowTime[] = (item.__normalizedShowtimes as ShowTime[]) ?? normalizeShowtimesForCinema(item, id, cinema?.name);

            const genreNames = (item.genres || []).map((g: any) => (typeof g === "string" ? g : g?.name ?? g?.Name ?? "")).filter(Boolean);

            return (
                <View>
                <TouchableOpacity
                    style={styles.movieCard}
                    onPress={() =>
                    router.push({
                        pathname: "/movie",
                        params: { movieData: JSON.stringify(item), cinemaId: id },
                    })
                    }
                >
                    {item.poster ? (
                    <Image source={{ uri: item.poster }} style={styles.poster} />
                    ) : (
                    <View style={[styles.poster, styles.posterPlaceholder]}>
                        <Text>No Image</Text>
                    </View>
                    )}
                    <View style={{ flex: 1 }}>
                    <Text style={styles.movieTitle}>
                        {item.title} {item.year ? `(${item.year})` : ""}
                    </Text>
                    <Text style={styles.genres}>{genreNames.join(", ")}</Text>
                    <Text style={styles.showtimes}>
                        {relevantShowtimes.length > 0
                        ? relevantShowtimes.map((s) => s.time ?? s.startsAt ?? "—").join(", ")
                        : "—"}
                    </Text>
                    </View>
                </TouchableOpacity>

                <MovieShowtimes showtimes={relevantShowtimes} />
                </View>
            );
            }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={() => <Text style={{ marginTop: 12 }}>No movies found for this cinema.</Text>}
        />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: SPACING.md, backgroundColor: COLORS.background },
    headerCard: {
        backgroundColor: COLORS.white,
        padding: SPACING.md,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...Platform.select({ ios: { shadowColor: COLORS.border, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 1 } }),
    },
    name: { fontSize: FONT_SIZES.xlarge, fontWeight: "700", color: COLORS.textPrimary },
    desc: { marginTop: 8, color: COLORS.textSecondary },
    meta: { marginTop: 8, fontSize: FONT_SIZES.medium, color: COLORS.textPrimary },
    link: { color: "#1B73E8", textDecorationLine: "underline" },
    sectionTitle: { marginTop: 16, fontSize: FONT_SIZES.large, fontWeight: "600", color: COLORS.textPrimary },
    movieCard: {
        flexDirection: "row",
        padding: SPACING.md,
        marginTop: SPACING.sm,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
        ...Platform.select({ ios: { shadowColor: COLORS.border, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 1 } }),
    },
    poster: { width: 72, height: 108, borderRadius: 6, marginRight: SPACING.md, backgroundColor: "#eee" },
    posterPlaceholder: { justifyContent: "center", alignItems: "center" },
    movieTitle: { fontSize: FONT_SIZES.large, fontWeight: "600", color: COLORS.textPrimary },
    genres: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginTop: 6 },
    showtimes: { fontSize: FONT_SIZES.medium, marginTop: 8, color: COLORS.textPrimary },
    sep: { height: 8 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    error: { color: "red", fontSize: 14 },
});
