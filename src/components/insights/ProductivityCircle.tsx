import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/colors";

import React from "react";

type ProductivityCircleProps = {
  score: number;
  deltaText?: string;
};

const SIZE = 120;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProductivityCircle({
  score,
  deltaText,
}: ProductivityCircleProps) {
  const progress = Math.min(Math.max(score / 100, 0), 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.wrapper}>
      <View>
        <Svg width={SIZE} height={SIZE}>
          {/* Background Ring */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />

          {/* Progress Ring */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#4CD964"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>

        {/* Score */}
        <View style={styles.centerText}>
          <Text style={styles.score}>{score}</Text>
        </View>
      </View>

      {deltaText && (
        <Text style={styles.delta}>{deltaText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
  },

  centerText: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
    justifyContent: "center",
    alignItems: "center",
  },

  score: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  delta: {
    color: colors.textSecondary,
    fontSize: 14,
    maxWidth: 120,
  },
});
