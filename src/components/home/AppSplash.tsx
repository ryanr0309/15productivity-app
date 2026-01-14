// components/home/AppSplash.tsx
import React from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";

export function AppSplash() {
    return (
    <View style={styles.container}>
      <Text style={styles.logo}>15</Text>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                 // ✅ IMPORTANT
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 48,
    fontWeight: "800",
    marginBottom: 12,
  },
});
