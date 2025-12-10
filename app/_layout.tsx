import { Stack } from "expo-router";
import { COLORS } from "../src/constants/theme";

export default function RootLayout() {
    return (
        <Stack
            screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontWeight: "bold" },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Home" }} />
        </Stack>
  );
}
