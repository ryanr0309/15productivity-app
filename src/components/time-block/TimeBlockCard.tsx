import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { Block, getBlockState, didCompletePlannedHabit } from "../../utils/timeBlocks";
import { Category } from "../../constants/categories";
import { Habit } from "../../constants/habits";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  block: Block;
  plannedHabit?: Habit;
  loggedCategory?: Category;
  onPress: () => void;

  // ✅ ADD THESE
  selectionMode?: boolean;
  isSelected?: boolean;
};


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

export default function TimeBlockCard({
  block,
  plannedHabit,
  loggedCategory,
  onPress,
  selectionMode = false,
  isSelected = false,
}: Props) {
  const isUnknown = block.status === "unknown";

  const state = getBlockState(block);
  const resolvedCategoryColor =
  block.categoryColor ??
  loggedCategory?.color ??
  colors.background;



  const isDisabled = state === "upcoming";
const isCompleted =
  state === "completed" &&
  block.completed === true &&
  block.status !== "unknown";

const hasPlannedHabit = !!plannedHabit && !isCompleted && !isUnknown;

const plannedCompleted =
  isCompleted &&
  didCompletePlannedHabit(block);

const showCompletedDot =
  isCompleted && !plannedCompleted;

  const displayTime =
    typeof block.timeLabel === "string"
      ? block.timeLabel.split("–")[0].trim()
      : new Date(block.startTime).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={[
  styles.card,

  // BACKGROUND
  {
  backgroundColor: isUnknown
    ? "rgba(255,255,255,0.045)"
    : isCompleted
    ? block.categoryColor ?? colors.background
    : hasPlannedHabit
    ? `${plannedHabit!.color}22`
    : colors.background,
},
,

  // BORDER
 {
  borderColor: isUnknown
    ? "rgba(255,255,255,0.18)"
    : isSelected
    ? colors.accent
    : colors.border,
  borderWidth: isSelected ? 2 : 1,
  borderStyle: isUnknown ? "dashed" : "solid",
},


  // PLANNED ACCENT
  hasPlannedHabit && !isSelected && {
    borderLeftWidth: 3,
    borderLeftColor: plannedHabit!.color,
  },

  // UPCOMING FADE
  { opacity: isDisabled ? 0.35 : 1 },
]}

    >
      {/* ───────────────── INDICATORS (INDEPENDENT) ───────────────── */}

{selectionMode && (
  <View style={styles.selectionBadge}>
    {isSelected && (
      <Ionicons
        name="checkmark"
        size={12}
        color="#FFFFFF"
      />
    )}
  </View>
)}

{isUnknown && (
  <View style={styles.unknownIndicator}>
    <Text style={styles.unknownText}>⋯</Text>
  </View>
)}


      {/* GREEN DOT = block was logged */}
      {plannedCompleted ? (
  <View style={styles.plannedStar}>
    <Text style={styles.plannedStarText}>★</Text>
  </View>
) : showCompletedDot ? (
  <View style={styles.completedIndicator}>
    <View style={styles.completedDot} />
  </View>
) : null}

      {/* ───────────────── CONTENT ───────────────── */}

      {isUnknown ? (
  <View style={styles.blockLeft}>
    <Text style={styles.primaryText}>
      {displayTime}
    </Text>
    <Text style={styles.blockSub}>Not remembered</Text>
  </View>
) : isCompleted ? (
  <View style={styles.blockLeft}>
    <Text
      style={styles.primaryText}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {block.categoryLabel ?? "Completed"}
    </Text>
    <Text style={styles.secondaryText}>
      {displayTime}
    </Text>
  </View>
) : hasPlannedHabit ? (
  <View style={styles.blockLeft}>
    <Text style={styles.primaryText}>
      {displayTime}
    </Text>
    <Text
      style={styles.plannedHint}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      ({plannedHabit!.name})
    </Text>
  </View>
) : (
  <View style={styles.blockLeft}>
    <Text style={styles.primaryText}>
      {displayTime}
    </Text>
    <Text style={styles.blockSub}>Tap to log</Text>
  </View>
)}

    </Pressable>
  );
}

/* ───────────────── STYLES ───────────────── */

const styles = StyleSheet.create({
 card: {
  borderRadius: 14,
  borderWidth: 1,
  padding: 10,
  justifyContent: "space-between",
  height: 72,           // 👈 keep this EXACT
},


  primaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  secondaryText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  plannedHint: {
     color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  /* GREEN DOT */
  completedIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(34,197,94,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },

  /* STAR */
  plannedStar: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(250,204,21,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  plannedStarText: {
    color: "#FACC15",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 10,
  },
  blockLeft: {
    gap: 4 as any,
  },
  blockSub: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  selectionBadge: {
  position: "absolute",
  top: 6,
  left: 6,
  width: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: "rgba(0,0,0,0.55)",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.2)",
},
unknownIndicator: {
  position: "absolute",
  top: 6,
  right: 6,
  width: 14,
  height: 14,
  borderRadius: 7,
  backgroundColor: "rgba(255,255,255,0.15)",
  alignItems: "center",
  justifyContent: "center",
},

unknownText: {
  color: "rgba(255,255,255,0.7)",
  fontSize: 10,
  fontWeight: "700",
},

});
