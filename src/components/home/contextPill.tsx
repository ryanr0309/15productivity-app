import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
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
export function ContextPill({
  label,
  value,
  onPress
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (

    <Pressable style={styles.miniCard} onPress={onPress}>
      
      <Text style={styles.contextLabel}>{label}</Text>
      <Text style={styles.contextValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
   miniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  contextValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
})