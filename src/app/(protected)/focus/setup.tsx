import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
} from "react-native";
import DurationSlider from "../../../components/focus/DurationSlider";

import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";


export default function FocusSetup() {
  const router = useRouter();

  const [duration, setDuration] = useState(60); // minutes
  const [goal, setGoal] = useState("");

  const { userId } = useAuth();

  const endTime = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getTime() + duration * 60000);
    


    return end.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [duration]);

  const formattedDuration =
    duration < 60
      ? `${duration} min`
      : `${Math.floor(duration / 60)}h ${
          duration % 60 !== 0 ? `${duration % 60}m` : ""
        }`;
const isGoalValid = goal.trim().length >= 12;
  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.replace("/")} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Focus Session</Text>
      <Text style={styles.subtitle}>
        Set your time and commit to it.
      </Text>

      {/* Duration Display */}
      <View style={styles.section}>
  <Text style={styles.durationDisplay}>
    {formattedDuration}
  </Text>
  <Text style={styles.endTime}>
    Focus session ends at {endTime}
  </Text>

  <View style={{ marginTop: 30 }}>
    <DurationSlider
      value={duration}
      onChange={setDuration}
    />
  </View>
</View>


      {/* Goal */}
<View style={styles.section}>
  <Text style={styles.goalLabel}>
    What is the purpose of this session?
  </Text>

  <TextInput
    style={styles.input}
    placeholder="Finish calculus homework. Complete chapter 3 review."
    placeholderTextColor="#6B7A99"
    value={goal}
    onChangeText={setGoal}
    multiline
    returnKeyType="done"
    blurOnSubmit
    onSubmitEditing={() => {
      Keyboard.dismiss();
    }}
  />

  {goal.trim().length > 0 && goal.trim().length < 12 && (
    <Text style={styles.goalHint}>
      Be specific. At least 12 characters.
    </Text>
  )}
</View>


      <Pressable
  style={[
    styles.startButton,
    !isGoalValid && { opacity: 0.5 },
  ]}
  disabled={!isGoalValid}
  onPress={async () => {
  Keyboard.dismiss();

  if (!userId) return;

  const now = new Date();
  const end = new Date(now.getTime() + duration * 60000);

  const { data, error } = await supabase
    .from("focus_blocks")
    .insert({
      user_id: userId,
      goal: goal.trim(),
      scheduled_start: now.toISOString(),
      scheduled_end: end.toISOString(),
      planned_duration: duration,
      status: "active",
      actual_start: now.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating focus block:", error);
    return;
  }

  router.replace(`/focus/active?id=${data.id}`);
}}

>

        <Text style={styles.startText}>Start Focus</Text>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1224",
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  back: {
    marginBottom: 20,
  },

  backText: {
    color: "#4DA3FF",
    fontSize: 16,
    fontWeight: "500",
  },

  title: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 6,
  },

  subtitle: {
    color: "#6B7A99",
    fontSize: 14,
    marginBottom: 40,
  },


  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  durationPill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#141F3D",
  },

  durationSelected: {
    backgroundColor: "#4DA3FF",
  },

  durationText: {
    color: "#6B7A99",
    fontWeight: "500",
  },

  durationTextSelected: {
    color: "#0B1224",
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#141F3D",
    borderRadius: 16,
    padding: 18,
    color: "#FFFFFF",
    minHeight: 120,
    textAlignVertical: "top",
  },

  startButton: {
    backgroundColor: "#4DA3FF",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  startText: {
    color: "#0B1224",
    fontSize: 16,
    fontWeight: "600",
  },
  durationDisplay: {
  fontSize: 34,
  fontWeight: "600",
  color: "#FFFFFF",
},

endTime: {
  marginTop: 8,
  color: "#6B7A99",
  fontSize: 14,
},

section: {
  marginBottom: 50,
},
goalLabel: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "600",
  marginBottom: 12,
},

goalHint: {
  color: "#6B7A99",
  fontSize: 12,
  marginTop: 8,
},

});
