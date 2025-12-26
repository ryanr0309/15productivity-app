import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors } from "../../constants/colors";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; // adjust path
import React from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";

type Props = {
  dayId: string; // or date string (YYYY-MM-DD)
  onClose: () => void;
};


export default function DailyGoalsModal({ dayId, onClose }: Props) {
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGoals() {
      const { data, error } = await supabase
        .from("day_goals")
        .select("text")
        .eq("day_id", dayId)
        .order("created_at");

      if (!error && data) {
        setGoals(data.map(g => g.text));
      }

      setLoading(false);
    }

    fetchGoals();
  }, [dayId]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
      contentContainerStyle={styles.sheetContainer}
      keyboardShouldPersistTaps="handled"
    >
      
    <View style={styles.handle} />
    <View style={styles.sheet}>
  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.title}>Today’s Goals</Text>
    <Text style={styles.subtitle}>
      Locked in for today
    </Text>
  </View>

  {/* Goals */}
  <View style={styles.goalsContainer}>
    {loading ? (
      <Text style={styles.empty}>Loading…</Text>
    ) : goals.length === 0 ? (
      <Text style={styles.empty}>
        No goals were set for today
      </Text>
    ) : (
      goals.map((goal, index) => (
        <View key={index} style={styles.goalRow}>
          <Text style={styles.goalIndex}>
            {index + 1}.
          </Text>

          <Text style={styles.goalText}>
            {goal}
          </Text>
        </View>
      ))
    )}
  </View>

  {/* Helper */}
  <Text style={styles.helper}>
    Goals guide your focus, but don’t affect your productivity score.
  </Text>

  {/* Dismiss */}
  <Pressable onPress={onClose} style={styles.closeButton}>
    <Text style={styles.closeText}>Close</Text>
  </Pressable>
</View>
</ScrollView>
</KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  header: {
    marginBottom: 16,
  },

  title: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
  },

  goalsContainer: {
    marginBottom: 12,
  },

  empty: {
    color: "#64748B",
    fontSize: 13,
  },

  goalRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  goalIndex: {
    width: 20,
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
  },

  goalText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    lineHeight: 20,
  },

  helper: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 20,
  },

  closeButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
  },

  closeText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },
  sheetContainer: {
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 12, // 🔽 REDUCED from large value
  maxHeight: "85%",
  backgroundColor: "#f7f7f7"
},
handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCC",
    alignSelf: "center",
    marginBottom: 16,
  },
});


