import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";
import { useOnboarding } from "../../providers/OnboardingProvider";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const MAX = 5;

type Props = {
  onContinue: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  step?: number;
};

export default function OnboardingGoalsScreen({
  onContinue,
  onSkip,
  onBack,
  step = 5,
}: Props) {
  const { draftGoals, setDraftGoals, setGoals } = useOnboarding();

  function updateField(i: number, text: string) {
    setDraftGoals(prev => {
      const next = [...prev];
      next[i] = text;
      return next;
    });
  }

  function addGoal() {
    if (draftGoals.length < MAX) {
      setDraftGoals(prev => [...prev, ""]);
    }
  }

  function removeGoal(i: number) {
    if (i >= 3) {
      setDraftGoals(prev => prev.filter((_, idx) => idx !== i));
    }
  }

  const validGoals = draftGoals.filter(g => g.trim().length > 0);
  const canContinue = validGoals.length >= 3;

  function handleContinue() {
    setGoals(validGoals.map(g => g.trim()));
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>What are your goals right now?</Text>

          {draftGoals.map((value, i) => (
            <View key={i} style={styles.inputWrapper}>
              <TextInput
                value={value}
                onChangeText={text => updateField(i, text)}
                placeholder={`Goal ${i + 1}`}
                placeholderTextColor="#7482A6"
                style={styles.input}
                maxLength={72}
              />

              {i >= 3 && (
                <Pressable
                  onPress={() => removeGoal(i)}
                  hitSlop={10}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}

          {draftGoals.length < MAX && (
            <Pressable onPress={addGoal} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add another goal</Text>
            </Pressable>
          )}

          {onSkip && (
            <Pressable onPress={onSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </ScrollView>

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
      </KeyboardAvoidingView>
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
    marginBottom: 24,
  },

  inputWrapper: {
    position: "relative",
    marginBottom: 14,
  },

  input: {
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: "#FFF",
  },

  removeButton: {
    position: "absolute",
    right: 12,
    top: 12,
  },

  removeText: {
    color: "#8EA2C8",
    fontSize: 16,
  },

  addButton: {
    marginTop: 12,
    marginBottom: 32,
  },

  addButtonText: {
    color: "#4DA3FF",
    fontSize: 15,
    fontWeight: "600",
  },

  skipText: {
    color: "#8EA2C8",
    textAlign: "center",
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
