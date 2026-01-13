import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";

const OPTIONS = [
  {
    key: "productivity",
    title: "Productivity",
    desc: "Get more meaningful work done each day.",
  },
  {
    key: "focus",
    title: "Focus",
    desc: "Stay on-task and eliminate distractions.",
  },
  {
    key: "consistency",
    title: "Consistency",
    desc: "Show up every day, not just occasionally.",
  },
  {
    key: "balance",
    title: "Balance",
    desc: "Create time for work, life, and self-care.",
  },
  {
    key: "accountability",
    title: "Accountability",
    desc: "Feel more in control and responsible.",
  },
  {
    key: "motivation",
    title: "Motivation",
    desc: "Actually want to follow through.",
  },
  {
    key: "progress",
    title: "Progress Toward Goals",
    desc: "Keep moving the needle forward.",
  },
  {
    key: "habits",
    title: "Better Habits",
    desc: "Build routines that compound over time.",
  },
];

type Props = {
  onContinue: (choices: string[]) => void;
  onSkip?: () => void;
};


export default function OnboardingDesireScreen({
  onContinue,
  onSkip,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggleOption(key: string) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
    );
    setExpanded(prev => (prev === key ? null : key));
  }

  return (
    <LinearGradient
      colors={["#0B1224", "#111B34"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>What do you want more of this year?</Text>
        <Text style={styles.subtext}>Pick 1–3 that matter most to you.</Text>

        <View style={styles.options}>
          {OPTIONS.map(opt => {
            const isSelected = selected.includes(opt.key);
            const isOpen = expanded === opt.key;

            return (
              <Pressable
                key={opt.key}
                style={[
                  styles.card,
                  isSelected && styles.cardActive
                ]}
                onPress={() => toggleOption(opt.key)}
              >
                <Text style={styles.cardTitle}>{opt.title}</Text>
                {isOpen && (
                  <Text style={styles.cardDesc}>{opt.desc}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        disabled={selected.length === 0}
        style={[
          styles.button,
          selected.length === 0 && styles.buttonDisabled,
        ]}
        onPress={() => onContinue(selected)}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  header: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: "#B8C5E4",
    marginBottom: 28,
  },
  options: {
    gap: 12,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#151E36",
  },
  cardActive: {
    borderWidth: 1.5,
    borderColor: "#4DA3FF",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardDesc: {
    fontSize: 14,
    color: "#BFD4F4",
    marginTop: 6,
    lineHeight: 20,
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
    fontSize: 17,
    fontWeight: "700",
  },
});
