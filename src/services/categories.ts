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
      user_id: userId,
      label,
      color,
    })
    .select()
    .single();

  if (error || !data) {
    console.error(error);
    throw new Error("Failed to add category");
  }

  return data;
}




export async function fetchCategories(userId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}