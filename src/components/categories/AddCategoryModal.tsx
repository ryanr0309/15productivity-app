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
      <View style={styles.overlay}>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  label: {
    color: "#CBD5F5",
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#4DA3FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
