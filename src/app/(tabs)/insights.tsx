// app/(tabs)/insights.tsx
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import DateStrip from "../../components/insights/DateStrip";
import ProductivityCircle from "../../components/insights/ProductivityCircle";
import TimeBreakdownBar from "../../components/insights/TimeBreakdownBar";
import ProductivityStats from "../../components/insights/ProductivityStats";
import TryTomorrowCard from "../../components/insights/TryTomorrowCard";

export default function Insights() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const productivityScore = 78;
  const deltaText = "+20 from yesterday 🔥";

  const MOCK_TIME_BREAKDOWN = [
  { label: "School", minutes: 220, color: "#4DA3FF" },
  { label: "Social", minutes: 95, color: "#FF9F43" },
  { label: "Phone", minutes: 180, color: "#FF6B6B" },
  { label: "Gym", minutes: 75, color: "#4CD964" },
    ];

  const tryTomorrowItems = [
    "Plan your first 15 minutes the night before",
    "Start the day with your hardest task",
    "Put your phone in another room for focus blocks",
  ];



  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Header (match your Home header styling later) */}
      <View style={styles.header}>
        <Text style={styles.brand}>15 Productivity</Text>
      </View>

      {/* DateStrip */}
      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Productivity score */}
      <ProductivityCircle
        score={productivityScore}
        deltaText={deltaText}
      />

      {/* WHERE YOUR TIME WENT */}
      <TimeBreakdownBar data={MOCK_TIME_BREAKDOWN} />

       {/* STATS */}
    
        <ProductivityStats
        drains={["Phone", "Napping", "TV"]}
        mostProductive="9–11AM"
        leastProductive="After 9PM"
        />

       {/* TRY TOMORROW */}
      <TryTomorrowCard items={tryTomorrowItems} />
        
      {/* The rest of your Insights components go below */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  debugText: {
    marginTop: 10,
    paddingHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 13,
  },
});
