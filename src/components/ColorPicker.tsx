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
  return (
    <View style={styles.grid}>
      {CATEGORY_COLORS.map((color) => {
        const isUsed = usedColors.includes(color);
        const isSelected = selectedColor === color;

        return (
          <TouchableOpacity
            key={color}
            disabled={isUsed && !isSelected}
            onPress={() => onSelect(color)}
            style={[
              styles.color,
              {
                backgroundColor: color,
                opacity: isUsed && !isSelected ? 0.3 : 1,
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
