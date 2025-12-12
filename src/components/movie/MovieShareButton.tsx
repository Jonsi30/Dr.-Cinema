import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface MovieShareButtonProps {
  movieId: string;
  title: string;
  year?: string | number;
}

/**
 * Helper: try multiple plausible storage keys for favorites (english/uk spelling)
 * and return an array of movie-like objects { id, title, year }.
 */
async function readFavoritesFromStorage(): Promise<{ id: string; title?: string; year?: number | string }[]> {
  const possibleKeys = ["favorites", "favourites", "Favorites", "Favourites"];
  for (const key of possibleKeys) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      // Normalize entries into { id, title, year } shape
      const normalized = parsed
        .map((p: any) => {
          if (!p) return null;
          // If item appears to be a full movie object, extract fields
          if (typeof p === "object") {
            const id = p.id ?? p.movieId ?? p._id ?? p.ID ?? p.Id;
            const title = p.title ?? p.name ?? p.movieTitle;
            const year = p.year ?? p.releaseDate ?? p.releaseYear;
            if (!id) return null;
            return { id: String(id), title: title ? String(title) : undefined, year: year ?? undefined };
          }
          // If it's a primitive (string id), return minimal
          return { id: String(p), title: undefined, year: undefined };
        })
        .filter(Boolean) as { id: string; title?: string; year?: number | string }[];

      if (normalized.length > 0) return normalized;
    } catch (err) {
      // ignore parse errors and try next key
      // console.debug("readFavoritesFromStorage parse error for key", key, err);
    }
  }
  return [];
}

/**
 * Build a deep link for a movie. Adjust scheme (`myapp`) to match your app's actual linking config.
 * Also include an https fallback link so shared messages work nicely on web/desktop.
 */
function buildMovieLinks(movieId: string) {
  const appScheme = `myapp://movie/${encodeURIComponent(movieId)}`; // deep link
  // If you have a real website route, prefer that as the https fallback. Replace domain if available.
  const fallbackWeb = `https://kvikmyndir.is/movie/${encodeURIComponent(movieId)}`;
  return { appScheme, fallbackWeb };
}

export const MovieShareButton: React.FC<MovieShareButtonProps> = ({ movieId, title, year }) => {
  const handleShareMovie = async () => {
    try {
      const { appScheme, fallbackWeb } = buildMovieLinks(movieId);
      const message = `Check out this movie: ${title}${year ? ` (${year})` : ""}\nOpen in app: ${appScheme}\nOr view online: ${fallbackWeb}`;
      // The Share API supports an optional url field on some platforms
      await Share.share({ message, url: fallbackWeb });
    } catch (error) {
      console.error("Error sharing movie:", error);
      Alert.alert("Share failed", "Could not share the movie. Please try again.");
    }
  };

  const handleShareFavorites = async () => {
    try {
      const favorites = await readFavoritesFromStorage();
      if (!favorites || favorites.length === 0) {
        Alert.alert("No favourites", "You have no favourites to share.");
        return;
      }

      // Build a readable message with a deep link for each movie
      const lines: string[] = ["My favourite movies:"];
      for (const fav of favorites) {
        const { appScheme, fallbackWeb } = buildMovieLinks(fav.id);
        const titleStr = fav.title ? `${fav.title}${fav.year ? ` (${fav.year})` : ""}` : `Movie ID: ${fav.id}`;
        // include both the deep link and a web fallback so recipients on other platforms can still open it
        lines.push(`${titleStr}\nOpen in app: ${appScheme}\nView online: ${fallbackWeb}\n`);
      }
      const message = lines.join("\n");

      await Share.share({ message });
    } catch (error) {
      console.error("Error sharing favourites:", error);
      Alert.alert("Share failed", "Could not share favourites. Please try again.");
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={handleShareMovie}>
        <Text style={styles.buttonText}>Share This Movie</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.favoritesButton]} onPress={handleShareFavorites}>
        <Text style={styles.buttonText}>Share Favorites List</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    alignItems: "center",
    marginVertical: SPACING.xs,
  },
  favoritesButton: {
    backgroundColor: "#1B73E8",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONT_SIZES.medium,
  },
});

export default MovieShareButton;
