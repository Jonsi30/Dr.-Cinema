import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    View,
} from "react-native";
import { fetchUpcomingMovies } from "../src/api/movies";
import MovieCard from "../src/components/MovieCard";
import { COLORS, FONT_SIZES, SPACING } from "../src/constants/theme";
import { UpcomingMovie } from "../src/types/types";

export default function UpcomingMovies() {
    const router = useRouter();
    const [items, setItems] = useState<UpcomingMovie[] | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchUpcomingMovies()
        .then((res) => {
            if (!mounted) return;
            // sort ascending by backend field `release-dateIS`
            const sorted = (res || []).slice().sort((a: any, b: any) => {
            const ra = a?.["release-dateIS"] ?? null;
            const rb = b?.["release-dateIS"] ?? null;
            const ta = parseReleaseTimestamp(ra) ?? Infinity;
            const tb = parseReleaseTimestamp(rb) ?? Infinity;
            return ta - tb;
            });
            setItems(sorted as UpcomingMovie[]);
        })
        .catch((e) => console.warn("Failed to load upcoming movies:", e))
        .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);
    const parseReleaseTimestamp = (raw?: string): number | null => {
        if (!raw) return null;
        const s = String(raw).trim();

        // Try native Date parsing first (handles ISO and many common formats)
        const tryTs = Date.parse(s);
        if (!Number.isNaN(tryTs)) return tryTs;

        // Strip trailing GMT/zone clutter and try again
        const cleaned = s.replace(/\s+GMT.*$/i, "").trim();
        const tryTs2 = Date.parse(cleaned);
        if (!Number.isNaN(tryTs2)) return tryTs2;

        // Try explicit ISO-like YYYY-MM-DD or YYYY/MM/DD
        const iso = cleaned.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (iso) {
        const y = Number(iso[1]);
        const m = Number(iso[2]);
        const d = Number(iso[3]);
        const dt = new Date(y, m - 1, d);
        if (!Number.isNaN(dt.getTime())) return dt.getTime();
        }

        // Try common d/m/y or d.m.y formats
        const dmy = cleaned.match(/(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/);
        if (dmy) {
        const d = Number(dmy[1]);
        const m = Number(dmy[2]);
        const y = Number(dmy[3]);
        const dt = new Date(y, m - 1, d);
        if (!Number.isNaN(dt.getTime())) return dt.getTime();
        }

        // Try month name + year (e.g. "Jan 2026" or "January 2026")
        const monthYear = cleaned.match(/([A-Za-z]+)\s+(\d{4})/);
        if (monthYear) {
        const monthName = monthYear[1];
        const y = Number(monthYear[2]);
        const dt = new Date(`${monthName} 1, ${y}`);
        if (!Number.isNaN(dt.getTime())) return dt.getTime();
        }

        // Fallback: extract year only and use Jan 1st of that year
        const yearMatch = cleaned.match(/(19|20)\d{2}/);
        if (yearMatch) {
        const y = Number(yearMatch[0]);
        const dt = new Date(y, 0, 1);
        if (!Number.isNaN(dt.getTime())) return dt.getTime();
        }

        return null;
    };

    const handlePress = (movie: UpcomingMovie) => {
        router.push({
        pathname: "/movie",
        params: {
            movieId: movie.id,
            movieTitle: movie.title,
            movieData: JSON.stringify(movie),
        },
        });
    };

    const renderItem = ({ item }: { item: UpcomingMovie }) => (
        <MovieCard movie={item} onPress={() => handlePress(item)} showGenres={false} showYear={false} />
    );

    return (
        <View style={styles.container}>
        {loading && !items ? (
            <ActivityIndicator />
        ) : (
            <View style={styles.innerContainer}>
            <FlatList
                data={items || []}
                keyExtractor={(i, index) => `${String(i?.id ?? i?.title ?? 'upcoming')}-${index}`}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
                contentContainerStyle={{ paddingBottom: SPACING.xl }}
            />
            </View>
        )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
    innerContainer: { flex: 1 },
    row: { flexDirection: "row", gap: SPACING.md, alignItems: "center" },
    thumb: { width: 90, height: 135, borderRadius: 6, backgroundColor: COLORS.border },
    meta: { flex: 1 },
    title: { fontSize: FONT_SIZES.xlarge, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: SPACING.md, textAlign: 'center' },
    date: { color: COLORS.textSecondary, marginTop: 4 },
    trailerButton: { marginTop: SPACING.sm },
    trailerButtonText: { color: COLORS.primary, fontWeight: "600" },
    noTrailer: { marginTop: SPACING.sm, color: COLORS.textSecondary, fontStyle: "italic" },
});
