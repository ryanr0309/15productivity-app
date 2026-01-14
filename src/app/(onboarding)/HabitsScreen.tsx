import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CATEGORY_COLORS } from "../../constants/categoryColors";
import { colors } from "../../constants/colors";
import AddCategoryModal from "../../components/categories/AddCategoryModal";
import { useOnboarding } from "../../providers/OnboardingProvider";

const PRESET_HABITS = [
  "🏋️ Gym",
  "📚 Reading",
  "🧘 Meditation",
  "🧠 Deep Work",
  "📝 Journaling",
  "🧼 Cleaning",
  "🍳 Cooking",
  "🎧 Language Learning",
  "🚶 Walking",
  "🎨 Creative Practice",
  "💻 Coding",
  "🛏️ Sleep Hygiene",
  "🥤 Hydration",
  "🤝 Networking",
  "📱 Digital Detox",
];

type Props = {
  onContinue: () => void;
  onSkip?: () => void;
};

export default function OnboardingHabitScreen({ onContinue, onSkip }: Props) {
  const { goals, categories, setHabits } = useOnboarding();

  

  const MAX = 5;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);

  const habits = PRESET_HABITS.map((label, index) => ({
    id: `habit-${index}`,
    label,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX) {
        next.add(id);
      }
      return next;
    });
  }

  function stripEmoji(label: string) {
    return label.replace(/^[^\w]+/g, "").trim();
  }

  const canContinue = selected.size >= 1;

  function handleContinue() {
    const chosen = habits.filter(h => selected.has(h.id));
    const names = chosen.map(h => stripEmoji(h.label));

    setHabits(names); // ← onboarding context

    onContinue(); // ← step(4) for example
  }

  return (
    <LinearGradient colors={["#0B1224", "#111B34"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>What habits are you working on?</Text>
        <Text style={styles.sub}>Pick the things you want to show up for.</Text>

        <View style={styles.chipContainer}>
          {habits.map(h => {
            const active = selected.has(h.id);
            return (
              <Pressable
                key={h.id}
                onPress={() => toggle(h.id)}
                style={[
                  styles.chip,
                  active && {
                    borderWidth: 2,
                    borderColor: "#F5D93D",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && { color: "white", fontWeight: "700" },
                  ]}
                >
                  {h.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable style={styles.addChip} onPress={() => setModalVisible(true)}>
            <Text style={styles.addChipText}>+ Add Habit</Text>
          </Pressable>
        </View>

        <Text style={styles.info}>You can add or change habits anytime.</Text>
      </ScrollView>

      <Pressable
        disabled={!canContinue}
        style={[styles.button, !canContinue && { opacity: 0.4 }]}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>

      {onSkip && (
        <Pressable onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      <AddCategoryModal
        visible={modalVisible}
        categories={[]}
        habits={habits}
        onCreate={({ label, color }) => {
          // TODO: add custom habits if needed
        }}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 44, paddingBottom: 120 },
  header: {
    color: "white",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
    lineHeight: 34,
  },
  sub: { color: "#B8C5E4", fontSize: 15, marginBottom: 28 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: "#151E36",
    borderRadius: 14,
  },
  chipText: { color: "white", fontSize: 15, fontWeight: "600" },
  addChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#4DA3FF",
  },
  addChipText: { color: "#4DA3FF", fontWeight: "600" },
  info: { color: "#8EA2C8", marginTop: 20, fontSize: 14 },
  button: {
    height: 56,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: "#4DA3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#0B1224", fontWeight: "700", fontSize: 17 },
  skip: { alignSelf: "center", marginBottom: 24 },
  skipText: { color: "#8EA2C8", fontSize: 15 },
});
