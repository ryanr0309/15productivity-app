import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import React from "react";

type ProductivityStatsProps = {
  drains: string[];
  mostProductive: string;
  leastProductive: string;
};

export default function ProductivityStats({
  drains,
  mostProductive,
  leastProductive,
}: ProductivityStatsProps) {
  return (
    <View style={styles.container}>
      {/* LEFT: Biggest Time Drains */}
      <View style={styles.leftCard}>
        <Text style={styles.cardTitle}>Biggest Time Drains</Text>

        {drains.map((item, index) => (
          <Text key={index} style={styles.drainItem}>
            {index + 1}. {item}
          </Text>
        ))}
      </View>

      {/* RIGHT: Productivity Windows */}
      <View style={styles.rightColumn}>
        <View style={styles.rightCard}>
          <Text style={styles.cardTitle}>Most Productive</Text>
          <Text style={styles.cardValue}>{mostProductive}</Text>
        </View>

        <View style={styles.rightCard}>
          <Text style={styles.cardTitle}>Least Productive</Text>
          <Text style={styles.cardValue}>{leastProductive}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },

  /* LEFT CARD */
  leftCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },

  drainItem: {
    color: colors.textPrimary,
    fontSize: 14,
    marginTop: 8,
  },

  /* RIGHT COLUMN */
  rightColumn: {
    flex: 1,
    gap: 12,
  },

  rightCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },

  /* TEXT */
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },

  cardValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
