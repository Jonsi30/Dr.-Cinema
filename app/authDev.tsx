import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { authenticate, TOKEN_KEY } from "../src/services/api";

export default function AuthDev() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

    async function onAuth() {
    try {
        const token = await authenticate(username.trim(), password);
        console.log("Got token:", token);
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        console.log("Stored token:", stored);
        Alert.alert("Success", "Token saved to AsyncStorage");
    } catch (err: any) {
        console.error("Auth error:", err);
        Alert.alert("Auth failed", err.message || String(err));
        }
    }

  return (
    <View style={styles.container}>
      <Text>Dev Auth (temporary) — do NOT commit credentials</Text>
      <TextInput
        placeholder="username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <Button
        title={loading ? "Working…" : "Authenticate"}
        onPress={onAuth}
        disabled={loading || !username || !password}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, justifyContent: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 8, marginVertical: 8, borderRadius: 6 },
});
