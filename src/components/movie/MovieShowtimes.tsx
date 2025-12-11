import React from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";
import { ShowTime } from "../../types/types";

interface MovieShowtimesProps {
    showtimes: ShowTime[];
}

export const MovieShowtimes: React.FC<MovieShowtimesProps> = ({
    showtimes,
}) => {
    if (!showtimes || showtimes.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.label}>Showtimes</Text>
                <Text style={styles.emptyState}>
                    No showtimes available for this cinema
                </Text>
            </View>
        );
    }

    const handlePurchase = (url?: any) => {
        // Only accept non-empty strings
        if (!url || typeof url !== "string") return;
        const trimmed = url.trim();
        if (!trimmed || trimmed === "undefined") return;

        // Ensure URL has protocol
        const fullUrl =
            trimmed.startsWith("http://") || trimmed.startsWith("https://")
                ? trimmed
                : `https://${trimmed}`;

        try {
            Linking.openURL(fullUrl).catch(() => {
                alert("Unable to open purchase link");
            });
        } catch (err) {
            console.warn("Invalid purchase URL:", url, err);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Showtimes</Text>
            <ScrollView
                horizontal
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {showtimes.map((showtime, idx) => {
                    const st = showtime as any;
                    return (
                        <View key={idx} style={styles.showtimeCard}>
                            <Text style={styles.time}>
                                {st.time || st.startsAt || "—"}
                            </Text>
                            {st.info && (
                                <Text style={styles.auditorium}>{st.info}</Text>
                            )}
                            {st.auditorium && (
                                <Text style={styles.auditorium}>
                                    Hall {st.auditorium}
                                </Text>
                            )}
                            {(
                                st.purchase_url || st.purchaseUrl ||
                                st.purchaseURL || st.purchase || st.url
                            ) && (
                                <Text
                                    style={styles.purchaseButton}
                                    onPress={() =>
                                        handlePurchase(
                                            st.purchase_url ||
                                                st.purchaseUrl ||
                                                st.purchaseURL ||
                                                st.purchase ||
                                                st.url
                                        )
                                    }
                                >
                                    Buy Ticket
                                </Text>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    label: {
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZES.medium,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    scrollContent: {
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
    },
    showtimeCard: {
        backgroundColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        alignItems: "center",
        minWidth: 120,
        gap: 4,
    },
    time: {
        fontSize: FONT_SIZES.medium,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    auditorium: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
    },
    purchaseButton: {
        fontSize: FONT_SIZES.small,
        color: COLORS.primary,
        fontWeight: "600",
        marginTop: SPACING.xs,
    },
    emptyState: {
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        fontStyle: "italic",
    },
});
