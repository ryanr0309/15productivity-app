import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { CATEGORY_COLORS } from "../../constants/categoryColors";
import ColorPicker from "../ColorPicker";
import { Category } from "../../constants/categories";
import { Habit } from "../../constants/habits";


type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;

  categories: Category[];
  habits: Habit[];
};


export default function AddHabitModal({
  visible,
  onClose,
  onSave,
  categories,
  habits,
}: Props) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] =
    useState<string | null>(null);

  const usedColors = [
    ...categories.map(c => c.color),
    ...habits.map(h => h.color),
  ];

useEffect(() => {
  if (!visible) return;

  setName("");

  const firstAvailable = CATEGORY_COLORS.find(
    c => !usedColors.includes(c)
  );

  setSelectedColor(firstAvailable ?? null);
}, [visible]);


  async function handleSave() {
    if (!name.trim() || !selectedColor) return;
    await onSave(name.trim(), selectedColor);
    onClose();
  }

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>New Habit</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor="#6B7280"
            style={styles.input}
            autoFocus
          />

          <Text style={styles.label}>Color</Text>

          <ColorPicker
            selectedColor={selectedColor}
            usedColors={usedColors}
            onSelect={setSelectedColor}
          />

          <View style={styles.actions}>
            <Pressable onPress={onClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={!name.trim() || !selectedColor}
            >
              <Text
                style={[
                  styles.save,
                  (!name.trim() || !selectedColor) &&
                    styles.saveDisabled,
                ]}
              >
                Create
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "90%",
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },

  input: {
    backgroundColor: "#020617",
    color: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  label: {
    color: "#94A3B8",
    fontSize: 13,
    marginBottom: 8,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  selected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cancel: {
    color: "#9CA3AF",
    fontSize: 15,
  },

  save: {
    color: "#38BDF8",
    fontSize: 15,
    fontWeight: "700",
  },

  saveDisabled: {
    opacity: 0.4,
  },
});
