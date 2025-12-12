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
 * and return an array of movie-like objects { id, title, year, cinemaId? }.
 */
async function readFavoritesFromStorage(): Promise<{ id: string; title?: string; year?: number | string; cinemaId?: string }[]> {
    const possibleKeys = ["favorites", "favourites", "Favorites", "Favourites"];
    for (const key of possibleKeys) {
        try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;

        // Normalize entries into { id, title, year, cinemaId? } shape
        const normalized = parsed
            .map((p: any) => {
            if (!p) return null;
            if (typeof p === "object") {
                const id = p.id ?? p.movieId ?? p._id ?? p.ID ?? p.Id;
                const title = p.title ?? p.name ?? p.movieTitle;
                const year = p.year ?? p.releaseDate ?? p.releaseYear;
                // Attempt to find an associated cinemaId if stored
                const cinemaId = p.cinemaId ?? p.cinema?.id ?? p.theaterId ?? p.theatreId ?? p.theater?.id ?? undefined;
                if (!id) return null;
                return {
                id: String(id),
                title: title ? String(title) : undefined,
                year: year ?? undefined,
                cinemaId: cinemaId ? String(cinemaId) : undefined,
                };
            }
            // If it's a primitive (string id), return minimal
            return { id: String(p), title: undefined, year: undefined, cinemaId: undefined };
            })
            .filter(Boolean) as { id: string; title?: string; year?: number | string; cinemaId?: string }[];

        if (normalized.length > 0) return normalized;
        } catch (err) {
        // ignore parse errors and try next key
        }
    }
    return [];
}

/**
 * Build a deep link for a movie using your app's scheme from app.json (drcinema).
 * Optionally include cinemaId as a query param so the Movie screen can show only that cinema's showtimes.
 * Also provide a web fallback URL for recipients on desktop/web.
 */
function buildMovieLinks(movieId: string, cinemaId?: string) {
    const scheme = "drcinema"; // from app.json -> "scheme": "drcinema"
    const appScheme = cinemaId
        ? `${scheme}://movie/${encodeURIComponent(movieId)}?cinemaId=${encodeURIComponent(cinemaId)}`
        : `${scheme}://movie/${encodeURIComponent(movieId)}`;

    // Fallback web URL — adjust to your real public page if you have one
    const fallbackWeb = `https://kvikmyndir.is/movie/${encodeURIComponent(movieId)}`;
    return { appScheme, fallbackWeb };
}

export const MovieShareButton: React.FC<MovieShareButtonProps> = ({ movieId, title, year }) => {
        const handleShareMovie = async () => {
        try {
        const { appScheme, fallbackWeb } = buildMovieLinks(movieId);
        // Put the human-readable fallback in the message, and the deep link in `url`
        const message = `Check out this movie: ${title}${year ? ` (${year})` : ""}\nView online: ${fallbackWeb}`;
        await Share.share({ message, url: appScheme });
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

        // Build a readable message with a deep link for each movie (including optional cinema context)
        const lines: string[] = ["My favourite movies:"];
        for (const fav of favorites) {
            const { appScheme, fallbackWeb } = buildMovieLinks(fav.id, fav.cinemaId);
            const titleStr = fav.title ? `${fav.title}${fav.year ? ` (${fav.year})` : ""}` : `Movie ID: ${fav.id}`;
            lines.push(`${titleStr}\nView online: ${fallbackWeb}\n`); // keep fallback in text
        }
        const message = lines.join("\n");

        // Use first favourite deep link as the shared url (many clients only allow one url field)
        const firstUrl = favorites[0] ? buildMovieLinks(favorites[0].id, favorites[0].cinemaId).appScheme : undefined;
        await Share.share({ message, url: firstUrl });
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
