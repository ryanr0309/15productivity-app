import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";

import ProductivityCircle from "../insights/ProductivityCircle";
import TimeBreakdownBar from "../insights/TimeBreakdownBar";
import TryTomorrowCard from "../insights/TryTomorrowCard";

import {
  breakdownByOutcome,
  breakdownByCategory,
} from "../../types/outcomes";

import {
  normalizeCategoryBreakdown,
  normalizeOutcomeBreakdown,
} from "../../lib/analytics/normalizeBreakdown";

import { scoreDay } from "../../lib/scoring/scoring";
import { findBestFocusWindow } from "../../lib/analytics/focusWindow";
import { findMostUnproductiveWindow } from "../../lib/analytics/unproductiveWindow";

import { toClassifiedBlock } from "../../lib/adapters/toClassifiedBlock";
import { useData } from "../../providers/DataProvider";
import { Block } from "../../utils/timeBlocks";
import { colors } from "../../constants/colors";

type Props = {
  visible: boolean;
  dayId: string | null;
  onDismiss: () => void;
};

export default function AnalyticsSummarySheet({
  visible,
  dayId,
  onDismiss,
}: Props) {
  const { insightsCache } = useData();

  /* ───────────── DAY ───────────── */
  const day = useMemo(
    () => insightsCache?.days?.find(d => d.id === dayId),
    [insightsCache, dayId]
  );

  /* ───────────── BLOCKS ───────────── */
  const rawBlocks: Block[] =
    dayId && insightsCache?.blocksByDayId?.[dayId]
      ? insightsCache.blocksByDayId[dayId]
      : [];

  const blocks = useMemo(() => {
    if (!day?.end_time) return [];
    const cutoff = new Date(day.end_time);

    return rawBlocks.filter(
      b => b.startTime && b.startTime < cutoff && b.status !== "unknown"
    );
  }, [rawBlocks, day]);

  /* ───────────── REPORT ───────────── */
  const report =
    (dayId && insightsCache?.reportsByDayId?.[dayId]) ?? null;

  /* ───────────── SCORING ───────────── */
  const classifiedBlocks = useMemo(
    () => blocks.map(toClassifiedBlock),
    [blocks]
  );

  const dayScore = useMemo(
    () => scoreDay(classifiedBlocks),
    [classifiedBlocks]
  );

  const completedCount = blocks.filter(b => b.status === "logged").length;
  const missedCount = blocks.filter(b => b.status === "missed").length;

  /* ───────────── BREAKDOWN ───────────── */
  const [breakdownMode, setBreakdownMode] =
    useState<"category" | "outcome">("category");

  const categoryData = useMemo(() => {
  return normalizeCategoryBreakdown(
    breakdownByCategory(blocks)
  ).sort((a, b) => b.minutes - a.minutes); // 👈 highest first
}, [blocks]);


const outcomeData = useMemo(() => {
  return normalizeOutcomeBreakdown(
    breakdownByOutcome(classifiedBlocks)
  ).sort((a, b) => b.minutes - a.minutes);
}, [classifiedBlocks]);
 

  const breakdownData =
    breakdownMode === "outcome" ? outcomeData : categoryData;

  /* ───────────── WINDOWS ───────────── */
  const bestWindow = findBestFocusWindow(classifiedBlocks);
  const worstWindow = findMostUnproductiveWindow(classifiedBlocks);

  const formatWindow = (window?: { start: Date; end: Date } | null) => {
    if (!window) return "N/A";
    return `${window.start.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })} – ${window.end.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  };

  /* ───────────── RENDER ───────────── */

  console.log("Day Score", dayScore)
  return (
    <Modal
      isVisible={visible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.45}
      swipeDirection="down"
      onSwipeComplete={onDismiss}
      onBackdropPress={onDismiss}
      propagateSwipe
      style={styles.modal}
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              <Ionicons name="time-outline" size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.title}>Daily Summary</Text>
              <Text style={styles.subtitle}>
                How your time was spent today
              </Text>
            </View>
          </View>

          <Pressable onPress={onDismiss}>
            <Ionicons name="close" size={22} color="#FFF" />
          </Pressable>
        </View>

        {/* SCROLL AREA */}
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {/* SCORE */}
            <View style={styles.cardStrong}>
              <View style={styles.scoreCenter}>
                <ProductivityCircle score={dayScore.percent} />
                <Text style={styles.scoreMeta}>
                  {completedCount} completed · {missedCount} missed
                </Text>
              </View>
            </View>

            {/* BREAKDOWN */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Time breakdown</Text>
              <TimeBreakdownBar
                mode={breakdownMode}
                data={breakdownData}
                onChangeMode={setBreakdownMode}
              />
            </View>

            {/* WINDOWS */}
            <View style={styles.row}>
              <View style={styles.halfCard}>
                <Text style={styles.cardLabel}>Best focus window</Text>
                <Text style={styles.cardValue}>
                  {formatWindow(bestWindow)}
                </Text>
                <Text style={styles.cardSubtext}>
                  Highest density of productive blocks
                </Text>
              </View>

              <View style={styles.halfCard}>
                <Text style={styles.cardLabel}>Unproductive window</Text>
                <Text style={styles.cardValue}>
                  {formatWindow(worstWindow)}
                </Text>
                <Text style={styles.cardSubtext}>
                  Cluster of low-focus time
                </Text>
              </View>
            </View>

            {/* AI */}
            {report?.ai_summary && (
              <View style={styles.cardStrong}>
                <Text style={styles.cardLabel}>AI reflection</Text>
                <Text style={styles.aiText}>{report.ai_summary}</Text>
              </View>
            )}

            {report?.try_tomorrow && (
              <TryTomorrowCard items={report.try_tomorrow} />
            )}

            <Pressable style={styles.doneButton} onPress={onDismiss}>
              <Text style={styles.doneText}>Continue</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────── STYLES ───────────── */

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#0F1426",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    flex: 1,
  },

  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginVertical: 10,
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },

  content: {
    paddingTop: 12,          // ✅ THIS fixes the “not at top” feeling
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardStrong: {
    backgroundColor: colors.cardStrong,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  halfCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginBottom: 4,
  },

  cardValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  cardSubtext: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 6,
  },

  aiText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginTop: 8,
  },

  scoreCenter: {
    alignItems: "center",
  },

  scoreMeta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },

  doneButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },

  doneText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B1224",
  },
});
