import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ColorPicker from "../../components/ColorPicker";
import { Category } from "../../constants/categories";
import Modal from "react-native-modal";



type Props = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onCreate: (category: Category) => void;
};


export default function AddCategoryModal({
  visible,
  onClose,
  categories,
  onCreate,
}: Props) {
  const [label, setLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const usedColors = categories.map((c) => c.color);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setLabel("");
      setSelectedColor(null);
    }
  }, [visible]);

  const canSave = label.trim().length > 0 && selectedColor !== null;

 

const handleSave = () => {
  if (!canSave) return;

  const newCategory = {
    label: label.trim(),
    color: selectedColor!,
  };

  onCreate(newCategory as any); // ID will be added in Home
  onClose();
};




  return (
    <Modal
  isVisible={visible}
  onBackdropPress={onClose}
  onBackButtonPress={onClose}
  style={{ margin: 0, justifyContent: "center" }}
>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Category</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <Text style={styles.label}>Category name</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Gym"
            placeholderTextColor="#8B93B0"
            style={styles.input}
          />

          {/* Color Picker */}
          <Text style={styles.label}>Color</Text>
          <ColorPicker
            selectedColor={selectedColor}
            usedColors={usedColors}
            onSelect={setSelectedColor}
          />

          {/* Save */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { opacity: canSave ? 1 : 0.4 },
            ]}
            disabled={!canSave}
            onPress={handleSave}
          >
            <Text style={styles.saveText}>Add Category</Text>
          </TouchableOpacity>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E2433",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 20,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  /* SECTION LABELS */
  label: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },

  /* INPUT */
  input: {
    backgroundColor: "#252B3A",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* PRIMARY ACTION */
  saveButton: {
    backgroundColor: "#4DA3FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 22,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

