import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  wakeTime: Date;
  onClose: () => void;
  onConfirm: (sleepTime: Date) => void;
};

const MIN_AWAKE_HOURS = 6;

function getEarliestSleepTime(wakeTime: Date) {
  return new Date(wakeTime.getTime() + MIN_AWAKE_HOURS * 60 * 60 * 1000);
}

export default function SleepModal({
  visible,
  wakeTime,
  onClose,
  onConfirm,
}: Props) {
  const [sleepTime, setSleepTime] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const earliestSleepTime = getEarliestSleepTime(wakeTime);
  const maxDate = new Date(wakeTime.getTime() + 36 * 60 * 60 * 1000);

  useEffect(() => {
    if (!visible) {
      setSleepTime(null);
      setPickerVisible(false);
    }
  }, [visible]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.sheetContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="moon" size={20} color="#FFFFFF" />
          <View>
            <Text style={styles.title}>Log Sleep</Text>
            <Text style={styles.subtitle}>
              Awake since{" "}
              {wakeTime.toLocaleString([], {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        {/* Sleep Now */}
        <Pressable
          style={[
            styles.primaryButton,
            new Date() < earliestSleepTime && styles.disabledButton,
          ]}
          disabled={new Date() < earliestSleepTime}
          onPress={() => {
            const now = new Date();
            setSleepTime(now);
            onConfirm(now);
            onClose();
          }}
        >
          <Text style={styles.primaryText}>Sleep now</Text>
        </Pressable>

        <Text style={styles.or}>or</Text>

        {/* Select time */}
        <Pressable
          style={styles.timeRow}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={styles.label}>Select sleep time</Text>
          <Text style={styles.time}>
            {sleepTime
              ? sleepTime.toLocaleString([], {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Tap"}
          </Text>
        </Pressable>

        {/* Confirm */}
        <Pressable
          style={[
            styles.primaryButton,
            !sleepTime && styles.disabledButton,
          ]}
          disabled={!sleepTime}
          onPress={() => sleepTime && onConfirm(sleepTime)}
        >
          <Text style={styles.primaryText}>Confirm Sleep</Text>
        </Pressable>

        <DateTimePickerModal
          isVisible={pickerVisible}
          date={sleepTime ?? earliestSleepTime}
          mode="datetime"
          display="spinner"
          minimumDate={earliestSleepTime}
          maximumDate={maxDate}
          onConfirm={(date) => {
            setPickerVisible(false);
            setSleepTime(date);
          }}
          onCancel={() => setPickerVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  

  sheetContainer: {
  backgroundColor: "#1E2433",
  borderRadius: 20,
  paddingHorizontal: 18,
  paddingTop: 12,
  paddingBottom: 48,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.06)",
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginBottom: 14,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 2,
  },

  /* PRIMARY ACTION */
  primaryButton: {
    backgroundColor: "#4DA3FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.4,
  },

  /* DIVIDER */
  or: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    marginVertical: 12,
    fontSize: 13,
  },

  /* TIME ROW */
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },

  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },

  time: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },

  /* TOGGLE GROUP */
  toggleGroup: {
    marginTop: 12,
    marginBottom: 12,
  },

  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  toggleText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 10,
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#4DA3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4DA3FF",
  },

  /* HELPER */
  helper: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },

  toggleSelected: {
    opacity: 1
  }
});

