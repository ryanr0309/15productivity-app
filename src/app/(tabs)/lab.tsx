import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { supabase } from "../../lib/supabase";
import EditGoalsModal from "../../components/home/EditGoalsModal";
import AddEditHabitModal from "../../components/home/AddEditHabitModal";
import ConfirmDeleteHabitModal from "../../components/home/ConfirmDeleteHabitModal";

/** ---------------- MOCK DATA ---------------- */




const mockGoals = [
  "Maintain a 4.0 GPA",
  "Build muscle",
  "Ship App 15",
];

const mockHabits = [
  {
    id: "1",
    name: "Gym",
    createdAt: "Jan 12",
    hours: 42,
    days: 18,
  },
  {
    id: "2",
    name: "Deep Work",
    createdAt: "Jan 18",
    hours: 31,
    days: 14,
  },
  {
    id: "3",
    name: "Reading",
    createdAt: "Feb 2",
    hours: 12,
    days: 9,
  },
];

/** ---------------- COMPONENT ---------------- */

export default function Lab() {

  const [goals, setGoals] = useState<string[]>([]);
const [habits, setHabits] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [isEditGoalsOpen, setIsEditGoalsOpen] = useState(false);
const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
const [editingHabit, setEditingHabit] = useState<any | null>(null);
const [habitToDelete, setHabitToDelete] = useState<any | null>(null);



  async function loadGoals(userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("goals")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Failed to load goals", error);
    return [];
  }

  return data?.goals ?? [];
}

async function loadHabits(userId: string) {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load habits", error);
    return [];
  }

  return data ?? [];
}

useEffect(() => {
  async function loadLabData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [loadedGoals, loadedHabits] = await Promise.all([
      loadGoals(user.id),
      loadHabits(user.id),
    ]);

    setGoals(loadedGoals);
    setHabits(loadedHabits);
    setLoading(false);
  }

  loadLabData();
}, []);


if (loading) {
  return (
    <LinearGradient colors={["#0B132B", "#1C2541"]} style={styles.container}>
      <Text style={styles.loadingText}>Loading lab…</Text>
    </LinearGradient>
  );
}

  return (
    <LinearGradient colors={["#0B132B", "#1C2541"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="flask-outline" size={20} color="#FFFFFF" />
          <Text style={styles.headerText}>Lab</Text>
        </View>

        {/* GOALS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity onPress={() => setIsEditGoalsOpen(true)}>
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.goalOrbit}>
            {/* Center Core */}
            <View style={styles.goalCore}>
              <Ionicons name="compass-outline" size={28} color="#FFFFFF" />
            </View>

            {/* Goal Pills */}
            {goals.length === 0 ? (
  <Text style={styles.emptyText}>
    No goals yet
  </Text>
) : (
  goals.map(goal => (
    <View key={goal} style={styles.goalPill}>
      <Text style={styles.goalText}>{goal}</Text>
    </View>
  ))
)}
          </View>
        </View>

        {/* HABITS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Habits</Text>
            <TouchableOpacity  onPress={() => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  }}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
  <Text style={styles.emptyText}>
    No habits yet
  </Text>
) : (
  habits.map(habit => (
    <TouchableOpacity
  key={habit.id}
  activeOpacity={0.8}
  onPress={() => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  }}
>
    <View key={habit.id} style={styles.habitCard}>
      <TouchableOpacity
  style={styles.deleteX}
  onPress={() => setHabitToDelete(habit)}
  hitSlop={10}
>
  <Ionicons
    name="close"
    size={14}
    color={colors.textSecondary}
  />
</TouchableOpacity>


      <Text style={styles.habitName}>{habit.name}</Text>
      <Text style={styles.habitMeta}>
        Added {new Date(habit.created_at).toLocaleDateString()}
      </Text>

      {/* stats will be computed later */}
      <Text style={styles.habitMeta}>
        Stats coming soon
      </Text>
    </View>
    </TouchableOpacity>
  ))
)}

        </View>

        <EditGoalsModal
  visible={isEditGoalsOpen}
  goals={goals}
  onClose={() => setIsEditGoalsOpen(false)}
  onSaved={updatedGoals => {
    setGoals(updatedGoals);
    setIsEditGoalsOpen(false);
  }}
/>

<AddEditHabitModal
  visible={isHabitModalOpen}
  initialName={editingHabit?.name}
  initialColor={editingHabit?.color}
  onClose={() => {
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  }}
  onSave={async (name, color) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // ✏️ UPDATE
    if (editingHabit) {
      await supabase
        .from("habits")
        .update({ name, color })
        .eq("id", editingHabit.id);

      await supabase
        .from("categories")
        .update({ label: name, color })
        .eq("id", editingHabit.id);

      setHabits(prev =>
        prev.map(h =>
          h.id === editingHabit.id
            ? { ...h, name, color }
            : h
        )
      );
    }

    // ➕ CREATE
    else {
      const { data: habit } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          name,
          color,
        })
        .select()
        .single();

      if (!habit) return;

      // 🔑 CREATE MATCHING CATEGORY
      await supabase.from("categories").insert({
        id: habit.id,
        user_id: user.id,
        label: name,
        color,
      });

      setHabits(prev => [...prev, habit]);
    }

    setIsHabitModalOpen(false);
    setEditingHabit(null);
  }}
/>



<ConfirmDeleteHabitModal
  visible={!!habitToDelete}
  habitName={habitToDelete?.name ?? ""}
  onCancel={() => setHabitToDelete(null)}
  onConfirm={async () => {
    if (!habitToDelete) return;

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitToDelete.id);

    if (!error) {
      setHabits(prev =>
        prev.filter(h => h.id !== habitToDelete.id)
      );
    }

    setHabitToDelete(null);
  }}
/>

      </ScrollView>
    </LinearGradient>
  );

  
}



/** ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171619"
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  /** Sections */
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  /** Goals */
  goalOrbit: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
  },
  goalCore: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  goalPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  goalPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  goalText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },

  /** Habits */
  habitCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  habitName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  habitMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  habitStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  habitStat: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  statDivider: {
    marginHorizontal: 6,
    color: colors.textSecondary,
    fontSize: 12,
  },
  loadingText: {
  color: colors.textSecondary,
  textAlign: "center",
  marginTop: 40,
  fontSize: 14,
},
emptyText: {
  color: colors.textSecondary,
  fontSize: 13,
  textAlign: "center",
  marginTop: 12,
},
habitWrapper: {
  position: "relative",
},

deleteX: {
  position: "absolute",
  top: 8,
  right: 8,
  zIndex: 10,
  backgroundColor: "rgba(0,0,0,0.3)",
  borderRadius: 10,
  padding: 4,
},


});
