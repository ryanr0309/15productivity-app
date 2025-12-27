import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

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
    <Pressable style={styles.contextPill} onPress={onPress}>
      <Text style={styles.contextLabel}>{label}</Text>
      <Text style={styles.contextValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
    contextPill: {
    backgroundColor: "#24304D",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    width: "23%",
  },
  contextLabel: {
    color: "#6F7BAE",
    fontSize: 11,
  },
  contextValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
})