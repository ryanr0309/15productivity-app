import { View, Text, ScrollView, StyleSheet } from "react-native";
import CoachPromptCard from "../../components/coach/CoachPromptCard";
import { colors } from "../../constants/colors";
import React from "react";

const REFLECTION_PROMPTS = [
  "Why was today unproductive?",
  "What did I do well today?",
  "What distracted me the most?",
];

const PLANNING_PROMPTS = [
  "How should I structure tomorrow?",
  "When should I do my hardest work?",
  "How can I avoid yesterday mistakes?",
];

const HABIT_PROMPTS = [
  "How do I reduce phone usage?",
  "How can I stay consistent?",
  "How do I improve my focus?",
];

export default function Coaching() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <Text style={styles.header}>15 Productivity</Text>

      {/* Reflection */}
      <Section title="Reflection">
        {REFLECTION_PROMPTS.map((p) => (
          <CoachPromptCard key={p} text={p} />
        ))}
      </Section>

      {/* Planning */}
      <Section title="Planning">
        {PLANNING_PROMPTS.map((p) => (
          <CoachPromptCard key={p} text={p} />
        ))}
      </Section>

      {/* Habits */}
      <Section title="Habits">
        {HABIT_PROMPTS.map((p) => (
          <CoachPromptCard key={p} text={p} />
        ))}
      </Section>
    </ScrollView>
  );
}

/* ---------- Helper Section Wrapper ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },

  header: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
});
