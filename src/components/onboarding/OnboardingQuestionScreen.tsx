import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import React from "react";

type Option = {
  id: string;
  label: string;
};

type Props = {
  question: string;
  subtitle?: string;
  options: Option[];
  onContinue: (selectedOptionId: string) => void;
  onBack?: () => void;
};

export default function OnboardingQuestionScreen({
  question,
  subtitle,
  options,
  onContinue,
  onBack,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack}>
            <Text style={styles.back}>←</Text>
          </Pressable>
        )}
        <View style={styles.progress} />
      </View>

      {/* Question */}
      <Text style={styles.question}>{question}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {/* Options */}
      <View style={styles.options}>
        {options.map(option => {
          const isSelected = selected === option.id;

          return (
            <Pressable
              key={option.id}
              onPress={() => setSelected(option.id)}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Continue */}
      <Pressable
        disabled={!selected}
        onPress={() => selected && onContinue(selected)}
        style={[
          styles.continue,
          !selected && styles.continueDisabled,
        ]}
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#0F1B3D",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  back: {
    color: "#FFFFFF",
    fontSize: 22,
    marginRight: 16,
  },

  progress: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },

  question: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 24,
  },

  options: {
    gap: 12,
    marginTop: 12,
  },

  option: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
  },

  optionSelected: {
    backgroundColor: "#1F3B8A",
    borderWidth: 1,
    borderColor: "#4DA3FF",
  },

  optionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },

  continue: {
    marginTop: "auto",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  continueDisabled: {
    opacity: 0.5,
  },

  continueText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
