import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import Modal from "react-native-modal";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

type DayOffset = "same" | "next";

type Props = {
  visible: boolean;
  wakeTime: Date;                 // 👈 NEW
  onClose: () => void;
  onConfirm: (sleepTime: Date) => void;
  onHidden: () => void;
};

const MIN_AWAKE_HOURS = 6;

function getEarliestSleepTime(wakeTime: Date) {
  return new Date(wakeTime.getTime() + MIN_AWAKE_HOURS * 60 * 60 * 1000);
}



function isValidSleepTime(
  wakeTime: Date,
  candidate: Date,
  dayOffset: "same" | "next"
) {
  const earliest = getEarliestSleepTime(wakeTime);

  if (dayOffset === "same") {
    return candidate >= earliest;
  }

  // next day → always valid
  return true;
}


export default function SleepModal({
  visible,
  wakeTime,
  onClose,
  onConfirm,
  onHidden,
}: Props) {
  const [customTime, setCustomTime] = useState<Date | null>(null);
  const [dayOffset, setDayOffset] = useState<DayOffset>("same");

  const wakeDateLabel = wakeTime.toLocaleDateString(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
});

  // 🔑 Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setCustomTime(null);
      setDayOffset("same");
    }
  }, [visible]);

  // 🔑 Intelligent default when user opens time picker
  useEffect(() => {
    if (!customTime) return;

    const candidate = buildCandidateSleepTime(
      wakeTime,
      customTime,
      "same"
    );

    setDayOffset(candidate > wakeTime ? "same" : "next");
  }, [customTime, wakeTime]);

  function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const sameDayLabel = wakeTime.toLocaleDateString(undefined, {
  weekday: "long",
});

const nextDayLabel = addDays(wakeTime, 1).toLocaleDateString(undefined, {
  weekday: "long",
});

const earliestSleepTime = getEarliestSleepTime(wakeTime);
const canSleepNow = new Date() >= earliestSleepTime;

  function buildCandidateSleepTime(
    wake: Date,
    selected: Date,
    offset: DayOffset
  ) {
    const result = new Date(wake);
    result.setHours(
      selected.getHours(),
      selected.getMinutes(),
      0,
      0
    );

    if (offset === "next") {
      result.setDate(result.getDate() + 1);
    }

    return result;
  }

  const resolvedSleepTime =
    customTime &&
    buildCandidateSleepTime(wakeTime, customTime, dayOffset);

    const isValidSelection =
  resolvedSleepTime &&
  isValidSleepTime(wakeTime, resolvedSleepTime, dayOffset);


  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      avoidKeyboard
      onModalHide={onHidden}
      style={styles.modal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.sheetContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
  <Ionicons name="moon" size={20} color="#FFFFFF" />
  <View>
    <Text style={styles.title}>Log Sleep</Text>
    <Text style={styles.subtitle}>
      Woke up {wakeDateLabel}
    </Text>
  </View>
</View>


            {/* Sleep Now */}
            {!customTime && (
              <Pressable
  style={[
    styles.primaryButton,
    !canSleepNow && styles.disabledButton,
  ]}
  disabled={!canSleepNow}
  onPress={() => onConfirm(new Date())}
>
  <Text style={styles.primaryText}>
    Sleep now
  </Text>
</Pressable>

            )}

            <Text style={styles.or}>or</Text>

            {/* Time selector */}
            <Pressable
              style={styles.timeRow}
              onPress={() => setCustomTime(new Date())}
            >
              <Text style={styles.label}>Sleep time</Text>
              <Text style={styles.time}>
                {(customTime ?? new Date()).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>

            {/* Time picker + toggle */}
            {customTime && (
              <>
                <DateTimePicker
                  value={customTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, date) => {
  if (!date) return;

  // Build full candidate timestamp
  const candidate = buildCandidateSleepTime(
    wakeTime,
    date,
    dayOffset
  );

  // SAME DAY → clamp to earliest allowed
  if (
    dayOffset === "same" &&
    candidate < earliestSleepTime
  ) {
    setCustomTime(earliestSleepTime);
    return;
  }

  setCustomTime(date);
}}

                />

                {/* DAY OFFSET TOGGLE */}
                <View style={styles.toggleGroup}>
                  <ToggleOption
                     label={`Same cycle day (${sameDayLabel})`}
                    selected={dayOffset === "same"}
                    onPress={() => setDayOffset("same")}
                  />
                  <ToggleOption
                    label={`Next day (${nextDayLabel})`}
                    selected={dayOffset === "next"}
                    onPress={() => setDayOffset("next")}
                  />
                </View>

                <Pressable
  style={[
    styles.primaryButton,
    !isValidSelection && styles.disabledButton,
  ]}
  disabled={!isValidSelection}
  onPress={() =>
    resolvedSleepTime && onConfirm(resolvedSleepTime)
  }
>
  <Text style={styles.primaryText}>Confirm Sleep</Text>
</Pressable>
{!isValidSelection && dayOffset === "same" && (
  <Text style={styles.helper}>
    Sleep must be after{" "}
    {earliestSleepTime.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}
  </Text>
)}


              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ToggleOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.toggleOption,
        selected && styles.toggleSelected,
      ]}
    >
      <View style={styles.radioOuter}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.toggleText}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },

  container: {
    backgroundColor: "#1E2A4A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6B7280",
    alignSelf: "center",
    marginBottom: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: "#4DA3FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 48
  },

  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  or: {
    textAlign: "center",
    color: "#B0B8D4",
    marginVertical: 12,
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },

  label: {
    color: "#B0B8D4",
    fontSize: 14,
  },

  time: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  sheetContainer: {
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 12, // 🔽 REDUCED from large value
  maxHeight: "85%",
},
toggleGroup: {
  marginTop: 12,
  marginBottom: 12,
},

toggleOption: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 8,
},

toggleSelected: {
  opacity: 1,
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

subtitle: {
  color: "#B0B8D4",
  fontSize: 13,
  marginTop: 2,
},
disabledButton: {
  opacity: 0.4,
},

helper: {
  color: "#B0B8D4",
  fontSize: 13,
  marginTop: 8,
  textAlign: "center",
},


});
