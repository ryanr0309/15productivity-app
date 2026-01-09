import { View, Text, StyleSheet, Pressable } from "react-native";
import React from "react";

const colors = {
  background: "#0B1224",
  card: "rgba(255,255,255,0.06)",
  cardStrong: "rgba(255,255,255,0.09)",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.7)",
  border: "rgba(255,255,255,0.10)",
  accent: "#4DA3FF",
  good: "#22C55E",
  warn: "#F59E0B",
  danger: "#EF4444",
};

type BreakdownMode = "outcome" | "category";

type TimeDistributionItem = {
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
    <View style={[styles.cardBase, styles.container]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Where Your Time Went</Text>

        <View style={styles.toggle}>
           <ToggleButton
            label="Categories"
            active={mode === "category"}
            onPress={() => onChangeMode("category")}
          />
          <ToggleButton
            label="Outcome"
            active={mode === "outcome"}
            onPress={() => onChangeMode("outcome")}
          />
        </View>
      </View>

      {/* BARS */}
      {data.map(item => {
        const widthPercent = (item.minutes / maxMinutes) * 100;

        return (
          <View key={`${item.label}-${item.color}`} style={styles.row}>
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
  /* ---------- CARD ---------- */
  container: {
  backgroundColor: colors.card,
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: "hidden", // ✅ popup-safe
},


  /* ---------- HEADER ---------- */
  header: {
    flexDirection: "row",
 
    alignItems: "center",
    marginBottom: 14,
  },

title: {
  color: colors.textPrimary,
  fontSize: 14,
  fontWeight: "700",
  flexShrink: 1, // ✅ prevents pushing toggle out
},

  /* ---------- TOGGLE ---------- */
toggle: {
  flexDirection: "row",
  backgroundColor: colors.cardStrong,
  borderRadius: 8,
  padding: 2,
  borderWidth: 1,
  borderColor: colors.border,
  marginLeft: "auto", // ✅ KEY LINE
},

  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  toggleButtonActive: {
    backgroundColor: colors.background,
  },

  toggleText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  toggleTextActive: {
    color: colors.textPrimary,
    fontWeight: "700",
  },

  /* ---------- ROW ---------- */
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  label: {
    width: 90,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },

  /* ---------- BAR ---------- */
  barWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cardStrong,
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
    fontWeight: "600",
  },

   cardBase: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

