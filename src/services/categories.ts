// services/categories.ts
import { supabase } from "../lib/supabase";
import { Category } from "../constants/categories";

export async function addCategory(
  label: string,
  color: string,
  userId: string
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      label,
      color,
      user_id: userId,
    })
    .select("id, label, color")
    .single();

  if (error || !data) {
    throw error;
  }

  // 🔑 NORMALIZE HERE
  return {
    id: data.id,
    name: data.label, // 👈 FIX
    color: data.color,
  };
}




export async function fetchCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, label, color")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(c => ({
    id: c.id,
    name: c.label, // ✅ mapped
    color: c.color,
  }));
}


export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("Failed to delete category:", error);
    throw new Error("Failed to delete category");
  }
}