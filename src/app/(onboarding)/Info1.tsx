import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
} from "react-native";
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
  return (
    <LinearGradient
      colors={["#050816", colors.background ?? "#0B1224", "#111827"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >


      {/* PROGRESS */}
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

      {/* HEADLINE */}
      <Text style={styles.headline}>{headline}</Text>

      {/* PHONE IMAGE */}
      <Image
        source={image}
        style={styles.phoneImage}
        resizeMode="contain"
      />

      {/* NEXT */}
      <Pressable style={styles.nextButton} onPress={onContinue}>
        <Text style={styles.nextText}>
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

  progressContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 20,
  },

  progressDot: {
    width: width * 0.07,
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
});
