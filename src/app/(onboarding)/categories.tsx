import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { CATEGORY_COLORS } from "../../constants/categoryColors";
import { Category } from "../../constants/categories";
import { addCategory, fetchCategories, deleteCategory } from "../../services/categories";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../lib/supabase";

/* ------------------ DEFAULT CATEGORIES ------------------ */

const DEFAULT_CATEGORIES = [
  { label: "School", color: "#4DA3FF" },
  { label: "Gym", color: "#18C964" },
  { label: "Work", color: "#FFB020" },
  { label: "Deep Focus", color: "#8B5CF6" },
];

/* ------------------ SCREEN ------------------ */

export default function OnboardingCategoriesScreen() {
  /* ---------- AUTH ---------- */
  const authUser = useAuthStore((s) => s.user);
 

  if (!authUser) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#FFFFFF" }}>Loading...</Text>
      </View>
    );
  }

  const userId = authUser.id;


  /* ---------- STATE ---------- */
  const [categories, setCategories] = useState<Category[]>([]);
  const [label, setLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  /* ---------- DERIVED ---------- */
  const usedColors = categories.map((c) => c.color);
  const availableColors = CATEGORY_COLORS.filter(
    (color) => !usedColors.includes(color)
  );

  /* ---------- INIT (SEED + FETCH) ---------- */
  useEffect(() => {
    if (initialized) return;

    async function initCategories() {
      // Check if user already has categories
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      // Seed defaults if none exist
      if (!existing || existing.length === 0) {
        await supabase.from("categories").insert(
          DEFAULT_CATEGORIES.map((cat) => ({
            user_id: userId,
            label: cat.label,
            color: cat.color,
          }))
        );
      }

      // Fetch categories
      const data = await fetchCategories(userId);
      setCategories(data);
      setInitialized(true);
    }

    initCategories();
  }, [userId, initialized]);

  async function handleDeleteCategory(categoryId: string) {
  try {
    // 1️⃣ Delete from Supabase
    await deleteCategory(categoryId);

    // 2️⃣ Update local state (instant UI update)
    setCategories((prev) =>
      prev.filter((c) => c.id !== categoryId)
    );
  } catch (error) {
    console.error("Failed to delete category", error);
    }
  }


  /* ------------------ RENDER ------------------ */

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
        {categories.map((category) => (
          <View
            key={category.id}
            style={[styles.pill, { backgroundColor: category.color }]}
          >
            <Text style={styles.pillText}>{category.label}</Text>
            <Pressable
            onPress={() => handleDeleteCategory(category.id)}
            >
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
        {availableColors.map((color) => (
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
        disabled={!label || !selectedColor}
        style={[
          styles.addButton,
          (!label || !selectedColor) && styles.addDisabled,
        ]}
        onPress={async () => {
          if (!label || !selectedColor) return;

          const newCategory = await addCategory(
            label,
            selectedColor,
            userId
          );

          setCategories((prev) => [...prev, newCategory]);
          setLabel("");
          setSelectedColor(null);
        }}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
      </Pressable>

      {/* Continue */}
      <Pressable
        disabled={categories.length === 0}
        onPress={() => router.push("/(onboarding)/ready")}
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
