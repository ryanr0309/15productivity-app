import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Haptics from "expo-haptics";

type Props = {
  onBeginDay: (estimatedSleep: Date) => Promise<void>;
};

export default function BeginDayScreen({ onBeginDay }: Props) {
  const [sleepTime, setSleepTime] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const now = new Date();

  // Rules:
  const MIN_MS = 6 * 60 * 60 * 1000;   // 6 hours
  const MAX_MS = 36 * 60 * 60 * 1000;  // 36 hours

  const minDate = new Date(now.getTime() + MIN_MS);
  const maxDate = new Date(now.getTime() + MAX_MS);

  function handleConfirm(date: Date) {
    setPickerVisible(false);
    setSleepTime(date);
  }

  async function handleBegin() {
    if (!sleepTime) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onBeginDay(sleepTime);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.title}>Begin Your Day</Text>
        <Text style={styles.subtitle}>
          Small consistent decisions lead to extraordinary progress.
        </Text>

        {/* SLEEP PICKER */}
        <Pressable onPress={() => setPickerVisible(true)}>
          <View style={styles.selector}>
            <Text style={styles.selectorLabel}>Estimated Sleep Time</Text>
            <Text style={styles.selectorValue}>
              {sleepTime
                ? sleepTime.toLocaleString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Select"}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Pressable
          disabled={!sleepTime}
          onPress={handleBegin}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            !sleepTime && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>Begin Day</Text>
        </Pressable>
      </View>

      {/* DATE PICKER */}
      <DateTimePickerModal
      
        isVisible={pickerVisible}
        date={sleepTime ?? minDate}
        mode="datetime"
        display="spinner"          // optional but recommended
        themeVariant="light"
        isDarkModeEnabled={false}
        minimumDate={minDate}
        maximumDate={maxDate}
        onConfirm={handleConfirm}
        onCancel={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    transform: [{ translateY: -40 }],
  },

  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "400",
    color: "#B0B8D4",
    maxWidth: "80%",
    lineHeight: 24,
    marginBottom: 28,
  },
  selector: {
  borderRadius: 16,
  padding: 16,
  backgroundColor: "#1A2337",   // darker, less gray-blue
  borderWidth: 1,
  borderColor: "#3A475F",       // clearer boundary
},

selectorLabel: {
  fontSize: 14,
  color: "#CBD3EA",             // brighter secondary
  marginBottom: 6,
},

selectorValue: {
  fontSize: 17,
  fontWeight: "600",
  color: "#FFFFFF",             // full white
},

  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  button: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#4DA3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.3,
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
