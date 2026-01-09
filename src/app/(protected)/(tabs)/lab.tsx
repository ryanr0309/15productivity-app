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
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../../constants/colors";
import { supabase } from "../../../lib/supabase";
import EditGoalsModal from "../../../components/home/EditGoalsModal";
import AddEditHabitModal from "../../../components/home/AddEditHabitModal";
import ConfirmDeleteHabitModal from "../../../components/home/ConfirmDeleteHabitModal";

import { useData } from "../../../providers/DataProvider";
import { useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import LabSkeleton from "../../../components/coach/LabInsights";

/* ===================== COMPONENT ===================== */

export default function Lab() {
  const [isEditGoalsOpen, setIsEditGoalsOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<any | null>(null);


  const {
  habits,
  categories,
  labCache,
  addHabit,
  addCategory,
  deleteHabit,
  updateLabGoals
} = useData();

const goals = labCache?.goals ?? [];


  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      // wait 1 frame so the ScrollView is mounted + measured
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });

      // no cleanup needed
    }, [])
  );



  /* ===================== LOAD GOALS ===================== */

  /* ===================== RENDER ===================== */

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ref={scrollRef}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="flask-outline" size={20} color="#FFFFFF" />
          <Text style={styles.headerText}>Lab</Text>
        </View>

        {/* ===================== GOALS ===================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity onPress={() => setIsEditGoalsOpen(true)}>
              <Ionicons
                name="pencil"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.goalsContainer}>
            {goals.length === 0 ? (
              <Text style={styles.goalEmptyText}>No goals yet</Text>
            ) : (
              goals.map((goal, index) => (
                <View key={index} style={styles.goalRow}>
                  <View style={styles.goalDot} />
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ===================== HABITS ===================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Habits</Text>
            <TouchableOpacity onPress={() => setIsHabitModalOpen(true)}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <Text style={styles.emptyText}>No habits yet</Text>
          ) : (
            habits.map(habit => (
              <View key={habit.id}>
                <View
                  style={[
                    styles.habitCard,
                    {
                      backgroundColor: `${habit.color}22`,
                      borderColor: `${habit.color}55`,
                    },
                  ]}
                >
                  {/* DELETE */}
                  <TouchableOpacity
                    style={styles.deleteX}
                    onPress={() => setHabitToDelete(habit)}
                    hitSlop={10}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* PRIMARY */}
                  <Text style={styles.habitName}>{habit.name}</Text>

 

                   
                    <Text style={styles.habitSecondaryMuted}>
                      You haven’t started working on this yet
                    </Text>
                  

                  {/* SINCE */}
                  <Text style={styles.habitSince}>
                    Since{" "}
                    {new Date(habit.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ===================== MODALS ===================== */}

        <EditGoalsModal
          visible={isEditGoalsOpen}
          goals={goals}
          onClose={() => setIsEditGoalsOpen(false)}
          onSaved={async updatedGoals => {
    await updateLabGoals(updatedGoals);
    setIsEditGoalsOpen(false);
  }}
        />

        <AddEditHabitModal
          visible={isHabitModalOpen}
          onClose={() => setIsHabitModalOpen(false)}
          habits={habits}
          categories={categories}
          onSave={async (name, color) => {
            await addHabit({ name, color });
            await addCategory({ label: name, color });
            setIsHabitModalOpen(false);
          }}
        />

        <ConfirmDeleteHabitModal
          visible={!!habitToDelete}
          habitName={habitToDelete?.name ?? ""}
          onCancel={() => setHabitToDelete(null)}
          onConfirm={async () => {
  if (!habitToDelete) return;

  await deleteHabit(habitToDelete.id);

  setHabitToDelete(null);
}}

        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },

  loadingText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
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

  goalsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
  },

  goalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
    marginRight: 12,
  },

  goalText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  goalEmptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },

  habitCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    position: "relative",
  },

  habitName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  habitSecondary: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },

  habitSecondaryMuted: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
    marginBottom: 2,
  },

  habitSince: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
  },

  deleteX: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    padding: 4,
  },
});
