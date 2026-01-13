import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";
import { CATEGORY_COLORS } from "../../constants/categoryColors";
import { useOnboarding } from "../../providers/OnboardingProvider";

const PRESET_LABELS = [
  "💼 Work",
  "📚 School",
  "🏋️ Fitness",
  "👥 Social",
  "🧽 Chores",
  "🎨 Creative",
  "🧠 Deep Work",
  "📖 Reading",
  "🎧 Learning",
  "🎮 Gaming",
  "🍿 Entertainment",
  "🥗 Meal Prep",
  "🧘 Self Care",
  "😴 Rest",
  "🛑 Unproductive",
];

type Props = {
  onContinue: () => void;
  onSkip?: () => void;
};

export default function OnboardingCategoryScreen({ onContinue, onSkip }: Props) {
  const { setCategories } = useOnboarding();

  const MAX_SELECT = 10;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleCategory(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECT) {
        next.add(id);
      }
      return next;
    });
  }

  const canContinue = selected.size >= 3;

  const categories = PRESET_LABELS.map((label, index) => ({
    id: `preset-${index}`,
    label,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  function stripEmoji(label: string) {
    return label.replace(/^[^\w]+/g, "").trim(); // removes emoji + spaces
  }

  function handleContinue() {
    const chosen = categories.filter(c => selected.has(c.id));

    // Extract onboarding-friendly strings
    const labels = chosen.map(c => stripEmoji(c.label));

    // Write to onboarding context
    setCategories(labels);

    // Proceed to next onboarding step (parent handles step)
    onContinue();
  }

  return (
    <LinearGradient colors={["#0B1224", "#111B34"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>How do you usually spend your days?</Text>
        <Text style={styles.sub}>Pick the categories that match your life.</Text>

        <View style={styles.chipContainer}>
          {categories.map(cat => {
            const isSelected = selected.has(cat.id);

            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.chip,
                  isSelected && { backgroundColor: cat.color },
                ]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && { color: "#0B1224", fontWeight: "700" },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.infoText}>You can edit categories later.</Text>

      <Pressable
        disabled={!canContinue}
        onPress={handleContinue}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>

      {onSkip && (
        <Pressable onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 120,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
    lineHeight: 34,
  },
  infoText: {
  color: "#8EA2C8",
  fontSize: 14,
  marginTop: 12,
  marginBottom: 16,
},

  sub: {
    color: "#B8C5E4",
    fontSize: 15,
    marginBottom: 28,
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
  backgroundColor: "#151E36", // consistent onboarding UI
},
chipSelected: {
  borderWidth: 1.5,
  borderColor: "#4DA3FF",
},
chipText: {
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: "600",
},

  addChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "#4DA3FF",
  },
  addChipText: {
    color: "#4DA3FF",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    height: 56,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: "#4DA3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#0B1224",
    fontWeight: "700",
    fontSize: 17,
  },
  skip: {
    alignSelf: "center",
    marginBottom: 24,
  },
  skipText: {
    color: "#8EA2C8",
    fontSize: 15,
  },
});
