import { useRoute } from "@react-navigation/native";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MovieHeader } from "../src/components/movie/MovieHeader";
import { MovieMeta } from "../src/components/movie/MovieMeta";
import { MoviePlot } from "../src/components/movie/MoviePlot";
import { MovieShowtimes } from "../src/components/movie/MovieShowtimes";
import { MovieTrailer } from "../src/components/movie/MovieTrailer";
import { COLORS, SPACING } from "../src/constants/theme";
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

  const movie: Movie | null = useMemo(() => {
    if (route.params?.movieData) {
      try {
        return JSON.parse(route.params.movieData);
      } catch {
        return null;
      }
    }
    return null;
  }, [route.params?.movieData]);

  if (!movie) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Movie data not available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <MovieHeader
        poster={movie.poster}
        title={movie.title}
        year={movie.year}
        rating={movie.rating}
        duration={movie.durationMinutes}
        country={movie.country}
      />

      <MovieMeta
        directors={movie.directors}
        writers={movie.writers}
        actors={movie.actors}
        genres={movie.genres}
        ratings={movie.ratings}
      />

      <MoviePlot plot={movie.plot} />

      {movie.showtimes && movie.showtimes.length > 0 && (
        <MovieShowtimes showtimes={movie.showtimes} />
      )}

      <MovieTrailer trailers={movie.trailers} />
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
});