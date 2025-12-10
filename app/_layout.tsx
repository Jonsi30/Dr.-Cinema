import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="authDev" options={{ title: "Authentication screen" }} />
      <Stack.Screen name="cinemas" options={{ title: "Cinemas" }} />
      <Stack.Screen name="cinema" options={{ title: "Cinema" }} />
    </Stack>
  );
}
