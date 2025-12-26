import { View, StyleSheet } from "react-native";
import React from "react";

export default function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.icon} />
        <View style={styles.headerText} />
      </View>

      {/* Context pills */}
      <View style={styles.contextRow}>
        <View style={styles.pill} />
        <View style={styles.pill} />
        <View style={styles.pill} />
        <View style={styles.pill} />
      </View>

      {/* Prompt */}
      <View style={styles.prompt} />

      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTime} />
        <View style={styles.heroButton} />
      </View>

      {/* Productivity bar */}
      <View style={styles.productivityLabel} />
      <View style={styles.progressTrack} />

      {/* Grid */}
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={styles.block} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  headerText: {
    width: 120,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  contextRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },

  pill: {
    width: 72,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  prompt: {
    width: 200,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },

  heroCard: {
    height: 120,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    justifyContent: "space-between",
    marginBottom: 20,
  },

  heroTime: {
    width: 140,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  heroButton: {
    width: 100,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  productivityLabel: {
    width: 160,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 8,
  },

  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  block: {
    width: "30%",
    height: 72,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
