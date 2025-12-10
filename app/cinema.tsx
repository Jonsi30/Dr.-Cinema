import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchMovies, fetchTheaterById } from "../src/services/api";
import { Movie, Theater } from "../src/types/types";

export default function CinemaDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [theater, setTheater] = useState<Theater | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (!theater && id) {
          const t = await fetchTheaterById(id);
          if (mounted) setTheater(t);
        }
        const allMovies = await fetchMovies();
        const list: Movie[] = Array.isArray(allMovies) ? allMovies : (allMovies.movies ?? []);
        const theaterName = (theater && theater.name) ?? null;
        const filtered = list.filter((m: any) => {
          if (!m.showtimes || !Array.isArray(m.showtimes)) return false;
          return m.showtimes.some((s: any) => {
            const tStr = typeof s.theater === "string" ? s.theater : s.theater?.name;
            const tId = typeof s.theater === "string" ? null : s.theater?._id ?? s.theater?.id;
            if (id && tId && String(tId) === String(id)) return true;
            if (theaterName && tStr && tStr.toLowerCase().includes(theaterName.toLowerCase())) return true;
            return false;
          });
        });
        if (mounted) setMovies(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, theater]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (!theater) return <View style={styles.center}><Text>Could not load cinema details.</Text></View>;

  const addressString = typeof theater.address === "string"
    ? theater.address
    : `${theater.address?.street ?? ""}${theater.address?.city ? ", " + theater.address?.city : ""}`;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{theater.name}</Text>
      {theater.description ? <Text style={styles.desc}>{theater.description}</Text> : null}
      <Text style={styles.meta}>Address: {addressString}</Text>
      {theater.phone ? <Text style={styles.meta}>Phone: {theater.phone}</Text> : null}
      {theater.website ? (
        <Text style={[styles.meta, styles.link]} onPress={() => Linking.openURL(theater.website)}>{theater.website}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Movies & Showtimes</Text>
      <FlatList
        data={movies}
        keyExtractor={(m) => String(m._id ?? m.imdbid ?? m.title)}
        renderItem={({ item }) => {
          const relevantShowtimes = (item.showtimes || []).filter((s: any) => {
            const tStr = typeof s.theater === "string" ? s.theater : s.theater?.name;
            const tId = typeof s.theater === "string" ? null : s.theater?._id ?? s.theater?.id;
            if (id && tId && String(tId) === String(id)) return true;
            if (theater.name && tStr && tStr.toLowerCase().includes(theater.name.toLowerCase())) return true;
            return false;
          });
          return (
            <TouchableOpacity style={styles.movie} onPress={() => router.push({ pathname: "/movie", params: { imdbid: item.imdbid ?? item._id } })}>
              {item.poster ? (
                <Image source={{ uri: item.poster.startsWith("http") ? item.poster : `http://image.tmdb.org/t/p/w500${item.poster}` }} style={styles.poster} />
              ) : (
                <View style={[styles.poster, styles.posterPlaceholder]}><Text>No Image</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.movieTitle}>{item.title} {item.year ? `(${item.year})` : ""}</Text>
                <Text style={styles.genres}>{(item.genres || []).join(", ")}</Text>
                <Text style={styles.showtimes}>Showtimes: {relevantShowtimes.map(s => s.time).join(", ") || "—"}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={() => <Text style={{ marginTop: 12 }}>No movies found for this cinema.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  name: { fontSize: 22, fontWeight: "700" },
  desc: { marginTop: 8 },
  meta: { marginTop: 8, fontSize: 14 },
  link: { color: "#1976d2" },
  sectionTitle: { marginTop: 16, fontSize: 18, fontWeight: "600" },
  movie: { flexDirection: "row", paddingVertical: 12, alignItems: "center" },
  poster: { width: 80, height: 120, borderRadius: 6, marginRight: 12, backgroundColor: "#eee" },
  posterPlaceholder: { justifyContent: "center", alignItems: "center" },
  movieTitle: { fontSize: 16, fontWeight: "600" },
  genres: { fontSize: 12, color: "#666", marginTop: 6 },
  showtimes: { fontSize: 13, marginTop: 8 },
  sep: { height: 1, backgroundColor: "#eee" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
