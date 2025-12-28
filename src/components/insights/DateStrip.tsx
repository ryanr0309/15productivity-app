// components/insights/DateStrip.tsx

import React from "react";
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";

type DateStripProps = {
  totalDays: number;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
};

export default function DateStrip({
  totalDays,
  selectedIndex,
  onSelectIndex,
}: DateStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {Array.from({ length: totalDays }).map((_, index) => {
        const isActive = index === selectedIndex;

        return (
          <Pressable
            key={index}
            onPress={() => onSelectIndex(index)}
            style={[styles.dayItem, isActive && styles.activeItem]}
          >
            <Text style={[styles.dayText, isActive && styles.activeText]}>
              Day {index + 1}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  activeItem: {
    backgroundColor: colors.accent,
  },
  dayText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  activeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
