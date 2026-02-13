import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DurationSlider from "../../../components/focus/DurationSlider";

export default function FocusSchedule() {
  const router = useRouter();

  // Round initial time to nearest 5 minutes
  const initialDate = new Date();
  initialDate.setMinutes(
    Math.ceil(initialDate.getMinutes() / 5) * 5
  );
  initialDate.setSeconds(0);

  const [startDate, setStartDate] = useState(initialDate);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [duration, setDuration] = useState(60);
  const [goal, setGoal] = useState("");

  const handleConfirm = (date: Date) => {
    setStartDate(date);
    setPickerVisible(false);
  };

  const endTime = useMemo(() => {
    const end = new Date(startDate.getTime() + duration * 60000);

    return end.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [startDate, duration]);

  const formattedDuration =
    duration < 60
      ? `${duration} min`
      : `${Math.floor(duration / 60)}h ${
          duration % 60 !== 0 ? `${duration % 60}m` : ""
        }`;

  const isGoalValid = goal.trim().length >= 12;

  return (
    <View style={styles.container}>
      {/* Back */}
      <Pressable onPress={() => router.replace("/")} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.title}>Schedule Focus</Text>
        <Text style={styles.subtitle}>
          Plan a future session.
        </Text>
      </View>

      {/* Start Time Selector */}
      <View style={styles.selectorCard}>
        <Pressable
          style={styles.selectorRow}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={styles.selectorLabel}>
            Start Time
          </Text>
          <Text style={styles.selectorValue}>
            {startDate.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        </Pressable>
      </View>

      {/* Duration */}
      <View style={{ marginHorizontal: 28, marginTop: 32 }}>
        <Text style={styles.durationDisplay}>
          {formattedDuration}
        </Text>
        <Text style={styles.endTime}>
          Session ends at {endTime}
        </Text>

        <View style={{ marginTop: 30 }}>
          <DurationSlider
            value={duration}
            onChange={setDuration}
          />
        </View>
      </View>

      {/* Goal */}
      <View style={{ marginHorizontal: 28, marginTop: 40 }}>
        <Text style={styles.selectorLabel}>
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
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={[
            styles.button,
            !isGoalValid && styles.buttonDisabled,
          ]}
          disabled={!isGoalValid}
          onPress={() => {
            Keyboard.dismiss();
            console.log(
              "Schedule Focus",
              startDate,
              duration,
              goal
            );
          }}
        >
          <Text style={styles.buttonText}>
            Schedule Session
          </Text>
        </Pressable>
      </View>

      {/* Modal Picker */}
      <DateTimePickerModal
        isVisible={pickerVisible}
        date={startDate}
        mode="datetime"
        display="spinner"
        onConfirm={handleConfirm}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1224",
  },

  back: {
    marginTop: 60,
    marginHorizontal: 28,
  },

  backText: {
    color: "#4DA3FF",
    fontSize: 16,
    fontWeight: "500",
  },

  hero: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
    paddingHorizontal: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  subtitle: {
    fontSize: 16,
    color: "#B0B8D4",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 260,
  },

  selectorCard: {
    marginHorizontal: 28,
    marginTop: 32,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#141A2B",
    borderColor: "#273450",
    borderWidth: 1,
  },

  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectorLabel: {
    fontSize: 14,
    color: "#CBD3EA",
  },

  selectorValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
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

  input: {
    backgroundColor: "#141F3D",
    borderRadius: 16,
    padding: 18,
    color: "#FFFFFF",
    minHeight: 120,
    textAlignVertical: "top",
    marginTop: 12,
  },

  ctaContainer: {
    marginTop: "auto",
    paddingHorizontal: 28,
    paddingBottom: 36,
  },

  button: {
    height: 62,
    borderRadius: 20,
    backgroundColor: "#4DA3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.28,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B1220",
  },
});
