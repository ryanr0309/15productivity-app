import { View, Text, StyleSheet, Pressable } from "react-native";
import React from "react";
import { colors } from "../../constants/colors";

type BreakdownMode = "outcome" | "category";

type TimeDistributionItem = {
  id: string;
  label: string;
  minutes: number;
  color: string;
};

type Props = {
  mode: BreakdownMode;
  data: TimeDistributionItem[];
  onChangeMode: (mode: BreakdownMode) => void;
};

export default function TimeBreakdownBar({
  mode,
  data,
  onChangeMode,
}: Props) {
  const maxMinutes = Math.max(...data.map(item => item.minutes), 1);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Where Your Time Went</Text>

        <View style={styles.toggle}>
          <ToggleButton
            label="Outcome"
            active={mode === "outcome"}
            onPress={() => onChangeMode("outcome")}
          />
          <ToggleButton
            label="Categories"
            active={mode === "category"}
            onPress={() => onChangeMode("category")}
          />
        </View>
      </View>

      {/* BARS */}
      {data.map(item => {
        const widthPercent = (item.minutes / maxMinutes) * 100;

        return (
          <View key={item.id} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>

            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${widthPercent}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
            </View>

            <Text style={styles.value}>
              {formatMinutes(item.minutes)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------- TOGGLE BUTTON ---------------- */

function ToggleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.toggleButton,
        active && styles.toggleButtonActive,
      ]}
    >
      <Text
        style={[
          styles.toggleText,
          active && styles.toggleTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------------- HELPERS ---------------- */

function formatMinutes(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;

  return `${hrs}h ${mins}m`;
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  toggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 2,
  },

  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  toggleButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  toggleText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  toggleTextActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  label: {
    width: 90,
    color: colors.textPrimary,
    fontSize: 13,
  },

  barWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },

  bar: {
    height: "100%",
    borderRadius: 4,
  },

  value: {
    width: 55,
    textAlign: "right",
    color: colors.textSecondary,
    fontSize: 12,
  },
});
