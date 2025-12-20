import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.title}>15 Productivity</Text>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorations}>
        <View style={styles.calendarMock} />
        <View style={styles.clockMock} />
      </View>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginBold}>Log in</Text>
          </Text>
        </Pressable>

        <Pressable
          style={styles.nextButton}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Ionicons name="arrow-forward" size={24} color="#000000" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1B3D",
    padding: 24,
  },

  header: {
    marginTop: 100,
  },

  welcome: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "400",
  },

  title: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 4,
  },

  decorations: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  calendarMock: {
    position: "absolute",
    left: -20,
    width: 180,
    height: 180,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    transform: [{ rotate: "-12deg" }],
  },

  clockMock: {
    position: "absolute",
    right: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.9)",
  },

  footer: {
    alignItems: "center",
    marginBottom: 24,
  },

  loginText: {
    color: "rgba(255,255,255,0.75)",
    marginBottom: 20,
  },

  loginBold: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  nextButton: {
    backgroundColor: "#FFFFFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
});
