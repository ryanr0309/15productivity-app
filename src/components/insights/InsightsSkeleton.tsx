import { View, StyleSheet, Text } from "react-native";
import React from "react";

export default function InsightsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.icon} />
        <View style={styles.headerText} />
      </View>
      

      {/* Date strip */}
      <View style={styles.dateStrip} />

      {/* Date range */}
      <View style={styles.dateRange} />

      {/* Productivity score card */}
      <View style={styles.heroCard}>
        <View style={styles.circle} />
        <View style={styles.heroMeta} />
      </View>

      {/* Time breakdown bar */}
      <View style={styles.breakdownCard} />

      {/* Insight grid */}
      <View style={styles.insightRow}>
        {/* Left column */}
        <View style={styles.leftColumn}>
          <View style={styles.stackedCard}>
            <View style={styles.cardLabel} />
            <View style={styles.cardValue} />
            <View style={styles.cardSubtext} />
          </View>

          <View style={styles.stackedCard}>
            <View style={styles.cardLabel} />
            <View style={styles.cardValue} />
            <View style={styles.cardSubtext} />
          </View>
        </View>

        {/* Right AI summary */}
        <View style={styles.aiCard}>
          <View style={styles.cardLabel} />
          <View style={styles.aiLine} />
          <View style={styles.aiLine} />
          <View style={styles.aiLineShort} />
        </View>
      </View>

      {/* Try tomorrow */}
      <View style={styles.tryTomorrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 14,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerText: {
    width: 140,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  /* Date strip */
  dateStrip: {
    width: "100%",
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  dateRange: {
    alignSelf: "center",
    width: 180,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  /* Hero */
  heroCard: {
    height: 180,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  heroMeta: {
    width: 160,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  /* Breakdown */
  breakdownCard: {
    height: 120,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  /* Insight grid */
  insightRow: {
    flexDirection: "row",
    gap: 12,
  },
  leftColumn: {
    flex: 1.5,
    gap: 12,
  },
  stackedCard: {
    height: 90,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 12,
    gap: 8,
  },

  aiCard: {
    flex: 1,
    height: 192,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 12,
    gap: 8,
  },

  cardLabel: {
    width: 80,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  cardValue: {
    width: 120,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  cardSubtext: {
    width: 140,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  aiLine: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  aiLineShort: {
    width: "70%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  /* Try tomorrow */
  tryTomorrow: {
    height: 120,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});
