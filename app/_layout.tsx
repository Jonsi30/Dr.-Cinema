import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { setApiClientConfig } from "../src/api/client";

setApiClientConfig({
  username: process.env.EXPO_PUBLIC_KVIKMYNDIR_USERNAME,
  password: process.env.EXPO_PUBLIC_KVIKMYNDIR_PASSWORD,
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          title: "Favourites",
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
    </GestureHandlerRootView>
  );
}
