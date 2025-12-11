import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { fetchCinemas } from "../src/api/cinemas";
import CinemaCard from "../src/components/CinemaCard";
import { COLORS, SPACING } from "../src/constants/theme";
import { Cinema } from "../src/types/types";

export default function CinemasScreen() {
    const router = useRouter();
    const [theaters, setTheaters] = useState<Cinema[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchCinemas();
            const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
            if (mounted) setTheaters(sorted);
        } catch (e: any) {
            console.error("fetchCinemas error:", e);
            if (mounted) setError(e.message ?? "Failed to load cinemas");
        } finally {
            if (mounted) setLoading(false);
        }
        }
        load();
        return () => { mounted = false; };
    }, []);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
    if (error) return <View style={styles.center}><Text>Error: {error}</Text></View>;
    if (!theaters || theaters.length === 0) return <View style={styles.center}><Text>No theaters found.</Text></View>;

    return (
        <View style={styles.container}>
            <FlatList
            data={theaters}
            keyExtractor={(item) => String(item.id ?? item.name)}
            renderItem={({ item }) => (
                <CinemaCard cinema={item} onPress={() => router.push({ pathname: "/cinema", params: { id: String(item.id) } })} />
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: SPACING.md, backgroundColor: COLORS.background },
    list: { paddingBottom: SPACING.xl },
    sep: { height: 8 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});