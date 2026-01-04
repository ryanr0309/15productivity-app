import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { breakdownByCategory, breakdownByOutcome } from "../../types/outcomes";
import { supabase } from "../../lib/supabase";
import { colors } from "../../constants/colors";

import DateStrip from "../../components/insights/DateStrip";
import ProductivityCircle from "../../components/insights/ProductivityCircle";
import TimeBreakdownBar from "../../components/insights/TimeBreakdownBar";
import TryTomorrowCard from "../../components/insights/TryTomorrowCard";

import { normalizeBlocks } from "../../utils/blocks";
import { scoreDay } from "../../lib/scoring/scoring";
import { Block } from "../../utils/timeBlocks";
import { toClassifiedBlock } from "../../lib/adapters/toClassifiedBlock";
import { normalizeCategoryBreakdown, normalizeOutcomeBreakdown } from "../../lib/analytics/normalizeBreakdown";
import { Category } from "../../constants/categories";
import { findBestFocusWindow } from "../../lib/analytics/focusWindow";
import { findMostUnproductiveWindow } from "../../lib/analytics/unproductiveWindow";
import DailySummaryCard from "../../components/insights/DailySummary";
import { formatDateRange, formatDateTime } from "../../utils/time";

export default function Insights() {
  /** ---------------- STATE ---------------- */
  const [days, setDays] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [report, setReport] = useState<any | null>(null);
  

  

  useEffect(() => {
  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*");

    setCategories(data ?? []);
  }

  loadCategories();
}, []);

const categoryMap: Record<
  string,
  { label: string; color: string }
> = Object.fromEntries(
  categories.map(cat => [
    cat.id,
    { label: cat.label, color: cat.color },
  ])
);


  

    


  /** ---------------- LOAD DAYS ---------------- */
  useEffect(() => {
    async function loadDays() {
      setLoading(true);

      const { data } = await supabase
        .from("days")
        .select("*")
        .order("start_time", { ascending: true });

        
      if (!data || data.length === 0) {
        setDays([]);
        setLoading(false);
        return;
      }

      setDays(data);
      setSelectedIndex(data.length - 1); // default → latest day
      setLoading(false);

      
    }

    loadDays();
  }, []);

  /** ---------------- LOAD BLOCKS FOR SELECTED DAY ---------------- */
  useEffect(() => {
    async function loadBlocks() {
      if (!days.length) return;

      const selectedDay = days[selectedIndex];
    
      if (!selectedDay) return;

      const { data: report } = await supabase
  .from("daily_reports")
  .select("*")
  .eq("day_id", selectedDay.id)
  .single();

      setReport(report)

      const { data } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("day_id", selectedDay.id)
        .order("start_time");

      setBlocks(normalizeBlocks(data ?? []));
    }

    loadBlocks();
  }, [days, selectedIndex]);

  function formatWindow(window: {
  start: Date;
  end: Date;
}) {
  const start = window.start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const end = window.end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${start} – ${end}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}


  /** ---------------- DERIVED DATA ---------------- */

const classifiedBlocks = blocks.map(toClassifiedBlock);

const bestFocusWindow =
  findBestFocusWindow(classifiedBlocks);
const dayScore = scoreDay(classifiedBlocks);
const outcomeBreakdown =
  breakdownByOutcome(classifiedBlocks);
const categoryBreakdown =
  breakdownByCategory(blocks);

  const outcomeBarData =
  normalizeOutcomeBreakdown(outcomeBreakdown);

  const categoryBarData =
  normalizeCategoryBreakdown(categoryBreakdown, categoryMap);

  const [breakdownMode, setBreakdownMode] =
  useState<"outcome" | "category">("outcome");

  const data =
  breakdownMode === "outcome"
    ? outcomeBarData
    : categoryBarData


    const selectedDay = days[selectedIndex];
    const rangeText = selectedDay
  ? formatDateRange(
      new Date(selectedDay.start_time),
      new Date(selectedDay.end_time)
    )
  : "";

  const blocksCompleted = blocks.filter(b => b.completed).length;
  const blocksMissed = blocks.length - blocksCompleted;
  
const worstWindow =
  findMostUnproductiveWindow(classifiedBlocks);

  /** ---------------- GUARDS ---------------- */
  if (loading) {
    return (
      <LinearGradient colors={["#0B132B", "#1C2541"]} style={styles.container}>
        <Text style={styles.loadingText}>Loading insights…</Text>
      </LinearGradient>
    );
  }

  if (!days.length) {
    return (
      <LinearGradient colors={["#0B132B", "#1C2541"]} style={styles.container}>
        <Text style={styles.loadingText}>No days yet</Text>
      </LinearGradient>
    );
  }

  /** ---------------- RENDER ---------------- */
  return (
    <LinearGradient colors={["#0B132B", "#1C2541"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
                  <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.headerText}>15 Productivity</Text>
                </View>

        {/* DAY STRIP */}
        <DateStrip
          totalDays={days.length}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
        />
        <Text style={styles.dateRange}>
  {rangeText}
</Text>

        {/* PRODUCTIVITY SCORE */}
        <View style={styles.heroCard}>
          <ProductivityCircle
            score={dayScore.percent}
            deltaText={""} // add later
          />

          <Text style={styles.blockMeta}>
            {blocksCompleted} blocks completed · {blocksMissed} missed
          </Text>
        </View>

        {/* TIME BREAKDOWN (stubbed with real blocks later) */}
        <TimeBreakdownBar
        mode={breakdownMode}
        data={data}
        onChangeMode={setBreakdownMode}
        />

        {/* WHY CARDS (can be wired later) */}
        <View style={styles.gridRow}>
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>Best focus window</Text>
            <Text style={styles.timeText}>
  {bestFocusWindow
    ? formatWindow(bestFocusWindow)
    : "No sustained focus"}
</Text>

            <Text style={styles.cardSubtext}>
              Based on productive block density.
            </Text>
          </View>

          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>Unproductive window</Text>
            <Text style={styles.timeText}>
  {worstWindow
    ? formatWindow(worstWindow)
    : "No unproductive time"}
</Text>


            <Text style={styles.cardSubtext}>
              Based on unproductive clustering.
            </Text>
          </View>
        </View>

        {/* TRY TOMORROW */}
        {report?.try_tomorrow && (
  <TryTomorrowCard items={report.try_tomorrow} />
)}

{report?.ai_summary && (<DailySummaryCard summary={report.ai_summary}/>)}
  
      </ScrollView>
    </LinearGradient>
  );
}

/** ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  heroCard: {
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  blockMeta: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 12,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  halfCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  loadingText: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 40,
  },
  dateRange: {
  marginTop: 6,
  marginBottom: 12,
  textAlign: "center",
  color: colors.textSecondary,
  fontSize: 12,
},

});
