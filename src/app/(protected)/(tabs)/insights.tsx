import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { supabase } from "../../../lib/supabase";

type Segment = "yes" | "no" | "missed";

type FocusBlock = {
  id: string;
  goal: string;
  planned_duration: number;
  actual_duration: number;
  check_ins: Segment[];
  created_at: string;
};

const STATIC_CHECK_INS: Segment[] = [
  "no",
  "yes",
  "yes",
  "missed",
  "missed",
];


export default function InsightsScreen() {
  const [blocks, setBlocks] = useState<FocusBlock[]>([]);
  const [selectedBlock, setSelectedBlock] =
    useState<FocusBlock | null>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------
  // FETCH ALL BLOCKS (Chronological)
  // -----------------------------------------
  useEffect(() => {
    const fetchBlocks = async () => {
      const { data } = await supabase
        .from("focus_blocks")
        .select("*")
        .order("created_at", { ascending: true });

      if (data) {
        setBlocks(data);
        setSelectedBlock(data[data.length - 1] ?? null);
      }

      setLoading(false);
    };

    fetchBlocks();
  }, []);

  // -----------------------------------------
  // SCORING
  // -----------------------------------------
  const scoring = useMemo(() => {
    if (!selectedBlock) return null;

    const completedSegments =
      STATIC_CHECK_INS.filter(
        s => s === "yes"
      ).length;

    const totalCompletedSegments =
      STATIC_CHECK_INS.filter(
        s => s !== "missed"
      ).length;

    const focusQuality =
      totalCompletedSegments === 0
        ? 0
        : completedSegments /
          totalCompletedSegments;

    const completionRatio =
      selectedBlock.planned_duration === 0
        ? 0
        : selectedBlock.actual_duration /
          selectedBlock.planned_duration;

    const finalScore = Math.round(
      (focusQuality * 0.7 +
        completionRatio * 0.3) *
        100
    );

    return {
      finalScore,
      focusQuality,
      completionRatio,
    };
  }, [selectedBlock]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#4DA3FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Focus Insights
      </Text>

      {/* Horizontal Strip */}
      <FlatList
        data={blocks}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 20,
        }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isSelected =
            selectedBlock?.id === item.id;

          const score =
            item.planned_duration === 0
              ? 0
              : Math.round(
                  (item.actual_duration /
                    item.planned_duration) *
                    100
                );

          return (
            <Pressable
              style={[
                styles.blockCard,
                isSelected &&
                  styles.blockCardSelected,
              ]}
              onPress={() =>
                setSelectedBlock(item)
              }
            >
              <Text
                style={[
                  styles.blockScore,
                  isSelected && {
                    color: "#0B1224",
                  },
                ]}
              >
                {score}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Selected Block Detail */}
      {selectedBlock && scoring && (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 60,
          }}
        >
          <View style={styles.detailCard}>
            <Text style={styles.bigScore}>
              {scoring.finalScore}
            </Text>

            <Text style={styles.breakdown}>
              Focus:{" "}
              {Math.round(
                scoring.focusQuality * 100
              )}
              %
            </Text>

            <Text style={styles.breakdown}>
              Commitment:{" "}
              {Math.round(
                scoring.completionRatio * 100
              )}
              %
            </Text>

            {/* Timeline */}
            <View style={styles.timeline}>
              {STATIC_CHECK_INS.map(
                (segment, index) => (
                  <View
                    key={index}
                    style={[
                      styles.segment,
                      segment === "yes"
                        ? styles.segmentYes
                        : segment === "no"
                        ? styles.segmentNo
                        : styles.segmentMissed,
                    ]}
                  />
                )
              )}
            </View>

            <Text style={styles.goalText}>
              {selectedBlock.goal}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1224",
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 80,
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loading: {
    flex: 1,
    backgroundColor: "#0B1224",
    justifyContent: "center",
    alignItems: "center",
  },
  blockCard: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#141F3D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  blockCardSelected: {
    backgroundColor: "#4DA3FF",
  },
  blockScore: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  detailCard: {
    marginTop: 20,
    backgroundColor: "#141F3D",
    padding: 24,
    borderRadius: 24,
  },
  bigScore: {
    fontSize: 60,
    fontWeight: "800",
    color: "#4DA3FF",
    marginBottom: 10,
  },
  breakdown: {
    color: "#B0B8D4",
    fontSize: 14,
    marginBottom: 6,
  },
  timeline: {
    flexDirection: "row",
    marginVertical: 20,
  },
  segment: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 3,
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
  goalText: {
    color: "#CBD3EA",
    fontSize: 14,
    marginTop: 10,
  },
});
