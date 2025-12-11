import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchCinemas } from "../src/api/cinemas";
import { fetchMovies } from "../src/api/movies";
import { COLORS, FONT_SIZES, SPACING } from "../src/constants/theme";
import { Cinema, Movie } from "../src/types/types";

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

            const filteredMovies = await fetchMovies({ cinemaId: id });

            const moviesForThisCinema = filteredMovies.filter(movie => {
            const showtimes = movie.showtimes || movie.schedule || [];
            return showtimes.some((st: any) => {
                const stCinemaId = st.cinema?.id || st.cinemaId;
                return String(stCinemaId) === String(id);
            });
            });
            if (mounted) setMovies(moviesForThisCinema);
        } finally {
            if (mounted) setLoading(false);
        }
        }
        load();
        return () => { mounted = false; };
    }, [id]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
    if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;
    if (!cinema) return <View style={styles.center}><Text>Could not load cinema details.</Text></View>;

    const getAddressString = () => {
        if (typeof cinema.address === "string") {
        return cinema.address;
        }
        if (cinema.address && typeof cinema.address === "object") {
        const parts: string[] = [];
        if (cinema.address.street) parts.push(cinema.address.street);
        if (cinema.address.city) parts.push(cinema.address.city);
        if (cinema.address.zipcode) parts.push(cinema.address.zipcode);
        return parts.join(", ");
        }
        return null;
    };

    const addressString = getAddressString();

    const getWebsiteUrl = () => {
        if (!cinema.website) return null;
        if (cinema.website.startsWith("http://") || cinema.website.startsWith("https://")) {
        return cinema.website;
        }
        return `https://${cinema.website}`;
    };

    const websiteUrl = getWebsiteUrl();

    const cleanDescription = cinema.description
        ?.replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?b>/gi, "") 
        .trim();

    return (
        <View style={styles.container}>
        <View style={styles.headerCard}>
            <Text style={styles.name}>{cinema.name}</Text>
            {cleanDescription ? <Text style={styles.desc}>{cleanDescription}</Text> : null}
            {addressString ? <Text style={styles.meta}>Address: {addressString}</Text> : null}
            {cinema.phone ? <Text style={styles.meta}>Phone: {cinema.phone}</Text> : null}
            {websiteUrl ? (
            <Text style={[styles.meta, styles.link]} onPress={() => websiteUrl && Linking.openURL(websiteUrl)}>{cinema.website}</Text>
            ) : null}
        </View>

        <Text style={styles.sectionTitle}>Movies & Showtimes</Text>
        <FlatList
            data={movies}
            keyExtractor={(m, index) => `${m.id || m.title}-${index}`}
            renderItem={({ item }) => {
            const relevantShowtimes = (item.showtimes || []).filter((s) => String(s.cinemaId) === String(id));
            const genreNames = (item.genres || []).map((g: any) => {
                if (typeof g === "string") return g;
                return g.Name || g.NameEN || "";
            }).filter(Boolean);

            return (
                <TouchableOpacity style={styles.movieCard} onPress={() => router.push({ pathname: "/movie", params: { movieData: JSON.stringify(item) } })}>
                {item.poster ? (
                    <Image source={{ uri: item.poster }} style={styles.poster} />
                ) : (
                    <View style={[styles.poster, styles.posterPlaceholder]}><Text>No Image</Text></View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={styles.movieTitle}>{item.title} {item.year ? `(${item.year})` : ""}</Text>
                    <Text style={styles.genres}>{genreNames.join(", ")}</Text>
                    <Text style={styles.showtimes}>Showtimes: {relevantShowtimes.map(s => s.time || s.startsAt || "No time").join(", ") || "—"}</Text>
                </View>
                </TouchableOpacity>
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
    movieCard: { flexDirection: "row", padding: SPACING.md, marginTop: SPACING.sm, backgroundColor: COLORS.white, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, ...Platform.select({ ios: { shadowColor: COLORS.border, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 1 } }) },
    poster: { width: 72, height: 108, borderRadius: 6, marginRight: SPACING.md, backgroundColor: "#eee" },
    posterPlaceholder: { justifyContent: "center", alignItems: "center" },
    movieTitle: { fontSize: FONT_SIZES.large, fontWeight: "600", color: COLORS.textPrimary },
    genres: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary, marginTop: 6 },
    showtimes: { fontSize: FONT_SIZES.medium, marginTop: 8, color: COLORS.textPrimary },
    sep: { height: 8 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    error: { color: "red", fontSize: 14 },
});
