import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "../constants/categories";

type Props = {
  category: Category;
  selected?: boolean;
  onPress?: () => void;
  onDelete?: (id: string) => void;
};

export default function CategoryPill({
  category,
  selected = false,
  onPress,
  onDelete,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.pill,
        selected && styles.pillSelected,
      ]}
    >
      {/* Color circle */}
      <View
        style={[
          styles.colorDot,
          { backgroundColor: category.color },
        ]}
      />

      {/* Name */}
      <Text style={styles.text}>{category.label}</Text>

      {/* Delete (only if provided) */}
      {onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(category.id)}
          hitSlop={10}
        >
          <Ionicons name="close" size={14} color="red" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginRight: 8,
    marginBottom: 8,
    gap: 8,
  },

  pillSelected: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "black",
  },

  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  text: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
  },
});
