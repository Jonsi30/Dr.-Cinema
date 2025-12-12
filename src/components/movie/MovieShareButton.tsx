import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Share, StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface MovieShareButtonProps {
    movieId: string;
    title: string;
    year?: string | number;
}

export const MovieShareButton: React.FC<MovieShareButtonProps> = ({ movieId, title, year }) => {
    const handleShareMovie = async () => {
        try {
        const deepLink = `myapp://movie/${movieId}`;
        const message = `Check out this movie: ${title}${year ? ` (${year})` : ""}\nWatch here: ${deepLink}`;
        await Share.share({ message });
        } catch (error) {
        console.error("Error sharing movie:", error);
        }
    };

  const handleShareFavorites = async () => {
        try {
        const stored = await AsyncStorage.getItem("favorites");
        const favorites: { id: string; title: string; year?: number }[] = stored ? JSON.parse(stored) : [];
        if (favorites.length === 0) {
            alert("No favorites to share!");
            return;
        }
        const message = "My favorite movies:\n" + favorites.map(f => `${f.title}${f.year ? ` (${f.year})` : ""}`).join("\n");
        await Share.share({ message });
        } catch (error) {
        console.error("Error sharing favorites:", error);
        }
    };

    return (
        <>
        <TouchableOpacity style={styles.button} onPress={handleShareMovie}>
            <Text style={styles.buttonText}>Share This Movie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.favoritesButton]} onPress={handleShareFavorites}>
            <Text style={styles.buttonText}>Share Favorites List</Text>
        </TouchableOpacity>
        </>
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
