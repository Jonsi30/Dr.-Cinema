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
  // Helper: parse release timestamp for sorting
  const parseReleaseTimestamp = (raw?: string): number | null => {
    if (!raw) return null;
    const dt = new Date(raw);
    if (!Number.isNaN(dt.getTime())) return dt.getTime();
    const cleaned = String(raw).replace(/\s+GMT.*$/i, "").trim();
    const m = cleaned.match(/(\d{4}-\d{2}-\d{2})/);
    if (m && m[1]) {
      const dt2 = new Date(m[1]);
      if (!Number.isNaN(dt2.getTime())) return dt2.getTime();
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
    <MovieCard movie={item} onPress={() => handlePress(item)} showGenres={false} />
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

      {/* Trailer modal removed — Upcoming list now navigates to Movie page for details */}
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
