import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  summary?: string | null;
};

export default function DailySummaryCard({ summary }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Daily reflection</Text>

      {summary ? (
        <Text style={styles.summaryText}>{summary}</Text>
      ) : (
        <Text style={styles.emptyText}>
          Reflection will appear once the day is completed.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B0B8D4",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#FFFFFF",
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7E87A8",
    fontStyle: "italic",
  },
});
