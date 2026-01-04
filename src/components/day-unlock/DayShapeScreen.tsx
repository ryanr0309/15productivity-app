import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics";

type Props = {
  day: {
    start_time: string;
    estimated_sleep_time?: string | null;
  };
  onContinue: (sleepISO: string) => Promise<void>;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DayShapeScreen({ day, onContinue }: Props) {
  const wakeLabel = useMemo(
    () => formatTime(day.start_time),
    [day.start_time]
  );

  // Default sleep: existing value OR wake + ~15.5h
  const defaultSleep = useMemo(() => {
    if (day.estimated_sleep_time) {
      return new Date(day.estimated_sleep_time);
    }
    const d = new Date(day.start_time);
    d.setHours(d.getHours() + 15, d.getMinutes() + 30);
    return d;
  }, [day]);

  const [sleepTime, setSleepTime] = useState<Date>(defaultSleep);

  const handleContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onContinue(sleepTime.toISOString());
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today’s Rhythm</Text>
      </View>

      {/* CONTENT */}
      <View style={styles.card}>
        {/* Wake Time (Locked) */}
        <View style={styles.row}>
          <Text style={styles.label}>Wake time</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{wakeLabel}</Text>
            <Text style={styles.check}>✓</Text>
          </View>
        </View>

        {/* Sleep Target */}
        <View style={[styles.row, styles.rowSpacing]}>
          <Text style={styles.label}>Sleep target</Text>

          <Pressable
            onPress={() => {
              // simple inline adjust for now
              const next = new Date(sleepTime);
              next.setMinutes(next.getMinutes() + 15);
              setSleepTime(next);
            }}
            style={styles.sleepPill}
          >
            <Text style={styles.sleepText}>
              {sleepTime.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
            <Text style={styles.caret}>▾</Text>
          </Pressable>
        </View>

        <Text style={styles.helper}>
          You can adjust this later.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220", // same family as Begin Day
  },

  header: {
    paddingTop: 24,
    paddingHorizontal: 28,
    paddingBottom: 16,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  card: {
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowSpacing: {
    marginTop: 18,
  },

  label: {
    fontSize: 15,
    color: "#B0B8D4",
  },

  valueRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginRight: 8,
  },

  check: {
    fontSize: 16,
    color: "#22C55E",
  },

  sleepPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  sleepText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginRight: 6,
  },

  caret: {
    fontSize: 12,
    color: "#B0B8D4",
  },

  helper: {
    marginTop: 14,
    fontSize: 13,
    color: "#7E87A8",
  },

  ctaContainer: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },

  button: {
    height: 58,
    borderRadius: 20,
    backgroundColor: "#4DA3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0B1220",
  },
});
