import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { Block } from "../../utils/timeBlocks";
import { getBlockState, getBlockStyles } from "../../utils/timeBlocks";
import { Category } from "../../constants/categories";

type Props = {
  block: Block;
  category?: Category;
  onPress: () => void;
};

export default function TimeBlockCard({ block, category, onPress }: Props) {
  const state = getBlockState(block);
  const stylesForState = getBlockStyles(state, category?.color);

   const isDisabled = state === "upcoming"; // 👈 ADD THIS

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
        { backgroundColor: stylesForState.backgroundColor },
        stylesForState.outline && {
          borderWidth: 2,
          borderColor: stylesForState.outline,
        },
        { opacity: stylesForState.opacity },
         { opacity: isDisabled ? 0.35 : stylesForState.opacity }
      ]}
    >
      {/* COMPLETED BLOCK */}
      {state === "completed" ? (
        <>
          {/* CATEGORY (PRIMARY) */}
          <Text
            style={styles.categoryText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {category?.label ?? "Completed"}
          </Text>

          {/* TIME (SECONDARY) */}
          <Text style={styles.timeTextSecondary}>
            {displayTime}
          </Text>

          {/* COMPLETION INDICATOR */}
          <View style={styles.completedIndicator}>
            <View style={styles.completedDot} />
          </View>
        </>
      ) : (
        /* NOT COMPLETED */
        <Text style={styles.timeTextPrimary}>
          {displayTime}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "30%",
    height: 72,
    borderRadius: 14,
    paddingHorizontal: 10,
    justifyContent: "center",
    marginBottom: 12,
  },

  /* NOT COMPLETED */
  timeTextPrimary: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 14,
  },

  /* COMPLETED */
  categoryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },

  timeTextSecondary: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 13,
  },

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
});
