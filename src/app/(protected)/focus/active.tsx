import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { supabase } from "../../../lib/supabase";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 240;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusActive() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [block, setBlock] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const progress = useSharedValue(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------------------
  // FETCH BLOCK
  // -----------------------------------------
  useEffect(() => {
    if (!id) return;

    const fetchBlock = async () => {
      const { data } = await supabase
        .from("focus_blocks")
        .select("*")
        .eq("id", id)
        .single();

      if (!data) return;

      // If already completed, redirect immediately
      if (data.status !== "active") {
        router.replace(`/focus/summary?id=${data.id}`);
        return;
      }

      setBlock(data);

      const totalMs =
        new Date(data.scheduled_end).getTime() -
        new Date(data.started_at).getTime();

      const remaining =
        new Date(data.scheduled_end).getTime() -
        Date.now();

      setTimeLeft(Math.max(remaining, 0));
      progress.value =
        1 - Math.max(remaining, 0) / totalMs;
    };

    fetchBlock();
  }, [id]);

  // -----------------------------------------
  // TIMER
  // -----------------------------------------
  useEffect(() => {
    if (!block || timeLeft === null) return;

    const totalMs =
      new Date(block.scheduled_end).getTime() -
      new Date(block.started_at).getTime();

    intervalRef.current = setInterval(() => {
      const remaining =
        new Date(block.scheduled_end).getTime() -
        Date.now();

      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        finalizeSession("completed");

        return;
      }

      setTimeLeft(remaining);
      progress.value =
        1 - remaining / totalMs;
    }, 1000);

    return () => {
      if (intervalRef.current)
        clearInterval(intervalRef.current);
    };
  }, [block]);

  // -----------------------------------------
  // COMPLETE SESSION (AUTO)
  // -----------------------------------------


  // -----------------------------------------
  // MANUAL EXIT
  // -----------------------------------------
const finalizeSession = async (status: "completed" | "abandoned") => {
  if (!block) return;

  const actualDuration = Math.round(
    (Date.now() -
      new Date(block.started_at).getTime()) /
      60000
  );

  await supabase
    .from("focus_blocks")
    .update({
      status,
      actual_end: new Date().toISOString(),
      actual_duration: actualDuration,
    })
    .eq("id", block.id);

  router.replace({
    pathname: "/focus/summary",
    params: { id: block.id },
  });
};

  // -----------------------------------------
  // RING
  // -----------------------------------------
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      CIRCUMFERENCE -
      CIRCUMFERENCE * progress.value,
  }));

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const canExit =
    confirmation.trim().toLowerCase() ===
    block?.goal?.trim().toLowerCase();

  if (!block || timeLeft === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#4DA3FF"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Focus in progress
      </Text>

      <View style={styles.ringWrapper}>
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

        <View style={styles.timerCenter}>
          <Text style={styles.timerText}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <Text style={styles.goal}>
        {block.goal}
      </Text>

      <Pressable
        style={styles.exitButton}
        onPress={() => setShowExit(true)}
      >
        <Text style={styles.exitText}>
          End Session
        </Text>
      </Pressable>

      {showExit && (
        <View style={styles.exitOverlay}>
          <Text style={styles.verifyText}>
            Type your goal to exit:
          </Text>

          <TextInput
            style={styles.input}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="Re-type your goal"
            placeholderTextColor="#6B7A99"
          />

          <Pressable
            style={[
              styles.confirmButton,
              !canExit && { opacity: 0.4 },
            ]}
            disabled={!canExit}
            onPress={() => finalizeSession("abandoned")}

          >
            <Text style={styles.confirmText}>
              Confirm Exit
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1224",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loading: {
    flex: 1,
    backgroundColor: "#0B1224",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#6B7A99",
    fontSize: 14,
    marginBottom: 30,
  },
  ringWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  goal: {
    marginTop: 40,
    color: "#CBD3EA",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  exitButton: {
    marginTop: 50,
  },
  exitText: {
    color: "#4DA3FF",
    fontSize: 16,
  },
  exitOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#141A2B",
    padding: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  verifyText: {
    color: "#FFFFFF",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#1C294D",
    padding: 16,
    borderRadius: 12,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: "#4DA3FF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmText: {
    color: "#0B1224",
    fontWeight: "700",
  },
});
