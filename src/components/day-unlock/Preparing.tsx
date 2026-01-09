import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export function HomeLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4DA3FF" />
      <Text style={styles.text}>Preparing your day...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  text: {
    color: "#B0B8D4",
    fontSize: 16,
    marginTop: 12,
  },
});
