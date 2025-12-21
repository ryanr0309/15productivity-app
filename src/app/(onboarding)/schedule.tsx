import { View, Text, Pressable, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import TimePickerModal from "../../components/config/TimePickerModal";
import { useAuthStore } from "../../store/useAuthStore";
import { colors } from "../../constants/colors";
import React from "react";

export default function ScheduleScreen() {
  const user = useAuthStore((s) => s.user);

  const [wakeTime, setWakeTime] = useState<Date>(new Date(2024, 0, 1, 8, 0));
  const [sleepTime, setSleepTime] = useState<Date>(new Date(2024, 0, 1, 22, 0));

  const [activePicker, setActivePicker] = useState<"wake" | "sleep" | null>(null);

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatForDB(date: Date) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  async function handleContinue() {
    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .update({
        wake_time: formatForDB(wakeTime),
        sleep_time: formatForDB(sleepTime),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to save schedule defaults", error);
      return;
    }

    router.push("/(onboarding)/categories");
  }

  return (
    <>
      <OnboardingQuestionScreen
        question="When do you usually wake up and go to sleep?"
        subtitle="This helps us structure your day"
        options={[]} // 👈 not used for this screen
        onContinue={handleContinue}
        onBack={() => router.back()}
      >
        {/* CUSTOM CONTENT */}
        <View style={styles.cardGroup}>
          <Pressable
            style={styles.card}
            onPress={() => setActivePicker("wake")}
          >
            <Text style={styles.label}>Wake up ☀️</Text>
            <Text style={styles.value}>{formatTime(wakeTime)}</Text>
          </Pressable>

          <Pressable
            style={styles.card}
            onPress={() => setActivePicker("sleep")}
          >
            <Text style={styles.label}>Sleep 🌙</Text>
            <Text style={styles.value}>{formatTime(sleepTime)}</Text>
          </Pressable>
        </View>
      </OnboardingQuestionScreen>

      {/* WAKE PICKER */}
      {activePicker === "wake" && (
        <TimePickerModal
          title="Wake up time"
          initialTime={wakeTime}
          onSave={(time) => {
            setWakeTime(time);
            setActivePicker(null);
          }}
        />
      )}

      {/* SLEEP PICKER */}
      {activePicker === "sleep" && (
        <TimePickerModal
          title="Sleep time"
          initialTime={sleepTime}
          onSave={(time) => {
            setSleepTime(time);
            setActivePicker(null);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cardGroup: {
    marginTop: 32,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "600",
  },
});
