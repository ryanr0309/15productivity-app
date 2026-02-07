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
import CategoryPill from "../../components/CategoryPill";
import AddCategoryModal from "../categories/AddCategoryModal";
import { Category } from "../../constants/categories";
import { useData } from "../../providers/DataProvider";
import ConfirmDeleteHabitModal from "../home/ConfirmDeleteHabitModal";
import ConfirmDeleteCategoryModal from "../home/ConfirmDeleteCategoryModal";



type Props = {
  blockId: string;
  timeRange: string;
  dateLabel: string;

  initialCategoryId: string | null;
  initialDescription: string;

  editCount: number;

  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;

  // ✅ FIXED SIGNATURE
  onSave: (
  categoryId: string | null,
  description: string,
  status?: "logged" | "unknown"
) => Promise<void>;


  onClose: () => void;
};



export default function TimeBlockModal({
  blockId,
  timeRange,
  dateLabel,
  initialCategoryId,
  initialDescription,
  editCount,
  onAddCategory,
  onDeleteCategory,
  onSave,
  onClose, // ✅ ADD THIS
}: Props) {

  const isLocked = editCount >= 2;
  const canEdit = editCount < 2
  ;
  const MIN_DESCRIPTION_LENGTH = 0;
  const MAX_DESCRIPTION_LENGTH = 160;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] =
  useState<{ id: string; label: string; isHabit: boolean } | null>(null);

  


  const safeInitialDescription = (initialDescription ?? "");
  const { habits, categories} = useData();

  
  const [description, setDescription] =
  useState(safeInitialDescription);
  

  const isEditing =
  Boolean(initialCategoryId) || safeInitialDescription.trim().length > 0;

const trimmedDescription = (description ?? "").trim();

const hasChanges =
  selectedCategoryId !== initialCategoryId ||
  trimmedDescription !== safeInitialDescription.trim();


const canSave =
  canEdit &&
  hasChanges &&
  selectedCategoryId !== null &&
  trimmedDescription.length >= MIN_DESCRIPTION_LENGTH &&
  trimmedDescription.length <= MAX_DESCRIPTION_LENGTH;

useEffect(() => {
  setSelectedCategoryId(initialCategoryId);
  setDescription(safeInitialDescription);
}, [initialCategoryId, safeInitialDescription, blockId]);


async function handleSave() {
  if (!selectedCategoryId) return;

  await onSave(
    selectedCategoryId,
    description,
    "logged"
  );
  onClose();
}


async function handleDontRemember() {
  await onSave(
    null,
    "__unknown__",
    "unknown"
  );
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
        {categories.map(category => {
  const isHabit = habits.some(
    h => h.category_id === category.id
  );

  return (
    <CategoryPill
      key={category.id}
      category={category}
      selected={category.id === selectedCategoryId}
      isHabit={isHabit}
      onPress={() => canEdit && setSelectedCategoryId(category.id)}
      onDelete={
        !isLocked
          ? () => {
              setConfirmDeleteCategory({
                id: category.id,
                label: category.label,
                isHabit,
              });
            }
          : undefined
      }
    />
  );
})}


        <Pressable
  disabled={!canEdit}
  onPress={() => setIsAddCategoryOpen(true)}
  style={[
    styles.pill,
    styles.addPill,
    !canEdit && styles.disabled,
  ]}
>
  <Text style={styles.addPillText}>＋</Text>
</Pressable>
      </View>

      {/* DESCRIPTION SECTION */}
      <Text style={styles.sectionTitle}>Task Description (optional)</Text>

      <TextInput
  value={description}
  onChangeText={setDescription}
  placeholder="What did you work on?"
  placeholderTextColor={colors.textSecondary}
  style={[
    styles.input,
    !canEdit && styles.inputDisabled,
  ]}
  maxLength={MAX_DESCRIPTION_LENGTH}
  multiline={true}   
  numberOfLines={4}
  returnKeyType="done"            // shows “Done”
  blurOnSubmit                    // closes keyboard
  onSubmitEditing={() => {
    Keyboard.dismiss();
  }}
/>


{isLocked ? (
  <Text style={styles.helper}>
    This time block has reached its edit limit and is now locked.

  </Text>
) : (
  <Text style={styles.helper}>
    {trimmedDescription.length === 0
      ? "Optional but recommended, helps give personalized feedback"
      : trimmedDescription.length < MIN_DESCRIPTION_LENGTH
      ? `Add ${MIN_DESCRIPTION_LENGTH - trimmedDescription.length} more characters`
      : trimmedDescription.length > MAX_DESCRIPTION_LENGTH
      ? "Description is too long"
      : "You are allowed one edit per time block"}
  </Text>
)}

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
    {!canEdit ? "Locked" : isEditing ? "Update" : "Log"}
  </Text>
</Pressable>
<Pressable
  onPress={handleDontRemember}
  disabled={!canEdit}
  style={styles.dontRememberBtn}
>
  <Text style={styles.dontRememberText}>
    I don’t remember
  </Text>
</Pressable>



      

      {/* ADD CATEGORY MODAL */}
      <AddCategoryModal
  visible={isAddCategoryOpen}
  onClose={() => setIsAddCategoryOpen(false)}
  categories={categories}
  habits={habits}
  onCreate={(category) => {
    onAddCategory(category);
    setIsAddCategoryOpen(false);
  }}
/>

<ConfirmDeleteCategoryModal
  visible={!!confirmDeleteCategory}
  categoryName={confirmDeleteCategory?.label}
  isHabit={confirmDeleteCategory?.isHabit ?? false}
  onCancel={() => setConfirmDeleteCategory(null)}
  onConfirm={() => {
    if (!confirmDeleteCategory) return;

    handleDeleteCategoryLocal(confirmDeleteCategory.id);
    setConfirmDeleteCategory(null);
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
    marginBottom: 12,
  },

  saveButtonDisabled: {
    backgroundColor: "#A0E5BF",
  },

  saveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  inputDisabled: {
  opacity: 0.6,
},

disabled: {
  opacity: 0.4,
},

lockedHint: {
  color: colors.textSecondary,
  fontSize: 12,
  fontStyle: "italic",
  marginBottom: 12,
  textAlign: "center",
},
dontRememberBtn: {
  marginTop: 10,
  alignItems: "center",
  marginBottom: 60,
},

dontRememberText: {
  color: "rgba(255,255,255,0.55)",
  fontSize: 12,
  fontWeight: "600",
},


});
