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
import { CATEGORY_COLORS } from "../../constants/categoryColors";
import { useOnboarding } from "../../providers/OnboardingProvider";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const PRESET_HABITS = [
  "🏋️ Gym",
  "📖 Reading",
  "🧠 Deep Work",
  "📝 Journaling",
  "📅 Planning / Day Review",
  "🍳 Cooking at Home",
  "🎧 Language Practice",
  "🚶 Daily Walk",
  "💻 Coding Practice",
  "🤝 Professional Outreach",
  "📵 Screen-Free Time",
];

type Props = {
  onContinue: () => void;
  onSkip?: () => void;
  step?: number;
  onBack?: () => void;
};

export default function OnboardingHabitScreen({
  onContinue,
  onSkip,
  onBack,
  step = 9,
}: Props) {
  const {
    draftHabitIds,
    setDraftHabitIds,
    setHabits,
  } = useOnboarding();

  const MAX = 5;

  const habits = PRESET_HABITS.map((label, i) => ({
    id: `habit-${i}`,
    label,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  function toggleHabit(id: string) {
    setDraftHabitIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= MAX) return prev;
      return [...prev, id];
    });
  }

  const canContinue = draftHabitIds.length >= 1;

  function handleContinue() {
    const chosen = habits.filter(h =>
      draftHabitIds.includes(h.id)
    );

    // ✅ KEEP habits as string[]
    setHabits(
  chosen.map(h => ({
    label: h.label,
    color: h.color,
  }))
);

    onContinue();
  }

  return (
    <LinearGradient
      colors={["#050816", colors.background ?? "#0B1224", "#111827"]}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.backSlot}>
          {onBack && (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={styles.backButton}
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
          What habits are you working on?
        </Text>

        <Text style={styles.sub}>
          Pick the things you want to show up for.
        </Text>

        <View style={styles.chipContainer}>
          {habits.map(h => {
            const active = draftHabitIds.includes(h.id);

            return (
              <Pressable
                key={h.id}
                onPress={() => toggleHabit(h.id)}
                style={[
                  styles.chip,
                  active && { backgroundColor: h.color },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && {
                      color: "#0B1224",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {h.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.infoText}>
          You can add or change habits anytime.
        </Text>
      </ScrollView>

      {/* NEXT */}
      <Pressable
        disabled={!canContinue}
        onPress={handleContinue}
        style={[
          styles.nextButton,
          !canContinue && { opacity: 0.4 },
        ]}
      >
        <Text style={styles.nextText}>Next</Text>
      </Pressable>

      {onSkip && (
        <Pressable onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },

  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backSlot: {
    width: 44,
  },

  backButton: {
    width: 44,
    height: 44,
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
    paddingBottom: 30,
  },

  headline: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 10,
  },

  sub: {
    textAlign: "center",
    fontSize: 15,
    color: "#B8C5E4",
    marginBottom: 24,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.85)",
  },

  chipText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },

  infoText: {
    textAlign: "center",
    color: "#8EA2C8",
    fontSize: 14,
    marginTop: 20,
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

  skipText: {
    color: "#8EA2C8",
    textAlign: "center",
    marginBottom: 32,
  },
});
