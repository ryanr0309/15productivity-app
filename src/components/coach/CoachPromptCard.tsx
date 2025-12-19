import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import React from "react";

type CoachPromptCardProps = {
  text: string;
  onPress?: () => void;
};

export default function CoachPromptCard({
  text,
  onPress,
}: CoachPromptCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, // rgba(0,0,0,0.5)
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  text: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
});
