import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "../constants/categories";


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

type Props = {
  category: Category;
  selected?: boolean;
  isHabit: boolean;
  onPress?: () => void;
  onDelete?: (id: string) => void;
};

export default function CategoryPill({
  category,
  selected = false,
  isHabit,
  onPress,
  onDelete,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.pill,
        selected && styles.pillSelected,
      ]}
    >
      
      {/* Color dot */}
      <View
        style={[
          styles.colorDot,
          { backgroundColor: category.color },
        ]}
      />

      {/* Label */}
      <Text
        style={[
          styles.text,
          selected && styles.textSelected,
        ]}
      >
        {category.label}
          
      </Text>
      {isHabit && (
    <View style={styles.habitBadge}>
      <Text style={styles.habitBadgeText}>H</Text>
    </View>
  )}

      {/* Delete (subtle, secondary action) */}
     {onDelete && (
  <Pressable
    onPress={() => onDelete(category.id)}
    hitSlop={10}
    style={styles.deleteButton}
  >
    <Ionicons
      name="close"
      size={14}
      color={colors.danger}
    />
  </Pressable>
)}

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,

    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "transparent",
  },

  pillSelected: {
    backgroundColor: colors.cardStrong,
    borderColor: colors.border,
  },

  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  text: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },

  textSelected: {
    color: colors.textPrimary,
    fontWeight: "600",
  },

  deleteButton: {
    marginLeft: 2,
    opacity: 0.7,
  },
  habitBadge: {

  height: 16,               // fixed height
  minWidth: 16,
  borderRadius: 8,
  backgroundColor: "rgba(255,255,255,0.18)",
  alignItems: "center",
  justifyContent: "center", 
},
habitBadgeText: {
    fontSize: 10,
  fontWeight: "700",
  color: "#FFFFFF",
  lineHeight: 12,
},

});
