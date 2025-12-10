import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchTheaters } from "../src/services/api";
import { Theater } from "../src/types/types";

export default function CinemasScreen() {
  const router = useRouter();
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTheaters();
        console.log("RAW /theaters response:", data);
        const list: Theater[] = Array.isArray(data) ? data : data.theaters ?? [];
        const normalized = list.map((t: any) => ({
          ...t,
          website: typeof t.website === "string" && t.website.length && !/^https?:\/\//i.test(t.website)
            ? `https://${t.website}`
            : t.website,
        }));
        const sorted = normalized.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        if (mounted) setTheaters(sorted);
      } catch (e: any) {
        console.error("fetchTheaters error full:", e, e?.response?.data);
        if (mounted) setError(e.message ?? "Failed to load theaters");
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
        keyExtractor={(item) => String(item.id ?? item._id ?? item.name)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              router.push({ pathname: "/cinema", params: { id: String(item.id ?? item._id) } });
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              {item.website ? (
                <Text style={styles.link} onPress={() => Linking.openURL(item.website)}>{item.website}</Text>
              ) : null}
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  title: { fontSize: 16, fontWeight: "600" },
  link: { fontSize: 13, color: "#1976d2", marginTop: 4 },
  chev: { fontSize: 22, color: "#999", marginLeft: 8 },
  sep: { height: 1, backgroundColor: "#eee" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});
