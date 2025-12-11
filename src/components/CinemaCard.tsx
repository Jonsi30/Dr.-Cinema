import { useRouter } from "expo-router";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../constants/theme";
import type { Cinema } from "../types/types";


type Props = {
    cinema: Cinema;
    onPress?: (cinema: Cinema) => void;
};


export default function CinemaCard({ cinema, onPress }: Props) {
    const router = useRouter();

    const handlePress = () => {
        if (onPress) return onPress(cinema);
        router.push({ pathname: "/cinema", params: { id: String(cinema.id) } });
    };

    const openWebsite = () => {
        if (!cinema.website) return;
        const url = cinema.website.startsWith("http") ? cinema.website : `https://${cinema.website}`;
        Linking.openURL(url).catch(() => {});
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            style={styles.card}
            accessibilityRole="button"
        >
        <View style={styles.content}>
        <View style={{ flex: 1 }}>
        <Text style={styles.name}>{cinema.name}</Text>
        {cinema.website ? (
        <Text style={styles.website} onPress={openWebsite} numberOfLines={1} ellipsizeMode="tail">
        {cinema.website}
        </Text>
        ) : null}
        </View>
            <Text style={styles.chev}>›</Text>
        </View>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...Platform.select({
        ios: {
        shadowColor: COLORS.border,
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        },
        android: {
        elevation: 2,
        },
    }),
    borderWidth: 1,
    borderColor: COLORS.border,
    },
    content: { flexDirection: "row", alignItems: "center" },
    name: { fontSize: FONT_SIZES.large, fontWeight: "600", color: COLORS.textPrimary },
    website: { marginTop: 6, color: "#1B73E8", textDecorationLine: "underline", fontSize: FONT_SIZES.small },
    chev: { fontSize: 22, color: COLORS.textSecondary, marginLeft: SPACING.md },
});