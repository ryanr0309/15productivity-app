import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { colors } from "../../constants/colors";
import React from "react";
import { useState, useEffect } from "react";
import AddCategoryModal from "../categories/AddCategoryModal";
import CategoryPill from "../../components/CategoryPill";
import { Category} from "../../constants/categories";

type Props = {
  timeRange: string;
  dateLabel: string;

  initialCategoryId: string | null;
  initialDescription: string;

  categories: Category[];
  onAddCategory: (category: Category) => void;

  onSave: (data: {
    categoryId: string | null;
    description: string;
  }) => void;
};




export default function TimeBlockModal({
  timeRange,
  dateLabel,
  initialCategoryId,
  initialDescription,
  categories,
  onAddCategory,
  onSave,
}: Props) {

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  function handleSave() {
    onSave({
      categoryId: selectedCategoryId,
      description,
    });
  }

  useEffect(() => {
  setSelectedCategoryId(initialCategoryId);
  setDescription(initialDescription);
}, [initialCategoryId, initialDescription]);


  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />

      <Text style={styles.time}>{timeRange}</Text>
      <Text style={styles.date}>{dateLabel}</Text>

      <Text style={styles.sectionTitle}>Choose a Category</Text>

      <View style={styles.pillRow}>
  {categories.map(category => (
    <CategoryPill
  key={category.id}
  category={category}
  selected={category.id === selectedCategoryId}
  onPress={() => setSelectedCategoryId(category.id)}
  onDelete={() => {}}
/>
  ))}
  <Pressable
      onPress={() => setIsAddCategoryOpen(true)}
      style={[styles.pill, styles.addPill]}
      >
      <Text style={styles.addPillText}>＋</Text>
      </Pressable>
</View>


      
      <Text style={styles.sectionTitle} >Task Description</Text>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="What did you work on?"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />

      <Text style={styles.helper}>
        Meaningful descriptions = better feedback later
      </Text>

      <Pressable onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveText}>Save</Text>
      </Pressable>

      <AddCategoryModal
  visible={isAddCategoryOpen}
  onClose={() => setIsAddCategoryOpen(false)}
  categories={categories}
  onAddCategory={onAddCategory}
/>


    </View>

  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

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
    color: "#000000"
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
  },

  saveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
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
  backgroundColor: "rgba(255,255,255,0.1)",
},

pillSelected: {
  backgroundColor: colors.accent,
},

pillText: {
  color: "#000000",
  fontSize: 14,
  fontWeight: "500",
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


});
