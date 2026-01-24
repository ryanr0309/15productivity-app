import React, { useState } from "react";
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


const { width, height } = Dimensions.get("window");

type Props = {
  onContinue: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  step?: number;
};

export default function OnboardingGoalsScreen({ onContinue, onSkip, onBack, step = 5 }: Props) {
  const { setGoals } = useOnboarding();
  const [fields, setFields] = useState<string[]>(["", "", ""]);
  const MAX = 5;

  function updateField(i: number, text: string) {
    setFields(prev => {
      const next = [...prev];
      next[i] = text;
      return next;
    });
  }

  function addGoal() {
    if (fields.length < MAX) setFields(prev => [...prev, ""]);
  }

  function removeGoal(i: number) {
    if (i >= 3) {
      setFields(prev => prev.filter((_, idx) => idx !== i));
    }
  }

  const validGoals = fields.filter(f => f.trim().length > 0);
  const canContinue = validGoals.length >= 3;

  function handleContinue() {
    const cleaned = validGoals.map(g => g.trim());
    setGoals(cleaned);
    onContinue();
  }

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <Text style={styles.headline}>
            What are your goals right now?
          </Text>

          {fields.map((value, i) => (
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

          {fields.length < MAX && (
            <Pressable onPress={addGoal} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add another goal</Text>
            </Pressable>
          )}

          {onSkip && (
            <Pressable onPress={onSkip} style={styles.skip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Continue */}
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
    alignItems: "center",
    justifyContent: "space-between",
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
    marginBottom: 24,
    paddingHorizontal: 12,
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
    color: "#FFFFFF",
    fontSize: 15,
  },
  removeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  removeText: {
    fontSize: 16,
    color: "#8EA2C8",
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

  skip: {
    alignSelf: "center",
    marginTop: 10,
  },
  skipText: {
    color: "#8EA2C8",
    fontSize: 15,
  },

  /** Continue Button **/
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
