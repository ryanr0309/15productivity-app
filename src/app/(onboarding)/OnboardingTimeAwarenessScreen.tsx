import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";

const OPTIONS = [
  {
    key: "none",
    title: "Not at all",
    desc: "It feels like time disappears and I don't know where it went.",
  },
  {
    key: "barely",
    title: "Barely",
    desc: "I lose track of hours in my day without realizing.",
  },
  {
    key: "somewhat",
    title: "Somewhat",
    desc: "I remember the big things but miss the details.",
  },
  {
    key: "mostly",
    title: "Mostly",
    desc: "I track important parts but not everything.",
  },
  {
    key: "completely",
    title: "Completely",
    desc: "I know exactly where my time goes each day.",
  },
];

type Props = {
  onContinue: (choice: string) => void;
  onSkip?: () => void;
};

export default function OnboardingTimeAwarenessScreen({
  onContinue,
  onSkip,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <LinearGradient
      colors={["#0B1224", "#111B34"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>
          How clearly do you understand where your time goes?
        </Text>
        <Text style={styles.subtext}>
          Be honest — most people lose hours without realizing it.
        </Text>

        <View style={styles.options}>
          {OPTIONS.map(opt => {
            const active = selected === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setSelected(opt.key)}
              >
                <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                  {opt.title}
                </Text>

                {active && (
                  <Text style={styles.cardDesc}>{opt.desc}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        disabled={!selected}
        style={[
          styles.button,
          !selected && styles.buttonDisabled,
        ]}
        onPress={() => selected && onContinue(selected)}
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
  cardTitleActive: {
    color: "#4DA3FF",
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
