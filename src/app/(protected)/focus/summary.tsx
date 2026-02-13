import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";

type Segment = "yes" | "no" | "missed";

type FocusBlock = {
  id: string;
  goal: string;
  plannedDuration: number;
  actualDuration: number;
  checkIns: Segment[];
};

export default function FocusSummary() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [block, setBlock] = useState<FocusBlock | null>(null);

  // -----------------------------------
  // FETCH BLOCK FROM SUPABASE
  // -----------------------------------
  useEffect(() => {
    if (!id) return;

    const fetchBlock = async () => {
      const { data } = await supabase
        .from("focus_blocks")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setBlock({
          id: data.id,
          goal: data.goal,
          plannedDuration: data.planned_duration,
          actualDuration: data.actual_duration,
          checkIns: data.check_ins ?? [],
        });
      }
    };

    fetchBlock();
  }, [id]);

  // -----------------------------------
  // SCORING LOGIC
  // -----------------------------------
  const scoring = useMemo(() => {
    if (!block) {
      return {
        finalScore: 0,
        focusQuality: 0,
        completionRatio: 0,
        insight: "",
      };
    }

    const completedSegments =
      block.checkIns.filter(s => s === "yes").length;

    const totalCompletedSegments =
      block.checkIns.filter(s => s !== "missed").length;

    const focusQuality =
      totalCompletedSegments === 0
        ? 0
        : completedSegments / totalCompletedSegments;

    const completionRatio =
      block.plannedDuration === 0
        ? 0
        : block.actualDuration / block.plannedDuration;

    const finalScore = Math.round(
      (focusQuality * 0.7 +
        completionRatio * 0.3) *
        100
    );

    let insight =
      "Solid effort. Consistency builds momentum.";

    const earlyYes =
      block.checkIns.slice(0, 2).every(s => s === "yes");

    const laterMissed =
      block.checkIns.slice(2).some(s => s === "missed");

    if (focusQuality === 1 && completionRatio === 1)
      insight = "Full commitment. Zero drift.";
    else if (earlyYes && laterMissed)
      insight = "Your focus dropped after 30 minutes.";
    else if (block.checkIns[0] === "missed")
      insight =
        "The first 15 minutes are your most vulnerable.";
    else if (
      focusQuality > 0.8 &&
      completionRatio < 0.6
    )
      insight =
        "You start strong. Consider shorter sessions.";

    return {
      finalScore,
      focusQuality,
      completionRatio,
      insight,
    };
  }, [block]);

  // -----------------------------------
  // LOADING STATE
  // -----------------------------------
  if (!block) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4DA3FF" />
      </View>
    );
  }

  const getSegmentStyle = (type: Segment) => {
    switch (type) {
      case "yes":
        return styles.segmentYes;
      case "no":
        return styles.segmentNo;
      default:
        return styles.segmentMissed;
    }
  };

  const getScoreLabel = () => {
    if (scoring.finalScore >= 90)
      return "Elite focus session";
    if (scoring.finalScore >= 75)
      return "Strong focus session";
    if (scoring.finalScore >= 60)
      return "Decent session";
    return "Room to improve";
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.score}>
          {scoring.finalScore}
        </Text>
        <Text style={styles.scoreLabel}>
          {getScoreLabel()}
        </Text>

        <View style={styles.breakdown}>
          <Text style={styles.breakdownText}>
            Focus: {Math.round(scoring.focusQuality * 100)}%
          </Text>
          <Text style={styles.breakdownText}>
            Commitment: {Math.round(scoring.completionRatio * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>
          Session Timeline
        </Text>

        <View style={styles.timeline}>
          {block.checkIns.map((segment, index) => (
            <View
              key={index}
              style={[
                styles.segment,
                getSegmentStyle(segment),
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.insightContainer}>
        <Text style={styles.sectionTitle}>
          Insight
        </Text>
        <Text style={styles.insightText}>
          {scoring.insight}
        </Text>
      </View>

      <View style={styles.ctaContainer}>
        <Pressable
          style={styles.button}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonText}>
            Return Home
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1224",
    paddingHorizontal: 28,
  },
  loading: {
    flex: 1,
    backgroundColor: "#0B1224",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginTop: 120,
    marginBottom: 50,
  },
  score: {
    fontSize: 72,
    fontWeight: "800",
    color: "#4DA3FF",
  },
  scoreLabel: {
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 8,
  },
  breakdown: {
    marginTop: 16,
  },
  breakdownText: {
    color: "#B0B8D4",
    fontSize: 14,
    textAlign: "center",
  },
  timelineContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#CBD3EA",
    marginBottom: 14,
  },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  segment: {
    flex: 1,
    height: 14,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  segmentYes: {
    backgroundColor: "#4DA3FF",
  },
  segmentNo: {
    backgroundColor: "#FF5C5C",
  },
  segmentMissed: {
    backgroundColor: "#273450",
  },
  insightContainer: {
    marginBottom: 40,
  },
  insightText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
  },
  ctaContainer: {
    marginTop: "auto",
    paddingBottom: 40,
  },
  button: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#4DA3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B1220",
  },
});
