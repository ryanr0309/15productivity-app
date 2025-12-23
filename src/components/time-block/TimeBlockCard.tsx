import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Block } from "../../utils/timeBlocks";

type Props = {
  block: Block;
  onPress: () => void;
};

export default function TimeBlockCard({ block, onPress }: Props) {
  const displayTime = block.timeLabel.split("–")[0].trim();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        block.completed && styles.cardCompleted,
      ]}
    >
      <Text style={styles.timeText}>{displayTime}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "30%",
    height: 64,                 // 👈 slightly shorter = tighter grid
    borderRadius: 14,           // 👈 softer corners like screenshot
    backgroundColor: "#1E2A4A", // 👈 slightly lighter than background
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,

    // subtle depth
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3, // Android
  },

  cardCompleted: {
    backgroundColor: "#1F8F5F", // 👈 green but muted (not neon)
  },

  timeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",

    // Android vertical centering fix
    includeFontPadding: false,
    lineHeight: 14,
  },
});
