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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useOnboarding } from "../../providers/OnboardingProvider";

type Props = {
  onContinue: () => void;       // we no longer need to pass goals up
  onSkip?: () => void;
};

export default function OnboardingGoalsScreen({ onContinue, onSkip }: Props) {
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
    if (fields.length < MAX) {
      setFields(prev => [...prev, ""]);
    }
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
    setGoals(cleaned);     // ✅ write into context
    onContinue();          // ✅ tell parent to go to next step (step(2))
  }

  return (
    <LinearGradient colors={["#0B1224", "#111B34"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>What are your goals right now?</Text>
          <Text style={styles.sub}>
            These help us personalize your experience and measure progress.
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

        <Pressable
          disabled={!canContinue}
          onPress={handleContinue}
          style={[styles.button, !canContinue && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  sub: {
    color: "#B8C5E4",
    fontSize: 15,
    marginBottom: 28,
    lineHeight: 20,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#151E36",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#1F2A44",
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
  button: {
    height: 56,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: "#4DA3FF",
    justifyContent: "center",
    alignItems: "center",
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
    marginTop: 20,
  },
  skipText: {
    color: "#8EA2C8",
    fontSize: 15,
  },
});
