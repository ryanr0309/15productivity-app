import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { breakdownByCategory, breakdownByOutcome } from "../../../types/outcomes";
import { supabase } from "../../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";



import DateStrip from "../../../components/insights/DateStrip";
import ProductivityCircle from "../../../components/insights/ProductivityCircle";
import TimeBreakdownBar from "../../../components/insights/TimeBreakdownBar";
import TryTomorrowCard from "../../../components/insights/TryTomorrowCard";

import { normalizeBlocks } from "../../../utils/blocks";
import { scoreDay } from "../../../lib/scoring/scoring";
import { Block } from "../../../utils/timeBlocks";
import { toClassifiedBlock } from "../../../lib/adapters/toClassifiedBlock";
import { normalizeCategoryBreakdown, normalizeOutcomeBreakdown } from "../../../lib/analytics/normalizeBreakdown";
import { Category } from "../../../constants/categories";
import { findBestFocusWindow } from "../../../lib/analytics/focusWindow";
import { findMostUnproductiveWindow } from "../../../lib/analytics/unproductiveWindow";
import DailySummaryCard from "../../../components/insights/DailySummary";
import { formatDateRange, formatDateTime } from "../../../utils/time";
import { useData } from "../../../providers/DataProvider";
import { useAuth } from "../../../hooks/useAuth";
import BreakdownModal from "../../../components/insights/BreakdownModal";
import AISummaryPopup from "../../../components/insights/AISummaryPopup";
import { useScrollToTop } from "@react-navigation/native";
import { useCallback} from "react";
import { useFocusEffect } from "@react-navigation/native";
import InsightsSkeleton from "../../../components/insights/InsightsSkeleton";
import AnimatedTabWrapper from "../../../components/AnimatedTabWrapper";
import InsightsEmptyState from "../../../components/insights/InsightsEmptyState";

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

export default function Insights() {
  /** ---------------- STATE ---------------- */
  const blocksCacheRef = useRef<Record<string, any[]>>({});
  const reportCacheRef = useRef<Record<string, any>>({});

  /** ---------------- STATE ---------------- */
  const [days, setDays] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const { categories } = useData();
  const { userId } = useAuth();

  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const { insightsCache } = useData();


useEffect(() => {
  if (!insightsCache) return;

  const hydratedDays = insightsCache.days ?? [];
  setDays(hydratedDays);

  const latestIndex = hydratedDays.length - 1;
  setSelectedIndex(latestIndex);

  blocksCacheRef.current = { ...insightsCache.blocksByDayId };
  reportCacheRef.current = { ...insightsCache.reportsByDayId };

  const latestDayId = hydratedDays[latestIndex]?.id;

  // ✅ set initial UI state immediately
  setBlocks(latestDayId ? blocksCacheRef.current[latestDayId] ?? [] : []);
  setReport(latestDayId ? reportCacheRef.current[latestDayId] ?? null : null);

  setLoading(false);


}, [insightsCache]);



  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, [])
  );

  /** ---------------- CATEGORY MAP ---------------- */


  /** ---------------- PREFETCH RECENT DAYS ---------------- */
  useEffect(() => {
    if (!days.length) return;

    const indicesToPrefetch = [
      selectedIndex,
      selectedIndex - 1,
      selectedIndex - 2,
    ].filter(i => i >= 0);

    indicesToPrefetch.forEach(async i => {
      const dayId = days[i].id;
      if (blocksCacheRef.current[dayId]) return;

      const [{ data: report }, { data: blocks }] =
        await Promise.all([
          supabase
            .from("daily_reports")
            .select("*")
            .eq("day_id", dayId)
            .maybeSingle(),
          supabase
            .from("time_blocks")
            .select("*")
            .eq("day_id", dayId)
            .order("start_time"),
        ]);

      blocksCacheRef.current[dayId] =
        normalizeBlocks(blocks ?? []);
      reportCacheRef.current[dayId] = report;


    });
    
  }, [days, selectedIndex]);

  /** ---------------- LOAD SELECTED DAY ---------------- */
  useEffect(() => {
    if (!days[selectedIndex]) return;

    const dayId = days[selectedIndex].id;



    // ✅ Cache hit → instant
    if (blocksCacheRef.current[dayId]) {
      setBlocks(blocksCacheRef.current[dayId]);
      setReport(reportCacheRef.current[dayId] ?? null);
      setLoading(false);
      return;
    }

    // ❌ Cache miss → fetch once
    async function load() {
      setLoading(true);

      const [{ data: report }, { data: blocks }] =
        await Promise.all([
          supabase
            .from("daily_reports")
            .select("*")
            .eq("day_id", dayId)
            .maybeSingle(),
          supabase
            .from("time_blocks")
            .select("*")
            .eq("day_id", dayId)
            .order("start_time"),
        ]);

      const normalized = normalizeBlocks(blocks ?? []);

      blocksCacheRef.current[dayId] = normalized;
      reportCacheRef.current[dayId] = report;

      setBlocks(normalized);
      setReport(report);
      setLoading(false);
    }

    load();
  }, [selectedIndex, days]);

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




  /** ---------------- DERIVED DATA ---------------- */

console.log(blocks)

const selectedDay = days[selectedIndex];

const analyticsBlocks = useMemo(() => {
  console.log(selectedDay)
  if (!selectedDay) return [];

  // 🚫 Do NOT compute analytics until day is finalized
  if (!selectedDay.end_time && selectedDay.day_phase !== "locked") {
    return [];
  }

  
  const cutoff = new Date(selectedDay.end_time);


  return blocks.filter(block => block.startTime < cutoff);
}, [blocks, selectedDay]);

console.log(analyticsBlocks)



const hasBlocks = analyticsBlocks.length > 0;

const classifiedBlocks = useMemo(
  () => (hasBlocks ? analyticsBlocks.map(toClassifiedBlock) : []),
  [analyticsBlocks, hasBlocks]
);



const bestFocusWindow = useMemo(
  () => (hasBlocks ? findBestFocusWindow(classifiedBlocks) : null),
  [classifiedBlocks, hasBlocks]
);

const dayScore = useMemo(
  () =>
    hasBlocks
      ? scoreDay(classifiedBlocks)
      : { percent: 0, productive: 0, neutral: 0, unproductive: 0 },
  [classifiedBlocks, hasBlocks]
);



const outcomeBreakdown = useMemo(
  () =>
    hasBlocks
      ? breakdownByOutcome(classifiedBlocks)
      : { productive: 0, neutral: 0, unproductive: 0 },
  [classifiedBlocks, hasBlocks]
);

const outcomeBarData = useMemo(
  () => normalizeOutcomeBreakdown(outcomeBreakdown),
  [outcomeBreakdown]
);


const categoryBreakdown = useMemo(
  () => (hasBlocks ? breakdownByCategory(analyticsBlocks) : []),
  [analyticsBlocks, hasBlocks]
);

const categoryBarData = useMemo(
  () => normalizeCategoryBreakdown(categoryBreakdown),
  [categoryBreakdown]
);




  const [breakdownMode, setBreakdownMode] =
  useState<"category" | "outcome">("category");

const TOP_N = 4;

const topCategoryData = [...categoryBarData]
  .sort((a, b) => b.minutes - a.minutes)
  .slice(0, TOP_N);

  const data =
  breakdownMode === "outcome"
    ? outcomeBarData
    : topCategoryData;


    
    const rangeText = selectedDay
  ? formatDateRange(
      new Date(selectedDay.start_time),
      new Date(selectedDay.end_time)
    )
  : "";

const blocksCompleted = classifiedBlocks.filter(b => b.wasLogged).length;
const blocksMissed = analyticsBlocks.length - blocksCompleted;

  
const worstWindow =
  findMostUnproductiveWindow(classifiedBlocks);






  /** ---------------- GUARDS ---------------- */
  if (loading) {
    return (

      <SafeAreaView style={styles.safe} >
      <ScrollView contentContainerStyle={styles.container}
             ref={scrollRef}
             showsVerticalScrollIndicator={false}>
                <InsightsSkeleton/>
             </ScrollView>
      </SafeAreaView>
 
    );
  }

  if (!days.length) {
    return (

                <InsightsEmptyState/>

    );
  }

  /** ---------------- RENDER ---------------- */
  return (
    
    <SafeAreaView style={styles.safe} >
      <ScrollView contentContainerStyle={styles.container}
             ref={scrollRef}
             showsVerticalScrollIndicator={false}>
              
        {/* HEADER */}
        <View style={styles.header}>
                         <View style={styles.brandLeft}>
                           <View style={styles.logoCircle}>
                             <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
                           </View>
                           <Text style={styles.brandText}>15 Productivity</Text>
                         </View>
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
        <Pressable onPress={() => setShowBreakdownModal(true)}>
        <TimeBreakdownBar
        mode={breakdownMode}
        data={data}
        onChangeMode={setBreakdownMode}
        />
        </Pressable>
{/* INSIGHT GRID */}
<View style={styles.insightRow}>
  {/* LEFT STACK */}
  <View style={styles.leftColumn}>
    <View style={[styles.cardBase, styles.stackedCard]}>
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

    <View style={[styles.cardBase, styles.stackedCard]}>
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

  {/* RIGHT AI SUMMARY */}
  {report?.ai_summary && (
    <Pressable style={[styles.cardStrongBase, styles.aiCard]} onPress={() => setShowSummaryPopup(true)}>
    <View >
      <Text style={styles.cardLabel}>AI Summary</Text>

      <Text
        style={styles.aiText}
        numberOfLines={6}
        ellipsizeMode="tail"
      >
        {report.ai_summary}
      </Text>


  <Text style={styles.readMore}>Read more →</Text>

    </View>
    </Pressable>
  )}
</View>

{/* TRY TOMORROW */}
{report?.try_tomorrow && (
  <TryTomorrowCard items={report.try_tomorrow} />
)}



  <BreakdownModal
  visible={showBreakdownModal}
  onClose={() => setShowBreakdownModal(false)}
  categoryData={categoryBarData}
  outcomeData={outcomeBarData}
  mode={breakdownMode}
  onChangeMode={setBreakdownMode}
/>

{report?.ai_summary && (
  <AISummaryPopup
    visible={showSummaryPopup}
    summary={report.ai_summary}
    onClose={() => setShowSummaryPopup(false)}
  />
)}

      </ScrollView>
   </SafeAreaView>


  );
}

const styles = StyleSheet.create({
  container: {
  paddingHorizontal: 16,
  paddingBottom: 28,
  gap: 12
},

  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 12
  },

  /* ---------------- HEADER ---------------- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },

  dateRange: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight:700
  },

  /* ---------------- HERO ---------------- */
  heroCard: {

    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  blockMeta: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 12,
  },

  /* ---------------- INSIGHTS ---------------- */
  insightRow: {
    flexDirection: "row",
    gap: 12,
  },

  leftColumn: {
    flex: 1.5,
    gap: 12,
  },

  stackedCard: {
    flex: 1,
  },

  aiCard: {
    flex: 1,
    justifyContent: "space-between",
  },

  /* ---------------- CARD BASES ---------------- */
  cardBase: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardStrongBase: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* ---------------- TEXT ---------------- */
  cardLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10 as any,
  },
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerRightPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRightPillText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },


  timeText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },

  cardSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },

  aiText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontWeight: "500",
  },

  readMore: {
    marginTop: 12,
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  loadingText: {
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: 40,
  },
      safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
});
