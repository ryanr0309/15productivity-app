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

const PRESET_LABELS = [
  "💼 Work",
  "🎓 Academics",
  "🧽 Personal Care",
  "🏃 Physical Activity",
  "🧘 Meditation",
  "😴 Naps",
  "🍽️ Food",
  "👥 Friends/Family",
  "🤝 Networking",
  "🌍 Errands",
  "🎨 Creative",
  "🎧 Learning",
  "📺 TV",
  "🎮 Play",
  "🌿 Leisure",
  "📱 Social Media",
  "🛑 Unproductive",
];

type Props = {
  onContinue: () => void;
  onSkip?: () => void;
  step?: number;
  onBack?: () => void;
};

export default function OnboardingCategoryScreen({
  onContinue,
  onSkip,
  onBack,
  step = 7,
}: Props) {
  const {
    draftCategoryIds,
    setDraftCategoryIds,
    setCategories,
  } = useOnboarding();

  const MAX_SELECT = 10;

  const categories = PRESET_LABELS.map((label, i) => ({
    id: `preset-${i}`,
    label,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  function toggleCategory(id: string) {
    setDraftCategoryIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });
  }

  const canContinue = draftCategoryIds.length >= 3;

  function stripEmoji(label: string) {
    return label.replace(/^[^\w]+/g, "").trim();
  }

  function handleContinue() {
    const chosen = categories.filter(c =>
      draftCategoryIds.includes(c.id)
    );
    setCategories(chosen.map(c => stripEmoji(c.label)));
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
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
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
          How do you usually spend your days?
        </Text>

        <Text style={styles.sub}>
          Pick at least 3 categories that match your life.
        </Text>

        <View style={styles.chipContainer}>
          {categories.map(cat => {
            const isSelected = draftCategoryIds.includes(cat.id);

            return (
              <Pressable
                key={cat.id}
                onPress={() => toggleCategory(cat.id)}
                style={[
                  styles.chip,
                  isSelected && { backgroundColor: cat.color },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && {
                      color: "#0B1224",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.infoText}>
          You can edit categories later.
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
    marginTop: 16,
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
