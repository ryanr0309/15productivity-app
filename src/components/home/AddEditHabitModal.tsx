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

type Props = {
  visible: boolean;
  initialName?: string;
  initialColor?: string;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
};

export default function AddEditHabitModal({
  visible,
  initialName,
  initialColor,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? "");
      setColor(initialColor ?? CATEGORY_COLORS[0]);
    }
  }, [visible, initialName, initialColor]);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {initialName ? "Edit Habit" : "New Habit"}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />

          <Text style={styles.label}>Color</Text>

          <View style={styles.colorGrid}>
            {CATEGORY_COLORS.map(c => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.selected,
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => onSave(name.trim(), color)}
              disabled={!name.trim()}
            >
              <Text style={styles.save}>Save</Text>
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
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#020617",
    color: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
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
    marginBottom: 20,
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
});
