import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";
import React from "react";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Insert into public.users
    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
      });
    }

    setLoading(false);
    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={handleSignup}
        style={styles.button}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating..." : "Sign Up"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/login")}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0F172A",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
    borderRadius: 12,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#4DA3FF",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    color: "#B0B8D4",
    marginTop: 16,
    textAlign: "center",
  },
  error: {
    color: "#FF6B6B",
    marginBottom: 8,
  },
});
