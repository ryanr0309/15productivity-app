import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";

type PersonalizedPlanLoadingProps = {
  onDone?: () => void;
  totalMs?: number;
};

export default function PersonalizedPlanLoading({
  onDone,
  totalMs = 3800,
}: PersonalizedPlanLoadingProps) {
  const steps = useMemo(
    () => [
      "Analyzing your goals...",
      "Analyzing your patterns...",
      "Importing your habits...",
      "Importing how you spend your day...",
    ],
    []
  );

  const finalHeadline =
    "You don’t know where the time goes,\nbut it escapes you 15 minutes at a time.";

  const stepMs = Math.floor(totalMs * 0.16);
  const finalHoldMs = Math.floor(totalMs * 0.36);

  const [index, setIndex] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
const progressRef = useRef(0);


  // Text animation
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;

  // Loading bar animation
  const barProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(barProgress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      })
    ).start();
  }, [barProgress]);

  useEffect(() => {
  const start = Date.now();
  const cap = 99; // never fully complete until done

  const interval = setInterval(() => {
    const elapsed = Date.now() - start;
    const pct = Math.min(
      cap,
      Math.floor((elapsed / totalMs) * cap)
    );

    progressRef.current = pct;
    setProgressPct(pct);
  }, 80);

  return () => clearInterval(interval);
}, [totalMs]);


  useEffect(() => {
    let cancelled = false;

    const animateIn = () =>
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]);

    const animateOut = () =>
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -4,
          duration: 160,
          useNativeDriver: true,
        }),
      ]);

    const run = async () => {
      fade.setValue(0);
      translateY.setValue(6);
      await new Promise(res => animateIn().start(res));

      for (let i = 0; i < steps.length; i++) {
        if (cancelled) return;
        await new Promise(res => setTimeout(res, stepMs));

        if (i < steps.length - 1) {
          await new Promise(res => animateOut().start(res));
          setIndex(i + 1);
          fade.setValue(0);
          translateY.setValue(6);
          await new Promise(res => animateIn().start(res));
        }
      }

      await new Promise(res => animateOut().start(res));
      if (cancelled) return;

      setShowFinal(true);
      fade.setValue(0);
      translateY.setValue(10);
      await new Promise(res => animateIn().start(res));

      await new Promise(res => setTimeout(res, finalHoldMs));
if (!cancelled) {
  setProgressPct(100);
  onDone?.();
}

    };

    run();
    return () => {
      cancelled = true;
    };
  }, [steps, stepMs, finalHoldMs, onDone]);

  const barWidth = barProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["20%", "90%"],
  });

  return (
  <LinearGradient
        colors={["#050816", colors.background ?? "#0B1224", "#111827"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
    {/* Header */}
    <View style={styles.header}>
      <Text style={styles.title}>Creating your personalized plan...</Text>

      <Text style={styles.finalHeadline}>
        {finalHeadline}
      </Text>
    </View>

    {/* Loader section (message + bar) */}
    <View style={styles.loaderSection}>
      {!showFinal && (
        <Animated.Text
          style={[
            styles.loadingText,
            { opacity: fade, transform: [{ translateY }] },
          ]}
        >
          {steps[index]}
        </Animated.Text>
      )}

      <View style={styles.barTrack}>
  <Animated.View style={[styles.barFill, { width: barWidth }]} />
</View>

<Text style={styles.percentText}>{progressPct}%</Text>

    </View>

    {/* Lottie below loader, closer to center */}
    <View style={styles.lottieWrapper}>
      <LottieView
        source={require("../../assets/animations/Steps.json")}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  </LinearGradient>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 22,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 14,
  },
  finalHeadline: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
    marginTop: 6,
    marginBottom: 24
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 220,
    height: 220,
    opacity: 0.9,
  },

  footer: {
    paddingBottom: 44,
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 14,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#4DA3FF",
  },
  header: {
  paddingTop: 194,
  marginBottom: 24,
},

loaderSection: {
  marginBottom: 32,
},

lottieWrapper: {
  flex: 1,
  alignItems: "center",
  justifyContent: "flex-start",
  paddingTop: 8,
},
percentText: {
  marginTop: 8,
  color: "rgba(255,255,255,0.5)",
  fontSize: 12,
  fontWeight: "600",
  alignSelf: "flex-end",
},


});
