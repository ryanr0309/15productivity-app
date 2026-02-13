import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

const TRACK_WIDTH = width - 48;
const MIN = 30;
const MAX = 360;
const STEP = 15;

type Props = {
  value: number;
  onChange: (val: number) => void;
};

export default function DurationSlider({ value, onChange }: Props) {
  const translateX = useSharedValue(0);

  // convert minutes to position
  const valueToPosition = (val: number) => {
    return ((val - MIN) / (MAX - MIN)) * TRACK_WIDTH;
  };

  const positionToValue = (pos: number) => {
    const raw =
      MIN + (pos / TRACK_WIDTH) * (MAX - MIN);

    // snap to 5-minute increments
    const snapped = Math.round(raw / STEP) * STEP;

    return Math.min(Math.max(snapped, MIN), MAX);
  };

  useEffect(() => {
    translateX.value = valueToPosition(value);
  }, []);const startX = useSharedValue(0);

const gesture = Gesture.Pan()
  .onBegin(() => {
    startX.value = translateX.value;
  })
  .onUpdate((e) => {
    const newPos = Math.min(
      Math.max(0, startX.value + e.translationX),
      TRACK_WIDTH
    );

    translateX.value = newPos;

    // 👇 Move logic inside worklet
    const raw =
      MIN + (newPos / TRACK_WIDTH) * (MAX - MIN);

    const snapped =
      Math.round(raw / STEP) * STEP;

    const clamped = Math.min(
      Math.max(snapped, MIN),
      MAX
    );

    runOnJS(onChange)(clamped);
  })
  .onEnd(() => {
    const raw =
      MIN + (translateX.value / TRACK_WIDTH) * (MAX - MIN);

    const snapped =
      Math.round(raw / STEP) * STEP;

    translateX.value = withSpring(
      ((snapped - MIN) / (MAX - MIN)) * TRACK_WIDTH
    );
  });


  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: translateX.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedFillStyle]} />
      </View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.thumb, animatedThumbStyle]} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: 40,
    justifyContent: "center",
  },
  track: {
    height: 6,
    backgroundColor: "#1C294D",
    borderRadius: 3,
  },
  fill: {
    position: "absolute",
    height: 6,
    backgroundColor: "#4DA3FF",
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#4DA3FF",
    top: 9,
  },
});
