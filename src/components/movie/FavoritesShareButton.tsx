import React from "react";
import { Alert, Share, StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface Favorite {
    id: string;
    title?: string;
    year?: string | number;
}

interface FavoritesShareButtonProps {
    favorites: Favorite[];
}

export const FavoritesShareButton: React.FC<FavoritesShareButtonProps> = ({ favorites }) => {
    const handleShare = async () => {
        try {
        if (!favorites || favorites.length === 0) {
            Alert.alert("No favourites", "You have no favourites to share.");
            return;
        }

        const encodedData = encodeURIComponent(JSON.stringify(favorites));
        const shareLink = `drcinema://favourites?data=${encodedData}`;
        const message = `Check out my favourite movies!\nOpen in app: ${shareLink}`;

        await Share.share({ message });
        } catch (err) {
        console.error(err);
        Alert.alert("Share failed", "Could not share favourites.");
        }
    };

    return (
        <TouchableOpacity style={styles.button} onPress={handleShare}>
        <Text style={styles.buttonText}>Share Favourites List</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#1B73E8",
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

export default FavoritesShareButton;
