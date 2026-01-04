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
  Keyboard
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

  const MIN_DESCRIPTION_LENGTH = 8;
  const MAX_DESCRIPTION_LENGTH = 160;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const safeInitialDescription = (initialDescription ?? "");

  const isEditing =
  Boolean(initialCategoryId) || safeInitialDescription.trim().length > 0;


  const trimmedDescription = (description ?? "").trim();


  const canSave =
  selectedCategoryId !== null &&
  trimmedDescription.length >= MIN_DESCRIPTION_LENGTH &&
  trimmedDescription.length <= MAX_DESCRIPTION_LENGTH;



useEffect(() => {
  setSelectedCategoryId(initialCategoryId);
  setDescription(safeInitialDescription);
}, [initialCategoryId, safeInitialDescription]);


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
  maxLength={MAX_DESCRIPTION_LENGTH}
  multiline={true}   
  numberOfLines={4}
  returnKeyType="done"            // shows “Done”
  blurOnSubmit                    // closes keyboard
  onSubmitEditing={() => {
    Keyboard.dismiss();
  }}
/>


      <Text style={styles.helper}>
  {trimmedDescription.length === 0
    ? "Be specific — this helps your daily insights."
    : trimmedDescription.length < MIN_DESCRIPTION_LENGTH
    ? `Add ${MIN_DESCRIPTION_LENGTH - trimmedDescription.length} more characters`
    : trimmedDescription.length > MAX_DESCRIPTION_LENGTH
    ? "Description is too long"
    : "Edits won’t affect your productivity score"}
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


  handle: {
      width: 40,
  height: 4,
  borderRadius: 2,
  backgroundColor: "rgba(255,255,255,0.25)",
  alignSelf: "center",
  marginBottom: 14,
  },

  time: {
      fontSize: 20,
  fontWeight: "700",
  color: "#FFFFFF",
  marginBottom: 4,
  },
  sheetContainer: {
  backgroundColor: "#1E2433",
  borderRadius: 20,
  paddingHorizontal: 18,
  paddingTop: 12,
  paddingBottom: 0,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.06)",
},


  date: {
      fontSize: 13,
  color: "rgba(255,255,255,0.6)",
  marginBottom: 18,
  },

  sectionTitle: {
      fontSize: 13,
  fontWeight: "600",
  color: "rgba(255,255,255,0.75)",
  marginBottom: 8,
  marginTop: 6,
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
  borderColor: "rgba(255,255,255,0.2)",
  backgroundColor: "rgba(255,255,255,0.05)",
  },

  addPillText: {
      fontSize: 20,
  fontWeight: "600",
  color: "rgba(255,255,255,0.7)",
  },

  input: {
      backgroundColor: "#252B3A",
  borderRadius: 14,
  padding: 14,
  minHeight: 90,
  color: "#FFFFFF",
  textAlignVertical: "top",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.08)",
  

  },

  helper: {
      fontSize: 12,
  color: "rgba(255,255,255,0.5)",
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
