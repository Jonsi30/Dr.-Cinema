import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface MoviePlotProps {
    plot?: string;
    maxLines?: number;
}

export const MoviePlot: React.FC<MoviePlotProps> = ({ plot, maxLines = 3 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!plot) {
        return null;
    }

    const shouldTruncate = plot.split("\n").length > maxLines && !expanded;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Plot</Text>
            <Text
                style={styles.text}
                numberOfLines={expanded ? undefined : maxLines}
                ellipsizeMode="tail"
            >
                {plot}
            </Text>
            {(shouldTruncate || plot.length > 200) && (
                <Text
                    style={styles.toggleButton}
                    onPress={() => setExpanded(!expanded)}
                >
                    {expanded ? "Read less" : "Read more"}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    label: {
        fontSize: FONT_SIZES.medium,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    text: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    toggleButton: {
        fontSize: FONT_SIZES.small,
        color: COLORS.primary,
        fontWeight: "600",
    },
});
