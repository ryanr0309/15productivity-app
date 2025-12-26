import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors } from "../../constants/colors";
import React from "react";

type Props = {
  goals: string[];
  onClose: () => void;
};

export default function DailyGoalsModal({ goals, onClose }: Props) {
  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />

      <Text style={styles.title}>Today’s Goals</Text>
      <Text style={styles.subtitle}>
        These are locked in for today
      </Text>

      <View style={styles.goalsContainer}>
        {goals.length === 0 ? (
          <Text style={styles.empty}>
            No goals were set for today
          </Text>
        ) : (
          goals.map((goal, index) => (
            <View key={index} style={styles.goalRow}>
              <View style={styles.bullet} />
              <Text style={styles.goalText}>{goal}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.helper}>
        Goals help guide your focus, but don’t affect your productivity score.
      </Text>

      <Pressable onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#F7F7F7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCC",
    alignSelf: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  goalsContainer: {
    gap: 12,
    marginBottom: 20,
  },

  goalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
  },

  goalText: {
    flex: 1,
    fontSize: 15,
    color: "#111",
  },

  empty: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
  },

  helper: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
  },

  closeButton: {
    alignItems: "center",
    paddingVertical: 14,
  },

  closeText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600",
  },
});
