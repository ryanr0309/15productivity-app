import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "../../providers/OnboardingProvider";

const { width } = Dimensions.get("window");

const OPTIONS = [
  {
    key: "none",
    title: "Not at all",
    desc: "It feels like time disappears and I don't know where it went.",
  },
  {
    key: "barely",
    title: "Barely",
    desc: "I lose track of hours in my day without realizing.",
  },
  {
    key: "somewhat",
    title: "Somewhat",
    desc: "I remember the big things but miss the details.",
  },
  {
    key: "mostly",
    title: "Mostly",
    desc: "I track important parts but not everything.",
  },
  {
    key: "completely",
    title: "Completely",
    desc: "I know exactly where my time goes each day.",
  },
];

type Props = {
  onContinue: (choice: string) => void;
  onSkip?: () => void;
  onBack?: () => void;
  step?: number;
};

export default function OnboardingTimeAwarenessScreen({
  onContinue,
  onBack,
  step = 3,
}: Props) {
  const { timeAwareness, setTimeAwareness } = useOnboarding();

  return (
    <LinearGradient
      colors={["#050816", colors.background ?? "#0B1224", "#111827"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
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
      </View>

      {/* CONTENT */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headline}>
          How clearly do you understand where your time goes?
        </Text>

        <View style={styles.options}>
          {OPTIONS.map(opt => {
            const active = timeAwareness === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[
                  styles.card,
                  active && styles.cardActive,
                ]}
                onPress={() => setTimeAwareness(opt.key)}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    active && styles.cardTitleActive,
                  ]}
                >
                  {opt.title}
                </Text>

                {active && (
                  <Text style={styles.cardDesc}>{opt.desc}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* NEXT */}
      <Pressable
        disabled={!timeAwareness}
        style={[
          styles.nextButton,
          !timeAwareness && { opacity: 0.4 },
        ]}
        onPress={() => timeAwareness && onContinue(timeAwareness)}
      >
        <Text style={styles.nextText}>Next</Text>
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

  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 16,
  },

  backSlot: {
    width: 44,
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

  progressDot: {
    width: width * 0.055,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#2A2A2A",
  },

  activeDot: {
    backgroundColor: "#FFF",
  },

  content: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 30,
  },

  headline: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    color: "#FFF",
    marginBottom: 24,
    paddingHorizontal: 12,
  },

  options: {
    gap: 14,
    marginBottom: 24,
  },

  card: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15,23,42,0.85)",
  },

  cardActive: {
    backgroundColor: "#FFFFFF",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E5E7EB",
  },

  cardTitleActive: {
    color: "#020617",
  },

  cardDesc: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
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
