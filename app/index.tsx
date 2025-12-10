import { Link } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text>Temporary Home Screen</Text>
      
      <Link href="/authDev" asChild>
        <Button title="Go to Authentication screen" />
      </Link>

      <Link href="/cinemas" asChild>
        <Button title="Go to Cinemas" />
      </Link>

      <Link href="/cinema" asChild>
        <Button title="Go to Cinema" />
      </Link>
    </View>
  );
}
