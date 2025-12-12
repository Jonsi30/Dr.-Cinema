import React from "react";
import { Alert, Share, StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface MovieShareButtonProps {
    movieId: string;
    title: string;
    year?: string | number;
}

function buildMovieLink(movieId: string) {
    const scheme = "drcinema";
    const appLink = `${scheme}://movie/${encodeURIComponent(movieId)}`;
    const webFallback = `https://kvikmyndir.is/movie/${encodeURIComponent(movieId)}`;
    return { appLink, webFallback };
}

export const MovieShareButton: React.FC<MovieShareButtonProps> = ({ movieId, title, year }) => {
    const handleShare = async () => {
        try {
        const { appLink, webFallback } = buildMovieLink(movieId);
        const message = `Check out this movie: ${title}${year ? ` (${year})` : ""}\nOpen in app: ${appLink}\nOr view online: ${webFallback}`;
        await Share.share({ message });
        } catch (err) {
        console.error(err);
        Alert.alert("Share failed", "Could not share this movie.");
        }
    };

    return (
        <TouchableOpacity style={styles.button} onPress={handleShare}>
        <Text style={styles.buttonText}>Share This Movie</Text>
        </TouchableOpacity>
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
    buttonText: {
        color: COLORS.white,
        fontWeight: "600",
        fontSize: FONT_SIZES.medium,
    },
});

export default MovieShareButton;
