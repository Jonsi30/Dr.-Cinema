import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../src/constants/theme";
import { useMovies } from "../src/hooks/useMovies";
import { Movie } from "../src/types/types";

export default function Index() {
  const router = useRouter();
  const { data: movies, loading, error } = useMovies();

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: "/movie",
      params: { 
        movieId: movie.id,
        movieTitle: movie.title,
        movieData: JSON.stringify(movie),
        cinemaId: "" 
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !movies.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "No movies found"}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={movies}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleMoviePress(item)}
        >
          {item.poster && (
            <Image source={{ uri: item.poster }} style={styles.poster} />
          )}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {item.year && (
              <Text style={styles.year}>
                {item.year} • {item.genres?.join(", ")}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      numColumns={2}
      columnWrapperStyle={styles.row}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  row: {
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  poster: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.border,
  },
  info: {
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  year: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
});
