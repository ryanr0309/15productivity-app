import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { CATEGORY_COLORS } from "../constants/categoryColors";

type Props = {
  selectedColor: string | null;
  usedColors: string[];
  onSelect: (color: string) => void;
};

export default function ColorPicker({
  selectedColor,
  usedColors,
  onSelect,
}: Props) {
  // ✅ Filter out used colors entirely
  const availableColors = CATEGORY_COLORS.filter(
    (color) => !usedColors.includes(color)
  );

  return (
    <View style={styles.grid}>
      {availableColors.map((color) => {
        const isSelected = selectedColor === color;

        return (
          <TouchableOpacity
            key={color}
            onPress={() => onSelect(color)}
            style={[
              styles.color,
              {
                backgroundColor: color,
                borderWidth: isSelected ? 2 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
}


const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  color: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: "#FFFFFF",
  },
});
