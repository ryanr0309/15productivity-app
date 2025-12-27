import {useEffect, useState} from "react"
import { Category } from "../constants/categories";
import { supabase } from "../lib/supabase";
import { deleteCategory, fetchCategories } from "./categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  async function loadCategories() {
      const { data: auth } = await supabase.auth.getUser();
  
      if (!auth?.user) {
        setCategories([]);
        return;
      }
  
      try {
        const data = await fetchCategories(auth.user.id);
        console.log("FETCHED CATEGORIES", data);
  
        setCategories(data ?? []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
        setCategories([]);
      }
    }
  
  async function handleAddCategory(category: Category) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) return;
  
    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        label: category.label, // 🔁 label → name
        color: category.color,
      })
      .select("id, label, color")
      .single();
  
    if (error || !data) return;
  
    setCategories((prev) => [
      ...prev,
      {
        id: data.id,
        label: data.label,
        color: data.color,
      },
    ]);
  }
  
  async function handleDeleteCategory(categoryId: string) {
    // 1️⃣ Optimistic UI update
    setCategories(prev =>
      prev.filter(category => category.id !== categoryId)
    );
  
    // 2️⃣ Persist deletion
    try {
      await deleteCategory(categoryId);
    } catch (err) {
      console.error(err);
      // Optional: refetch categories or show toast
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    handleAddCategory,
    handleDeleteCategory,
    reloadCategories: loadCategories,
  };
}
