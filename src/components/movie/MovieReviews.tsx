import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface Review {
    id: string;
    text: string;
    rating: number;
}

interface MovieReviewsProps {
    movieId: string;
}

export const MovieReviews: React.FC<MovieReviewsProps> = ({ movieId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [text, setText] = useState("");
    const [rating, setRating] = useState(0);

    const storageKey = `reviews_${movieId}`;

    useEffect(() => {
        (async () => {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) setReviews(JSON.parse(stored));
        })();
    }, [movieId]);

    const saveReview = async () => {
        if (!text.trim() || rating === 0) {
        Alert.alert("Please enter a review and select a rating");
        return;
        }

        const newReview: Review = {
        id: Date.now().toString(),
        text: text.trim(),
        rating,
        };

        const updatedReviews = [newReview, ...reviews];
        setReviews(updatedReviews);
        await AsyncStorage.setItem(storageKey, JSON.stringify(updatedReviews));

        setText("");
        setRating(0);
    };

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Reviews & Ratings</Text>

        <View style={styles.inputContainer}>
            <TextInput
            style={styles.textInput}
            placeholder="Write your review..."
            value={text}
            onChangeText={setText}
            multiline
            />

            <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Text style={[styles.star, s <= rating ? styles.starSelected : {}]}>★</Text>
                </TouchableOpacity>
            ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={saveReview}>
            <Text style={styles.buttonText}>Submit Review</Text>
            </TouchableOpacity>
        </View>

        {reviews.length === 0 ? (
            <Text style={styles.empty}>No reviews yet.</Text>
        ) : (
            <View>
            {reviews.map((item) => (
                <View key={item.id} style={styles.reviewCard}>
                <Text style={styles.reviewRating}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</Text>
                <Text style={styles.reviewText}>{item.text}</Text>
                </View>
            ))}
            </View>
        )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.md },
    title: { fontSize: FONT_SIZES.large, fontWeight: "600", marginBottom: SPACING.sm, color: COLORS.textPrimary },
    inputContainer: { marginBottom: SPACING.md },
    textInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: SPACING.sm, marginBottom: SPACING.sm, minHeight: 60, backgroundColor: COLORS.white },
    starsContainer: { flexDirection: "row", marginBottom: SPACING.sm },
    star: { fontSize: 24, color: COLORS.textSecondary, marginRight: 4 },
    starSelected: { color: "#FFD700" },
    button: { backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: 6, alignItems: "center" },
    buttonText: { color: COLORS.white, fontWeight: "600" },
    reviewCard: { backgroundColor: COLORS.white, padding: SPACING.sm, borderRadius: 6, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
    reviewRating: { fontSize: FONT_SIZES.medium, marginBottom: 4 },
    reviewText: { fontSize: FONT_SIZES.small, color: COLORS.textSecondary },
    empty: { fontStyle: "italic", color: COLORS.textSecondary },
});
