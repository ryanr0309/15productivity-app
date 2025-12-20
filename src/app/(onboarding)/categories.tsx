import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { CATEGORY_COLORS } from "../../constants/categoryColors";
import { Category, CATEGORIES } from "../../constants/categories";
import React from "react";

export default function OnboardingCategoriesScreen() {
  // Start from predefined categories
  const [categories, setCategories] = useState<Category[]>([...CATEGORIES]);

  const [label, setLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const usedColors = categories.map(c => c.color);
  const availableColors = CATEGORY_COLORS.filter(
    color => !usedColors.includes(color)
  );

  function addCategory() {
    if (!label || !selectedColor) return;

    setCategories(prev => [
      ...prev,
      {
        id: uuid.v4().toString(),
        label,
        color: selectedColor,
      },
    ]);

    setLabel("");
    setSelectedColor(null);
  }

  function deleteCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.progress} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Add categories you want to track</Text>
      <Text style={styles.subtitle}>
        These help us understand how you spend time and can be changed later
      </Text>

      {/* Category Pills */}
      <View style={styles.pills}>
        {categories.map(category => (
          <View
            key={category.id}
            style={[styles.pill, { backgroundColor: category.color }]}
          >
            <Text style={styles.pillText}>{category.label}</Text>
            <Pressable onPress={() => deleteCategory(category.id)}>
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
      </View>

      {/* Add Category */}
      <Text style={styles.label}>Category Name</Text>

      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="ex: School"
        placeholderTextColor="rgba(255,255,255,0.4)"
        style={styles.input}
      />

      {/* Color Picker */}
      <View style={styles.colorPicker}>
        {availableColors.map(color => (
          <Pressable
            key={color}
            onPress={() => setSelectedColor(color)}
            style={[
              styles.colorDot,
              { backgroundColor: color },
              selectedColor === color && styles.colorSelected,
            ]}
          />
        ))}
      </View>

      {/* Add Button */}
      <Pressable
        onPress={addCategory}
        disabled={!label || !selectedColor}
        style={[
          styles.addButton,
          (!label || !selectedColor) && styles.addDisabled,
        ]}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
      </Pressable>

      {/* Continue */}
      <Pressable
        disabled={categories.length === 0}
        onPress={() => {
          console.log("Final onboarding categories:", categories);
          router.push("/(onboarding)/ready"); // adjust to your flow
        }}
        style={[
          styles.continue,
          categories.length === 0 && styles.continueDisabled,
        ]}
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </View>
  );
}

/* ------------------ STYLES ------------------ */

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

  progress: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    marginLeft: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 24,
  },

  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 8,
  },

  pillText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },

  label: {
    color: "#FFFFFF",
    fontSize: 13,
    marginBottom: 6,
  },

  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    marginBottom: 12,
  },

  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  colorSelected: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  addButton: {
    alignSelf: "flex-start",
    backgroundColor: "#4DA3FF",
    padding: 10,
    borderRadius: 10,
    marginBottom: 24,
  },

  addDisabled: {
    opacity: 0.4,
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
    fontWeight: "600",
    fontSize: 16,
  },
});
