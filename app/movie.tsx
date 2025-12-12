import { useRoute } from "@react-navigation/native";
import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  const movie: Movie | null = useMemo(() => {
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
          const flattenedShowtimes = data.showtimes.flatMap((st: any) => {
            if (st.schedule && Array.isArray(st.schedule)) {
              return st.schedule;
            }
            return st;
          });
          return { ...data, showtimes: flattenedShowtimes };
        }
        
        return data;
      } catch {
        return null;
      }
    }
    return null;
  }, [route.params?.movieData]);

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
          Alert.alert("Remove favourite", `Remove ${movie.title ?? "this movie"} from favourites?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => remove(movie.id || movie.title) },
          ]);
        } else {
          await add(movie);
        }
      }}
      style={[styles.favButton, isFavourite ? styles.favButtonDanger : undefined]}
    >
      <Text style={styles.favButtonText}>{isFavourite ? "Remove favourite" : "Add to favourites"}</Text>
    </TouchableOpacity>
  );

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
        actions={FavouriteAction}
      />
      
      <MovieMeta
        directors={movie.directors}
        writers={movie.writers}
        actors={movie.actors}
        genres={movie.genres}
        ratings={movie.ratings}
      />

      <MoviePlot plot={movie.plot} />

      {(movie.showtimes || movie.schedule) && (movie.showtimes?.length || movie.schedule?.length) ? (
        <MovieShowtimes showtimes={(movie.showtimes || movie.schedule) as any} />
      ) : null}

      <MovieTrailer trailers={movie.trailers} />

      <MovieReviews movieId={movie.id || movie.title} />

      <MovieShareButton
        movieId={movie.id!}
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
    backgroundColor: '#d9534f',
  },
  favButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});