// OnboardingPainScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors"; // adjust path if needed
import { useOnboarding } from "../../providers/OnboardingProvider";

type Props = {
  onContinue: (choiceId: string) => void;
  onSkip?: () => void;
};

const OPTIONS = [
  {
    id: "scattered",
    title: "Time feels scattered",
    description:
      "You jump between tasks, and days blur together without a clear sense of progress.",
  },
  {
    id: "inconsistent",
    title: "Hard to stay consistent",
    description:
      "You have good days, but routines don’t stick long enough to see real change.",
  },
  {
    id: "no-idea",
    title: "Not sure where my time goes",
    description:
      "You finish the day tired but can’t clearly explain where the hours went.",
  },
  {
    id: "distractions",
    title: "Too many distractions",
    description:
      "Notifications, scrolling, and context-switching keep stealing your attention.",
  },
  {
    id: "goals",
    title: "Want more progress on goals",
    description:
      "You have things you care about, but they rarely get the focused time they deserve.",
  },
];

export default function PainScreen({
  onContinue,
  onSkip,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedId) return;
    onContinue(selectedId);
  };

  const { goals, habits, categories } = useOnboarding();
  console.log("ONBOARDING STATE:", { goals, habits, categories });


  return (
    <LinearGradient
      colors={["#050816", colors.background ?? "#0B1224", "#111827"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topRow}>
          <View style={{ width: 50 }} />
          <View />
          {onSkip && (
            <Pressable onPress={onSkip} hitSlop={10}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>
            What feels hardest about managing your time right now?
          </Text>
          <Text style={styles.subtitle}>
            This helps 15 understand your pace and context.
          </Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {OPTIONS.map(option => {
              const selected = option.id === selectedId;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedId(option.id)}
                  style={[
                    styles.optionCard,
                    selected && styles.optionCardSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      selected && styles.optionTitleSelected,
                    ]}
                  >
                    {option.title}
                  </Text>

                  {selected && (
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.helperText}>
            Your answer won’t limit access to any features.
          </Text>

          {/* Continue button */}
          <Pressable
            onPress={handleContinue}
            disabled={!selectedId}
            style={[
              styles.continueButton,
              !selectedId && styles.continueButtonDisabled,
            ]}
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  skipText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "500",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 30,
    marginBottom: 10,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 28,
  },
  optionsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15,23,42,0.9)", // slate-ish
  },
  optionCardSelected: {
    backgroundColor: "#F9FAFB",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  optionTitleSelected: {
    color: "#020617",
  },
  optionDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },
  helperText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  continueButton: {
    height: 54,
    borderRadius: 999,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#020617",
  },
});
