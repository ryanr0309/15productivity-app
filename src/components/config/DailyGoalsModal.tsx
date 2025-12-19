import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { colors } from "../../constants/colors";
import React, { useState, useEffect } from "react";

type Props = {
  initialGoals: string[];
  onSave: (goals: string[]) => void;
};

export default function DailyGoalsModal({
  initialGoals,
  onSave,
}: Props) {
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  function updateGoal(text: string, index: number) {
    const updated = [...goals];
    updated[index] = text;
    setGoals(updated);
  }

  function removeGoal(index: number) {
    setGoals(goals.filter((_, i) => i !== index));
  }

  function addGoal() {
    if (goals.length < 3) {
      setGoals([...goals, ""]);
    }
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />

      <Text style={styles.title}>Daily Goals</Text>
      <Text style={styles.subtitle}>
        Pick up to 3 things that matter most today
      </Text>

      {goals.map((goal, index) => (
        <View key={index} style={styles.goalRow}>
          <TextInput
            value={goal}
            onChangeText={(text) => updateGoal(text, index)}
            placeholder={`Goal #${index + 1}`}
            style={styles.input}
          />

          <Pressable onPress={() => removeGoal(index)}>
            <Text style={styles.delete}>🗑️</Text>
          </Pressable>
        </View>
      ))}

      {goals.length < 3 && (
        <Pressable onPress={addGoal} style={styles.addRow}>
          <Text style={styles.add}>＋ Add Goal</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.saveButton}
        onPress={() => onSave(goals.filter(g => g.trim() !== ""))}
      >
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#F7F7F7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCC",
    alignSelf: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },

  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  input: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },

  delete: {
    fontSize: 18,
  },

  addRow: {
    marginBottom: 20,
  },

  add: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: "#18C964",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },

  saveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
