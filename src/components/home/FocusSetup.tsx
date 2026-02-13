import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";

const DURATIONS = [25, 45, 60, 90];

export default function FocusSetup() {
  const [duration, setDuration] = useState(45);
  const [goal, setGoal] = useState("");

  const endTime = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getTime() + duration * 60000);

    return end.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [duration]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Focus Session</Text>

      {/* Duration */}
      <View style={styles.section}>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDuration(d)}
              style={[
                styles.durationPill,
                duration === d && styles.durationSelected,
              ]}
            >
              <Text
                style={[
                  styles.durationText,
                  duration === d && styles.durationTextSelected,
                ]}
              >
                {d}m
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.endTime}>Ends at {endTime}</Text>
      </View>

      {/* Goal */}
      <View style={styles.section}>
        <TextInput
          style={styles.input}
          placeholder="What would you like to accomplish?"
          placeholderTextColor="#6B7A99"
          value={goal}
          onChangeText={setGoal}
          multiline
        />
      </View>

      {/* Start Button */}
      <Pressable
        style={[
          styles.startButton,
          goal.trim().length === 0 && { opacity: 0.5 },
        ]}
        disabled={goal.trim().length === 0}
        onPress={() => {
          console.log("Start Focus", duration, goal);
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
    paddingTop: 100,
  },

  title: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 40,
  },

  section: {
    marginBottom: 40,
  },

  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  durationPill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#111C3D",
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

  endTime: {
    marginTop: 16,
    color: "#6B7A99",
    fontSize: 14,
  },

  input: {
    backgroundColor: "#111C3D",
    borderRadius: 16,
    padding: 16,
    color: "#FFFFFF",
    minHeight: 100,
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
});
