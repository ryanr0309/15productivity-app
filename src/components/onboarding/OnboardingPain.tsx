import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";


const { width, height } = Dimensions.get("window");

type Props = {
  onContinue: (choiceId: string) => void;
  onSkip?: () => void;
  onBack?: () => void;
  step?: number;
  
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

export default function PainScreen({ onContinue, onSkip, onBack, step = 1 }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedId) return;
    onContinue(selectedId);
  };

  return (
    <LinearGradient
      colors={["#050816", colors.background ?? "#0B1224", "#111827"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
   

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE */}
        <Text style={styles.headline}>
          What feels hardest about managing your time right now?
        </Text>

        {/* OPTIONS */}
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
          Your answer won't limit access to any features.
        </Text>
      </ScrollView>

      {/* Continue */}
      <Pressable
        onPress={handleContinue}
        disabled={!selectedId}
        style={[
          styles.nextButton,
          !selectedId && { opacity: 0.4 },
        ]}
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

  /** Progress bar **/
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

  /** Content **/
  content: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
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

  optionsContainer: {
    gap: 14,
    marginBottom: 24,
  },

  optionCard: {
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15,23,42,0.85)",
  },
  optionCardSelected: {
    backgroundColor: "#FFF",
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

  /** Continue button **/
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
