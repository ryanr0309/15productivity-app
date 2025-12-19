import { View, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import React from "react";

type ProgressBarProps = {
  /** value between 0 and 1 */
  progress: number;
};

export default function ProgressBar({ progress }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.fill,
          { width: `${clampedProgress * 100}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 6,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 16,
  },

  fill: {
    height: "100%",
    backgroundColor: colors.textPrimary, // white for now
    borderRadius: 3,
  },
});
