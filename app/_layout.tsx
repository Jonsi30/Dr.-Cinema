import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { setApiClientConfig } from "../src/api/client";

// Inject runtime credentials from process.env (safe for local dev).
// For production, use secure secrets and avoid committing values.
setApiClientConfig({
  username: process.env.EXPO_PUBLIC_KVIKMYNDIR_USERNAME,
  password: process.env.EXPO_PUBLIC_KVIKMYNDIR_PASSWORD,
});
// Helpful debug logs during development. Remove or guard in production.
console.log("KVIK username:", process.env.EXPO_PUBLIC_KVIKMYNDIR_USERNAME);
console.log("KVIK password present:", !!process.env.EXPO_PUBLIC_KVIKMYNDIR_PASSWORD);

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Movies",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="movie" color={color} size={size} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="cinemas" 
        options={{ 
          title: "Cinemas",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="location-on" color={color} size={size} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="upcomingMovies" 
        options={{ 
          title: "Upcoming",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="schedule" color={color} size={size} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="favourites" 
        options={{ 
          title: "Favorites",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" color={color} size={size} />
          ),
        }} 
      />
      {/* Hidden screens for navigation */}
      <Tabs.Screen name="cinema" options={{ href: null }} />
      <Tabs.Screen name="movie" options={{ href: null }} />
      <Tabs.Screen name="authDev" options={{ href: null }} />
    </Tabs>
  );
}
