import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Easing } from "react-native";
import { colors } from "../../constants/colors";


const { width, height } = Dimensions.get("window");

type Props = {
  onContinue: () => void;
  onBack?: () => void;    // ← add this
  headline: string;
  image?: any;
  step?: number;          // 1–10
};

export default function FunctionalScreenExample({
  onContinue,
  onBack,
  headline,
  image = require("../../assets/images/LogTimeBlock.png"),
  step = 2,
}: Props) {
  const [canContinue, setCanContinue] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(progressAnim, {
    toValue: 1,
    duration: 1500,
    easing: Easing.out(Easing.quad),
    useNativeDriver: false,
  }).start(() => {
    setCanContinue(true);
  });
}, []);


useEffect(() => {
  const timer = setTimeout(() => {
    setCanContinue(true);
  }, 1500);

  return () => clearTimeout(timer);
}, []);

const fillWidth = progressAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ["0%", "100%"],
});


  return (
    <LinearGradient
      colors={["#050816", colors.background ?? "#0B1224", "#111827"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >

{/* BACK BUTTON */}
{/* HEADER */}
<View style={styles.headerRow}>
  {/* Back */}
  <View style={styles.backSlot}>
    {onBack && step > 1 && (
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => [
          styles.backButton,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Ionicons name="chevron-back" size={26} color="#FFF" />
      </Pressable>
    )}
  </View>

  {/* Progress */}
  <View style={styles.progressContainer}>
    {Array.from({ length: 11 }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.progressDot,
          i + 1 <= step && styles.activeDot,
        ]}
      />
    ))}
  </View>

  {/* Right spacer (keeps progress centered) */}
 
</View>


      {/* HEADLINE */}
      <Text style={styles.headline}>{headline}</Text>

      {/* PHONE IMAGE */}
      <Image
        source={image}
        style={styles.phoneImage}
        resizeMode="contain"
      />

      {/* NEXT */}
      <Pressable
  style={({ pressed }) => [
    styles.nextButton,
    pressed && canContinue && { opacity: 0.6 },
  ]}
  onPress={onContinue}
  disabled={!canContinue}
>
  {/* Fill layer */}
  {!canContinue && (
    <Animated.View
      style={[
        styles.nextFill,
        { width: fillWidth },
      ]}
    />
  )}

  <Text
    style={[
      styles.nextText,
      !canContinue && styles.nextTextDisabled,
    ]}
  >
    {step < 10 ? "Next" : "Continue"}
  </Text>
</Pressable>


    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },


  progressDot: {
    width: width * 0.055,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#2A2A2A",
  },

  activeDot: {
    backgroundColor: "#FFF",
  },

  headline: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
    lineHeight: 34,
    maxWidth: width * 0.85,
    marginBottom: 10,
  },

  phoneImage: {
    width: width * 0.88,
    height: height * 0.48,
  },

  nextButton: {
    width: width * 0.88,
    height: 56,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },

  nextText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },

headerRow: {
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  marginBottom: 16,
},

backSlot: {
  width: 44, // same width as back button
  alignItems: "flex-start",
},

backButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: "center",
  alignItems: "center",
},

progressContainer: {
  flexDirection: "row",
  gap: 6,
},
nextButtonDisabled: {
  opacity: 0.4,
},

nextTextDisabled: {
  opacity: 0.8,
},

nextFill: {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  backgroundColor: "rgba(255,255,255,0.15)",
  borderRadius: 100,
},



});
