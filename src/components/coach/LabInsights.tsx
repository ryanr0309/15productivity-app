import { View, StyleSheet } from "react-native";
import React from "react";

export default function LabSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.icon} />
        <View style={styles.headerText} />
      </View>

      {/* Mode / filter pills */}
      <View style={styles.pillRow}>
        <View style={styles.pill} />
        <View style={styles.pill} />
      </View>

      {/* Primary lab card */}
      <View style={styles.primaryCard}>
        <View style={styles.cardTitle} />
        <View style={styles.cardSubtext} />
      </View>

      {/* Lab items list */}
      <View style={styles.list}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.listItem}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIcon} />
              <View style={styles.itemText} />
            </View>
            <View style={styles.itemMeta} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerText: {
    width: 120,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  /* Pills */
  pillRow: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    width: 90,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  /* Primary card */
  primaryCard: {
    height: 120,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    width: 160,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  cardSubtext: {
    width: 220,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  /* List */
  list: {
    gap: 12,
  },
  listItem: {
    height: 72,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  itemText: {
    width: 120,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  itemMeta: {
    width: 40,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
