import React, { useState } from "react";
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
import AddCategoryModal from "../../components/categories/AddCategoryModal";


const { width, height } = Dimensions.get("window");

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
  step?: number;
  onBack?: () => void;
};

export default function OnboardingHabitScreen({
  onContinue,
  onSkip,
  onBack,
  step = 9,
}: Props) {
  const { setHabits } = useOnboarding();

  const MAX = 5;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);

  const habits = PRESET_HABITS.map((label, i) => ({
    id: `habit-${i}`,
    label,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX) next.add(id);
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
    setHabits(names);
    onContinue();
  }

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
            const active = selected.has(h.id);

            return (
              <Pressable
                key={h.id}
                onPress={() => toggle(h.id)}
                style={[
                  styles.chip,
                  active && { backgroundColor: h.color },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && { color: "#0B1224", fontWeight: "700" },
                  ]}
                >
                  {h.label}
                </Text>
              </Pressable>
            );
          })}

          {/* Add habit chip */}
          <Pressable style={styles.addChip} onPress={() => setModalVisible(true)}>
            <Text style={styles.addChipText}>+ Add Habit</Text>
          </Pressable>
        </View>

        <Text style={styles.infoText}>
          You can add or change habits anytime.
        </Text>
      </ScrollView>

      {/* NEXT */}
      <Pressable
        disabled={!canContinue}
        style={[styles.nextButton, !canContinue && { opacity: 0.4 }]}
        onPress={handleContinue}
      >
        <Text style={styles.nextText}>Next</Text>
      </Pressable>

      {onSkip && (
        <Pressable onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Add Habit Modal */}
      <AddCategoryModal
        visible={modalVisible}
        categories={[]}
        habits={habits}
        onCreate={({ label, color }) => {
          // optional: custom habit support later
        }}
        onClose={() => setModalVisible(false)}
      />
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

  topRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,                 // spacing between arrow & bar
  marginBottom: 20,
  width: "100%",
},

  /** Progress **/
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
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  addChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#4DA3FF",
  },
  addChipText: {
    color: "#4DA3FF",
    fontWeight: "600",
    fontSize: 15,
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

  skip: {
    alignSelf: "center",
    marginBottom: 32,
  },
  skipText: {
    color: "#8EA2C8",
    fontSize: 15,
  },
});
