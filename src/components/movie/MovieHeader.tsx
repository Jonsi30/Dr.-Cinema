import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";

interface MovieHeaderProps {
    poster?: string;
    title: string;
    year?: number;
    rating?: string;
    duration?: number;
    country?: string;
}

export const MovieHeader: React.FC<MovieHeaderProps> = ({
    poster,
    title,
    year,
    rating,
    duration,
    country,
}) => {
    // determine numeric age from rating
    const extractNum = (s?: string): number | null => {
        if (!s) return null;
        const m = String(s).match(/(\d{1,3})/);
        if (m) return parseInt(m[1], 10);
        return null;
    };

    const r = rating;
    const num = extractNum(typeof r === "string" ? r : String(r ?? ""));
    let bgColor = styles.badgeGray.backgroundColor;
    if (typeof num === "number" && !Number.isNaN(num)) {
        if (num < 12) bgColor = styles.badgeGreen.backgroundColor;
        else if (num < 16) bgColor = styles.badgeYellow.backgroundColor;
        else bgColor = styles.badgeRed.backgroundColor;
    }
    const badgeText = typeof r === "string" ? r : r !== undefined ? String(r) : "N/A";

    return (
        <View style={styles.container}>
            {poster ? (
                <Image source={{ uri: poster }} style={styles.poster} />
            ) : null}

            <View style={styles.info}>
                <View style={styles.titleBlock}>
                    <Text style={styles.title} numberOfLines={2}>
                        {title}
                    </Text>

                    <View style={[styles.badgeRect, { backgroundColor: bgColor }]}> 
                        <Text style={styles.badgeRectText}>{badgeText}</Text>
                    </View>
                </View>

                <View style={styles.details}>
                    {year ? <Text style={styles.detail}>{year}</Text> : null}
                    {duration ? (
                        <Text style={styles.detail}>{duration} min</Text>
                    ) : null}
                    {country ? <Text style={styles.detail}>{country}</Text> : null}
                    {rating ? <Text style={styles.detail}>{rating}</Text> : null}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    poster: {
        width: "100%",
        height: 300,
        borderRadius: 8,
        marginBottom: SPACING.md,
        backgroundColor: COLORS.border,
    },
    info: {
        gap: SPACING.sm,
    },
    title: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    details: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: SPACING.sm,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    titleBlock: {
        flexDirection: 'column',
        gap: SPACING.xs,
    },
    detail: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        backgroundColor: COLORS.border,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    badgeRect: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
        borderRadius: 6,
        minWidth: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeRectText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: FONT_SIZES.small,
    },
    badgeGreen: { backgroundColor: '#4CAF50' },
    badgeYellow: { backgroundColor: '#FFC107' },
    badgeRed: { backgroundColor: '#F44336' },
    badgeGray: { backgroundColor: '#9E9E9E' },
});
