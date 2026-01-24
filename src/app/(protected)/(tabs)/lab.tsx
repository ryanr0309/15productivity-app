import React, { useCallback, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { colors } from "../../../constants/colors";
import EditGoalsModal from "../../../components/home/EditGoalsModal";
import AddEditHabitModal from "../../../components/home/AddEditHabitModal";
import ConfirmDeleteHabitModal from "../../../components/home/ConfirmDeleteHabitModal";

import { useData } from "../../../providers/DataProvider";
import LottieView from "lottie-react-native";

/* ===================== HELPERS ===================== */

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/* ===================== COMPONENT ===================== */

export default function Lab() {
  const [isEditGoalsOpen, setIsEditGoalsOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<any | null>(null);

  const {
    habits,
    categories,
    labCache,
    insightsCache, // ✅ ADD
    addHabit,
    deleteHabit,
    updateLabGoals,
  } = useData();

  const goals = labCache?.goals ?? [];
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, [])
  );

  /* ===================== HABIT STATS ===================== */

  const habitStats = useMemo(() => {
    if (!insightsCache) return {};


    const stats: Record<
      string,
      { totalMinutes: number; daysWorked: number }
    > = {};

    habits.forEach(habit => {
  
      let totalMinutes = 0;
      const days = new Set<string>();

      Object.entries(insightsCache.blocksByDayId).forEach(
        ([dayId, blocks]) => {
          blocks.forEach(block => {
      
            if (block.categoryId === habit.category_id) {
              totalMinutes += 15;
              days.add(dayId);
            }
          });
        }
      );

      stats[habit.id] = {
        totalMinutes,
        daysWorked: days.size,
      };
    });

    return stats;
  }, [habits, insightsCache]);

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
  <View style={styles.emptyState}>
    <LottieView
      source={require("../../../assets/animations/empty_ghost.json")}
      autoPlay
      loop
      style={styles.lottie}
    />

    <Text style={styles.emptyTitle}>No habits yet</Text>
    <Text style={styles.emptySubtitle}>
      Add habits you want to build consistency around.
    </Text>
  </View>
)  : (
            habits.map(habit => {
              const stats = habitStats[habit.id];
              const hasWorked =
                stats &&
                (stats.totalMinutes > 0 || stats.daysWorked > 0);

              return (
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
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* PRIMARY */}
                    <Text style={styles.habitName}>{habit.name}</Text>

                    {/* STATS / EMPTY */}
                    {!hasWorked ? (
                      <Text style={styles.habitSecondaryMuted}>
                        You haven’t started working on this yet
                      </Text>
                    ) : (
                      <View style={styles.habitStatsRow}>
                        
                        <Text style={styles.habitStat}>
                          Progress: {formatMinutes(stats.totalMinutes)} ⏱️
                        </Text>
                        <Text style={styles.habitStatDivider}>•</Text>
                        <Text style={styles.habitStat}>
                          {stats.daysWorked}{" "}
                          {stats.daysWorked === 1 ? "day" : "days"} ☀️
                        </Text>
                      </View>
                    )}

                    {/* SINCE */}
                    <Text style={styles.habitSince}>
                      Since{" "}
                      {new Date(habit.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              );
            })
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
  habitSecondaryMuted: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
    marginBottom: 2,
  },
  habitStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  habitStat: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  habitStatDivider: {
    marginHorizontal: 6,
    color: "rgba(255,255,255,0.5)",
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

  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 240,
  },
  emptyState: {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 32,
},

lottie: {
  width: 240,
  height: 240,
  marginBottom: 12,
},

emptyTitle: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "800",
  marginBottom: 4,
},

emptySubtitle: {
  color: "rgba(255,255,255,0.7)",
  fontSize: 12,
  fontWeight: "600",
  textAlign: "center",
  maxWidth: 240,
},

});
