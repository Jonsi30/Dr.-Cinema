import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

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
