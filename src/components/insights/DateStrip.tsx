// components/insights/DateStrip.tsx

import { ScrollView, Pressable, Text, StyleSheet, View } from "react-native";
import { colors } from "../../constants/colors";
import React from "react";

type DateStripProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function DateStrip({
  selectedDate,
  onSelectDate,
}: DateStripProps) {
  const dates = generateDateRange(selectedDate);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dates.map((date) => {
        const isActive = isSameDay(date, selectedDate);

        return (
          <Pressable
            key={date.toISOString()}
            onPress={() => onSelectDate(date)}
            style={[styles.dateItem, isActive && styles.activeItem]}
          >
            <Text style={[styles.dayText, isActive && styles.activeText]}>
              {DAY_LABELS[date.getDay()]}
              {date.getDate()}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function generateDateRange(centerDate: Date): Date[] {
  const dates: Date[] = [];

  for (let i = -2; i <= 2; i++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + i);
    dates.push(d);
  }

  return dates;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },

  dateItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "transparent",
  },

  activeItem: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  dayText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },

  activeText: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
});
