import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { colors } from "../../constants/colors";
import { Category } from "../../constants/categories";
import CategoryPill from "../../components/CategoryPill";
import AddCategoryModal from "../categories/AddCategoryModal";


type Props = {
  blockId: string;                 // ✅ stable identity
  timeRange: string;
  dateLabel: string;

  initialCategoryId: string | null;
  initialDescription: string;

  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;

  onSave: (data: {
    blockId: string;
    categoryId: string;
    description: string;
  }) => void;

  onClose: () => void;
};


export default function TimeBlockModal({
  blockId,
  timeRange,
  dateLabel,
  initialCategoryId,
  initialDescription,
  categories,
  onAddCategory,
  onDeleteCategory,
  onSave,
  onClose, // ✅ ADD THIS
}: Props) {

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const isEditing =
    Boolean(initialCategoryId) || initialDescription.trim().length > 0;

  const canSave =
  selectedCategoryId !== null &&
  description.trim().length > 0;


  useEffect(() => {
    setSelectedCategoryId(initialCategoryId);
    setDescription(initialDescription);
  }, [initialCategoryId, initialDescription]);

function handleSave() {
  if (!selectedCategoryId) return;

  onSave({
    blockId,
    categoryId: selectedCategoryId,
    description,
  });

  onClose();
}

function handleDeleteCategoryLocal(categoryId: string) {
  // 🔑 Clear local selection first
  if (selectedCategoryId === categoryId) {
    setSelectedCategoryId(null);
  }

  // 🔑 Then call parent deletion
  onDeleteCategory(categoryId);
}



  return (
    <KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
>
  <ScrollView
  contentContainerStyle={styles.sheetContainer}
  keyboardShouldPersistTaps="handled"
>

      <View style={styles.handle} />

      <Text style={styles.time}>{timeRange}</Text>
      <Text style={styles.date}>{dateLabel}</Text>

      {/* CATEGORY SECTION */}
      <Text style={styles.sectionTitle}>Choose a Category</Text>

      <View style={styles.pillRow}>
        {categories.map((category) => (
          <CategoryPill
            key={category.id}
            category={category}
            selected={category.id === selectedCategoryId}
            onPress={() => setSelectedCategoryId(category.id)}
            onDelete={() => handleDeleteCategoryLocal(category.id)}
          />
        ))}

        <Pressable
          onPress={() => setIsAddCategoryOpen(true)}
          style={[styles.pill, styles.addPill]}
        >
          <Text style={styles.addPillText}>＋</Text>
        </Pressable>
      </View>

      {/* DESCRIPTION SECTION */}
      <Text style={styles.sectionTitle}>Task Description</Text>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="What did you work on?"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        multiline
      />

      <Text style={styles.helper}>
        Meaningful descriptions = better insights later
      </Text>

      {/* SAVE BUTTON */}
      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[
          styles.saveButton,
          !canSave && styles.saveButtonDisabled,
        ]}
      >
        <Text style={styles.saveText}>
          {isEditing ? "Update" : "Log"}
        </Text>
      </Pressable>

      {/* ADD CATEGORY MODAL */}
      <AddCategoryModal
        visible={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        categories={categories}
        onCreate={(category) => {
          onAddCategory(category);
          setIsAddCategoryOpen(false);
        }}
      />
    </ScrollView>
  </KeyboardAvoidingView> 
  );
}
const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#F7F7F7",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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

  time: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    color: "#000",
  },
  sheetContainer: {
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 12, // 🔽 REDUCED from large value
  maxHeight: "85%",
},



  date: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },

  addPill: {
    borderWidth: 1,
    borderColor: "#CCC",
    backgroundColor: "transparent",
  },

  addPillText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#555",
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },

  helper: {
    fontSize: 12,
    color: "#777",
    marginTop: 6,
  },

  saveButton: {
    backgroundColor: "#18C964",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 60,
  },

  saveButtonDisabled: {
    backgroundColor: "#A0E5BF",
  },

  saveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
