import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

type Props = {
  visible: boolean;
  goals: string[];
  onClose: () => void;
  onSaved?: (goals: string[]) => void;
};

export default function EditGoalsModal({
  visible,
  goals,
  onClose,
  onSaved,
}: Props) {
  const [localGoals, setLocalGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalGoals(goals.length ? goals : [""]);
    }
  }, [visible, goals]);

  function updateGoal(index: number, value: string) {
    setLocalGoals(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  function addGoal() {
    setLocalGoals(prev => [...prev, ""]);
  }

  function deleteGoal(index: number) {
    setLocalGoals(prev =>
      prev.filter((_, i) => i !== index)
    );
  }

  async function handleSave() {
    setSaving(true);

    // Clean goals: trim + remove empty
    const cleaned = localGoals
      .map(g => g.trim())
      .filter(Boolean);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("user_settings")
      .update({ goals: cleaned })
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      console.error("Failed to save goals", error);
      return;
    }

    onSaved?.(cleaned);
    onClose();
  }

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.sheetContainer}>
          <View style={styles.container}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
              <Text style={styles.title}>Edit Goals</Text>
            </View>

            {/* Goals list */}
            {localGoals.map((goal, index) => (
              <View key={index} style={styles.goalRow}>
                <Text style={styles.index}>
                  {index + 1}
                </Text>

                <TextInput
                  value={goal}
                  onChangeText={text =>
                    updateGoal(index, text)
                  }
                  placeholder="Enter goal"
                  placeholderTextColor="#B0B8D4"
                  style={styles.input}
                />

                <Pressable
                  onPress={() => deleteGoal(index)}
                  hitSlop={10}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#B0B8D4"
                  />
                </Pressable>
              </View>
            ))}

            {/* Add goal */}
            <Pressable style={styles.addRow} onPress={addGoal}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addText}>
                Add goal
              </Text>
            </Pressable>

            {/* Save */}
            <Pressable
              style={[
                styles.primaryButton,
                saving && styles.disabledButton,
              ]}
              disabled={saving}
              onPress={handleSave}
            >
              <Text style={styles.primaryText}>
                Save Goals
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    backgroundColor: "#1E2A4A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6B7280",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  index: {
    width: 18,
    color: "#B0B8D4",
    fontSize: 14,
    textAlign: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#4DA3FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  sheetContainer: {
    paddingBottom: 12,
    maxHeight: "85%",
  },
});
