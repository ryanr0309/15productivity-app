import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import LottieView from "lottie-react-native";

export default function HomeAnalyticsLoading() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <LottieView
          source={require("../../assets/animations/Trail_loading.json")}
          autoPlay
          loop
          style={styles.lottie}
        />

        <Text style={styles.title}>Analyzing your day</Text>
        <Text style={styles.subtitle}>
          Calculating focus patterns and productivity insights…
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B1224",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  lottie: {
    width: 220,
    height: 220,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
});
