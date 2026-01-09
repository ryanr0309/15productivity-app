import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

type TryTomorrowCardProps = {
  items: string[];
};

const colors = {
  background: "#0B1224",
  card: "rgba(255,255,255,0.06)",
  cardStrong: "rgba(255,255,255,0.09)",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.7)",
  border: "rgba(255,255,255,0.10)",
  accent: "#4DA3FF",
  good: "#22C55E",
  warn: "#F59E0B",
  danger: "#EF4444",
};

export default function TryTomorrowCard({ items }: TryTomorrowCardProps) {
  return (
    <View style={[styles.cardBase, styles.cardStrong]}>
      <Text style={styles.cardLabel}>Try Tomorrow</Text>

      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={index} style={styles.row}>
            <Ionicons
              name="sparkles"
              size={14}
              color={colors.accent}
              style={styles.icon}
            />
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* MATCH INSIGHTS CARD SYSTEM */
  cardBase: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },

  cardStrong: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  cardLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  /* CONTENT */
  list: {
    gap: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  icon: {
    marginTop: 2,
    marginRight: 10,
  },

  text: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
