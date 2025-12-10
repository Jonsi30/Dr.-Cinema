import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchCinemas } from "../src/api/cinemas";
import { fetchMovies } from "../src/api/movies";
import { Cinema, Movie } from "../src/types/types";

export default function CinemaDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!id) {
          setError("No cinema ID provided");
          return;
        }
        
        // Fetch all cinemas and find the one we need
        const allCinemas = await fetchCinemas();
        const cinemaData = allCinemas.find((c) => String(c.id) === String(id));
        
        if (!cinemaData) {
          setError("Cinema not found");
          return;
        }
        
        if (mounted) setCinema(cinemaData);
        
        // Fetch movies filtered by this cinema
        const filteredMovies = await fetchMovies({ cinemaId: id });
        console.log("Movies for cinema:", filteredMovies.length);
        console.log("Movie titles:", filteredMovies.map(m => m.title).slice(0, 5));
        console.log("First movie showtimes:", filteredMovies[0]?.showtimes || filteredMovies[0]?.schedule);
        
        // Filter movies to only show those with showtimes at THIS cinema
        const moviesForThisCinema = filteredMovies.filter(movie => {
          const showtimes = movie.showtimes || movie.schedule || [];
          return showtimes.some((st: any) => {
            const stCinemaId = st.cinema?.id || st.cinemaId;
            return String(stCinemaId) === String(id);
          });
        });
        console.log("After filtering by cinema ID:", moviesForThisCinema.length);
        if (mounted) setMovies(moviesForThisCinema);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>;
  if (!cinema) return <View style={styles.center}><Text>Could not load cinema details.</Text></View>;

  // Format complete address
  const getAddressString = () => {
    if (typeof cinema.address === "string") {
      return cinema.address;
    }
    if (cinema.address && typeof cinema.address === "object") {
      const parts = [];
      if (cinema.address.street) parts.push(cinema.address.street);
      if (cinema.address.city) parts.push(cinema.address.city);
      if (cinema.address.zipcode) parts.push(cinema.address.zipcode);
      return parts.join(", ");
    }
    return null;
  };
  
  const addressString = getAddressString();
  
  // Ensure website URL has protocol
  const getWebsiteUrl = () => {
    if (!cinema.website) return null;
    if (cinema.website.startsWith("http://") || cinema.website.startsWith("https://")) {
      return cinema.website;
    }
    return `https://${cinema.website}`;
  };
  
  const websiteUrl = getWebsiteUrl();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{cinema.name}</Text>
      {cinema.description ? <Text style={styles.desc}>{cinema.description}</Text> : null}
      {addressString ? <Text style={styles.meta}>Address: {addressString}</Text> : null}
      {cinema.phone ? <Text style={styles.meta}>Phone: {cinema.phone}</Text> : null}
      {websiteUrl ? (
        <Text style={[styles.meta, styles.link]} onPress={() => websiteUrl && Linking.openURL(websiteUrl)}>{cinema.website}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Movies & Showtimes</Text>
      <FlatList
        data={movies}
        keyExtractor={(m, index) => `${m.id || m.title}-${index}`}
        renderItem={({ item }) => {
          const relevantShowtimes = (item.showtimes || []).filter((s) => String(s.cinemaId) === String(id));
          
          // Extract genre names
          const genreNames = (item.genres || []).map((g: any) => {
            if (typeof g === "string") return g;
            return g.Name || g.NameEN || "";
          }).filter(Boolean);
          
          return (
            <TouchableOpacity style={styles.movie} onPress={() => router.push({ pathname: "/movie", params: { movieData: JSON.stringify(item) } })}>
              {item.poster ? (
                <Image source={{ uri: item.poster }} style={styles.poster} />
              ) : (
                <View style={[styles.poster, styles.posterPlaceholder]}><Text>No Image</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.movieTitle}>{item.title} {item.year ? `(${item.year})` : ""}</Text>
                <Text style={styles.genres}>{genreNames.join(", ")}</Text>
                <Text style={styles.showtimes}>Showtimes: {relevantShowtimes.map(s => s.time || s.startsAt || "No time").join(", ") || "—"}</Text>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  error: { color: "red", fontSize: 14 },
});
