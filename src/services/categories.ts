import { supabase } from "../lib/supabase";
import { Category } from "../constants/categories";

export async function fetchCategories(userId: string) {
  return supabase
    .from("categories")
    .select("id, label, color")
    .eq("user_id", userId)
    .order("created_at");
}

export async function insertCategory(
  userId: string,
  category: Category
) {
  return supabase.from("categories").insert({
    id: category.id,
    user_id: userId,
    label: category.label,
    color: category.color,
  });
}

export async function deleteCategory(categoryId: string) {
  return supabase.from("categories").delete().eq("id", categoryId);
}

export async function updateCategory(category: Category) {
  return supabase
    .from("categories")
    .update({
      label: category.label,
      color: category.color,
    })
    .eq("id", category.id);
}
