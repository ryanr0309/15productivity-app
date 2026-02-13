import React from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  useAnimatedProps,
  interpolate,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle } from "react-native-svg";

const { width } = Dimensions.get("window");

const SIZE = width * 0.55;
const STROKE_WIDTH = 8;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const HOLD_DURATION = 900;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function FocusCore() {
  const router = useRouter();
  const progress = useSharedValue(0);
  const idlePulse = useSharedValue(0);

  React.useEffect(() => {
    idlePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);

  const gesture = Gesture.LongPress()
    .minDuration(HOLD_DURATION)
    .onStart(() => {
      progress.value = withTiming(1, { duration: HOLD_DURATION }, (finished) => {
        if (finished) {
          runOnJS(router.replace)("/focus/setup");
        }
      });
    })
    .onEnd(() => {
      progress.value = withSpring(0);
    });

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      CIRCUMFERENCE - CIRCUMFERENCE * progress.value;

    return { strokeDashoffset };
  });

  const animatedCoreStyle = useAnimatedStyle(() => {
    const holdScale = interpolate(progress.value, [0, 1], [1, 1.06]);
    const idleScale = interpolate(idlePulse.value, [0, 1], [1, 1.02]);

    return {
      transform: [{ scale: progress.value > 0 ? holdScale : idleScale }],
    };
  });

  const text = useDerivedValue(() => {
    if (progress.value > 0) return "Release to Start";
    return "Hold to Focus";
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.wrapper}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            stroke="#1C294D"
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />

          <AnimatedCircle
            stroke="#4DA3FF"
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>

        <Animated.View style={[styles.core, animatedCoreStyle]}>
          <Text style={styles.text}>{text.value}</Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  core: {
    position: "absolute",
    width: SIZE * 0.75,
    height: SIZE * 0.75,
    borderRadius: 999,
    backgroundColor: "#111C3D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4DA3FF",
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  text: {
    color: "#4DA3FF",
    fontSize: 18,
    fontWeight: "600",
  },
});
