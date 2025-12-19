import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { Category, getCategoryById } from "../../constants/categories";
import React from "react";


type TimeBlockCardProps = {
  time: string;
  completed?: boolean;
  active?: boolean;
  categoryLabel?: string;
  categoryColor?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};




export default function TimeBlockCard({
  time,
  completed = false,
  active = false,
  categoryLabel,
  categoryColor,
  onPress,
  disabled = false,
  style,
}: TimeBlockCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.card,
        completed && styles.completed,
        active && styles.active,
        disabled && styles.disabled,
        categoryColor ? { backgroundColor: categoryColor } : null, // ✅ color card
        style,
      ]}
    >
      {completed && categoryLabel ? (
        <>
          <Text style={styles.categoryText}>{categoryLabel}</Text>
          <Text style={styles.timeSubtext}>{time}</Text>
        </>
      ) : (
        <Text style={styles.timeText}>{time}</Text>
      )}
    </Pressable>
  );
}



const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, // rgba(0,0,0,0.5)
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },

  timeText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  completed: {
    opacity: 0.7, // subtle difference for now
  },

  active: {
    borderWidth: 1,
    borderColor: colors.accent, // future highlight
  },
  categoryText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "700",
},

timeSubtext: {
  color: "rgba(255,255,255,0.85)",
  fontSize: 12,
  marginTop: 4,
},
disabled: {
  opacity: 0.35,
}

});
