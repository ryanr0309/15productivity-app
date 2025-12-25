import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../lib/supabase"; // adjust path
import { Alert } from "react-native";
import { router } from "expo-router";




export default function StartDayScreen() {
  const [interval, setInterval] = useState<number | null>(30);
  const [goals, setGoals] = useState<string[]>([""]);
  const [sleepTime, setSleepTime] = useState<Date | null>(null);
  const [tempSleepTime, setTempSleepTime] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  
  function normalizeGoals(goals: string[]) {
  return goals
    .map((g) => g.trim())
    .filter(Boolean);
}


  /** ✅ VALIDATION */
  const hasAtLeastOneGoal = goals.some(
    (g) => g.trim().length > 0
  );

  const filledGoalsCount = goals.filter(
    (g) => g.trim().length > 0
  ).length;

  async function handleStartDay() {
  if (!interval) return;

  const cleanedGoals = normalizeGoals(goals);

  if (cleanedGoals.length === 0) {
    Alert.alert("Please add at least one goal.");
    return;
  }

  // 0️⃣ Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    Alert.alert("You must be logged in to start a day.");
    return;
  }

  // 1️⃣ Insert Day
  const { data: day, error: dayError } = await supabase
    .from("days")
    .insert({
      user_id: user.id,
      status: "open",
      start_time: new Date().toISOString(),
      interval_minutes: interval,
      estimated_sleep_time: sleepTime
        ? sleepTime.toISOString()
        : null,
    })
    .select()
    .single();

  if (dayError || !day) {
    console.error(dayError);
    Alert.alert("Error starting day.");
    return;
  }

  // 2️⃣ Insert Goals
  const goalRows = cleanedGoals.map((text, idx) => ({
    day_id: day.id,
    text,
    sort_order: idx + 1,
  }));

  const { error: goalsError } = await supabase
    .from("day_goals")
    .insert(goalRows);

  if (goalsError) {
    console.error(goalsError);
    Alert.alert("Day started, but goals failed to save.");
    return;
  }


  // 4️⃣ Navigate home
  router.replace({
  pathname: "/",
  params: { refresh: "true" },
});

}



  return (
    <LinearGradient colors={["#0B132B", "#1C2541"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Start Your Day</Text>
          <Text style={styles.subtitle}>
            Define today with intention.
          </Text>
        </View>

        {/* INTERVAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-in Interval</Text>

          <View style={styles.intervalRow}>
            <IntervalOption
              label="15 min"
              sub="Maximum awareness"
              selected={interval === 15}
              onPress={() => setInterval(15)}
            />
            <IntervalOption
              label="30 min"
              sub="Balanced"
              selected={interval === 30}
              onPress={() => setInterval(30)}
            />
            <IntervalOption
              label="45 min"
              sub="Light touch"
              selected={interval === 45}
              onPress={() => setInterval(45)}
            />
          </View>
        </View>

        {/* GOALS (REQUIRED) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goals</Text>
          <Text style={styles.sectionHint}>
            At least one goal is required to begin.
          </Text>

          {goals.map((goal, idx) => {
            const isFilled = goal.trim().length > 0;
            const canDelete =
              goals.length > 1 &&
              (!isFilled || filledGoalsCount > 1);

            return (
              <View key={idx} style={styles.goalRow}>
                <TextInput
                  placeholder={`Goal ${idx + 1}`}
                  placeholderTextColor="#6F7BAE"
                  value={goal}
                  onChangeText={(text) => {
                    const copy = [...goals];
                    copy[idx] = text;
                    setGoals(copy);
                  }}
                  style={styles.goalInput}
                />

                {canDelete && (
                  <TouchableOpacity
                    onPress={() =>
                      setGoals(goals.filter((_, i) => i !== idx))
                    }
                    style={styles.goalDelete}
                  >
                    <Ionicons name="close" size={18} color="#AAB4D6" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {goals.length < 3 && (
            <TouchableOpacity
              onPress={() => setGoals([...goals, ""])}
              style={styles.addGoal}
            >
              <Ionicons name="add" size={16} color="#4DA3FF" />
              <Text style={styles.addGoalText}>Add another goal</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ESTIMATED SLEEP (OPTIONAL) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Sleep</Text>

          <TouchableOpacity
            style={styles.sleepCard}
            onPress={() => {
              setTempSleepTime(sleepTime ?? new Date());
              setShowPicker(true);
            }}
          >
            <Ionicons name="moon-outline" size={18} color="#AAB4D6" />
            <Text style={styles.sleepText}>
              {sleepTime
                ? sleepTime.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Set sleep time"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* START BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
  style={[
    styles.startButton,
    (!interval || !hasAtLeastOneGoal) && { opacity: 0.5 },
  ]}
  disabled={!interval || !hasAtLeastOneGoal}
  onPress={handleStartDay}
>
  <Text style={styles.startButtonText}>Start Day</Text>
</TouchableOpacity>

      </View>

      {/* SLEEP PICKER */}
      {showPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Estimated Sleep Time</Text>

            <DateTimePicker
              value={tempSleepTime ?? new Date()}
              mode="time"
              display="spinner"
              themeVariant="dark"
              textColor="white"
              onChange={(_, date) => {
                if (date) setTempSleepTime(date);
              }}
            />

            <View style={styles.pickerActions}>
              <TouchableOpacity
                onPress={() => {
                  setTempSleepTime(null);
                  setShowPicker(false);
                }}
                style={styles.pickerCancel}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSleepTime(tempSleepTime);
                  setTempSleepTime(null);
                  setShowPicker(false);
                }}
                style={styles.pickerConfirm}
              >
                <Text style={styles.pickerConfirmText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

/* ───────────────────────────── */

function IntervalOption({
  label,
  sub,
  selected,
  onPress,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.intervalCard,
        selected && styles.intervalSelected,
      ]}
    >
      <Text style={styles.intervalLabel}>{label}</Text>
      <Text style={styles.intervalSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

/* ───────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 140 },

  header: { marginBottom: 32 },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#AAB4D6",
    fontSize: 15,
    lineHeight: 22,
  },

  section: { marginBottom: 28 },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionHint: {
    color: "#6F7BAE",
    fontSize: 13,
    marginBottom: 12,
  },

  intervalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  intervalCard: {
    width: "31%",
    backgroundColor: "#24304D",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  intervalSelected: {
    backgroundColor: "#4DA3FF",
  },
  intervalLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  intervalSub: {
    color: "#AAB4D6",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },

  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  goalInput: {
    flex: 1,
    backgroundColor: "#1C2541",
    borderRadius: 14,
    padding: 14,
    color: "#FFFFFF",
  },
  goalDelete: {
    marginLeft: 10,
    padding: 6,
  },

  addGoal: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  addGoalText: {
    color: "#4DA3FF",
    fontSize: 14,
  },

  sleepCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#24304D",
    padding: 14,
    borderRadius: 14,
  },
  sleepText: {
    color: "#AAB4D6",
    fontSize: 14,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#0B132B",
  },
  startButton: {
    backgroundColor: "#4DA3FF",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  startButtonText: {
    color: "#0B132B",
    fontSize: 16,
    fontWeight: "700",
  },

  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerCard: {
    width: "85%",
    backgroundColor: "#1C2541",
    borderRadius: 20,
    padding: 20,
  },
  pickerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  pickerCancel: {
  paddingVertical: 10,
  paddingHorizontal: 16,
},

  pickerCancelText: {
    color: "#AAB4D6",
    fontSize: 14,
  },
  pickerConfirm: {
    backgroundColor: "#4DA3FF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  pickerConfirmText: {
    color: "#0B132B",
    fontSize: 14,
    fontWeight: "700",
  },
});
