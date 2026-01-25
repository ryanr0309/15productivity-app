import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Animated,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { useBilling } from "../../providers/BillingProvider";



type Props = {
  onBeginDay: (estimatedSleep: Date) => Promise<void>;
};

export default function BeginDayScreen({ onBeginDay }: Props) {
  const { isActive, presentPaywall } = useBilling();
  const [sleepTime, setSleepTime] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const bounce = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const MIN_MS = 6 * 60 * 60 * 1000;
  const MAX_MS = 36 * 60 * 60 * 1000;

  const minDate = new Date(now.getTime() + MIN_MS);
  const maxDate = new Date(now.getTime() + MAX_MS);

  function handleConfirm(date: Date) {
    Haptics.selectionAsync();
    setPickerVisible(false);
    setSleepTime(date);

    Animated.spring(bounce, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 7,
    }).start(() => bounce.setValue(0));
  }

  async function handleBegin() {
    if (!isActive) {
    await presentPaywall();
    return;
  }
    if (!sleepTime) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onBeginDay(sleepTime);
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* HERO */}
      <View style={styles.hero}>
        <LottieView
          autoPlay
          loop
          style={{ width: 280, height: 280 }}
          source={require("../../assets/animations/sunrise.json")}
        />

        <Text style={styles.title}>Begin Your Day</Text>
        <Text style={styles.subtitle}>
          Intentional mornings lead to unstoppable days.
        </Text>
      </View>

      {/* SELECTOR */}
      <Pressable onPress={() => setPickerVisible(true)} style={styles.selectorCard}>
        <View style={styles.selectorRow}>
          <Text style={styles.selectorLabel}>Estimated Sleep</Text>

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
          <Text style={styles.buttonText}>Launch Day →</Text>
        </Pressable>
      </View>

      <DateTimePickerModal
        isVisible={pickerVisible}
        date={sleepTime ?? minDate}
        mode="datetime"
        display="spinner"
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
    backgroundColor: "",
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
    marginTop: -8,
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
  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B1220",
  },
});
