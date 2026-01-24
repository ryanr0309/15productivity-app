import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { colors } from "../../constants/colors";
import LottieView from "lottie-react-native";

export default function InsightsEmptyState() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.card}>
          <LottieView
                    autoPlay
                    loop
                    style={{ width: 280, height: 280 }}
                    source={require("../../assets/animations/empty.json")}
                  />

          <Text style={styles.title}>No completed days yet</Text>

          <Text style={styles.subtitle}>
            Log time blocks and complete your first day on Home to start generating insights and analytics.
          </Text>

     
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flexGrow: 1,                 // 🔑 fills screen
    justifyContent: "center",    // 🔑 vertical center
    alignItems: "center",        // 🔑 horizontal center
    paddingHorizontal: 24,
    paddingBottom: 28,
  },

  card: {
    alignItems: "center",
    gap: 16,
    maxWidth: 300,
  },

  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },

  button: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
