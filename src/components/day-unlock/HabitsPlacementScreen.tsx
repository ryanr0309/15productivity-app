import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";

/* ---------------- CONSTANTS ---------------- */

const SCREEN_WIDTH = Dimensions.get("window").width;
const BLOCK_GAP = 10;
const CONTAINER_PADDING = 20;

const BLOCK_WIDTH =
  (SCREEN_WIDTH -
    CONTAINER_PADDING * 2 -
    BLOCK_GAP * 2) /
  3;

/* ---------------- TYPES ---------------- */

type Habit = {
  id: string;
  name: string;
  color: string;
};

type TimeBlock = {
  id: string;
  start_time: string;
  end_time: string;
  habit_id: string | null;
};

/* ---------------- HELPERS ---------------- */

function formatStartTime(start: string) {
  const d = new Date(start);

  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}


/* ---------------- SCREEN ---------------- */

export default function HabitPlacementScreen({
  dayId,
  onContinue,
}: {
  dayId: string;
  onContinue: (blocks: TimeBlock[]) => void;
}) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [selectedHabitId, setSelectedHabitId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      
      const [{ data: habitsData }, { data: blocksData }] =
        await Promise.all([
          supabase
            .from("habits")
            .select("id, name, color")
            .eq("user_id", user.id),

          supabase
            .from("time_blocks")
            .select("id, start_time, end_time, habit_id")
            .eq("day_id", dayId)
            .order("start_time"),
        ]);

      setHabits(habitsData ?? []);
      setBlocks(blocksData ?? []);
      setLoading(false);
    }

    load();
  }, [dayId]);

  /* ---------------- DERIVED ---------------- */

  const assignedCount = useMemo(
    () => blocks.filter(b => b.habit_id !== null).length,
    [blocks]
  );

  /* ---------------- HANDLERS ---------------- */

  function handleSelectHabit(habitId: string) {
    setSelectedHabitId(prev =>
      prev === habitId ? null : habitId
    );
  }

  function assignHabit(blockId: string) {
    if (!selectedHabitId) return;

    if (assignedCount >= 12) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
      return;
    }

    setBlocks(prev =>
      prev.map(b =>
        b.id === blockId
          ? { ...b, habit_id: selectedHabitId }
          : b
      )
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function clearHabit(blockId: string) {
    setBlocks(prev =>
      prev.map(b =>
        b.id === blockId ? { ...b, habit_id: null } : b
      )
    );
  }

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#A1A1AA" }}>
          Loading your day…
        </Text>
      </View>
    );
  }

  /* ---------------- RENDER ---------------- */

  return (
    
    <View
      style={styles.container}
    >
      {/* HEADER */}
      <View>
        <Text style={styles.title}>Plan your habits</Text>
        <Text style={styles.subtitle}>
          Tap a habit, then tap up to 12 time blocks
        </Text>
      </View>

      {/* BLOCK GRID (SCROLLS) */}
      <ScrollView
        style={styles.blockScroll}
        contentContainerStyle={styles.blocks}
        showsVerticalScrollIndicator={false}
      >
        {blocks.map(block => {
          const habit =
            habits.find(h => h.id === block.habit_id) ||
            null;

          return (
            <Pressable
              key={block.id}
              onPress={() =>
                habit
                  ? clearHabit(block.id)
                  : assignHabit(block.id)
              }
              style={[
                styles.block,
                habit && {
  backgroundColor: habit.color,
},

                !habit &&
                  selectedHabitId && {
                    borderWidth: 1,
                    borderColor: "#3F3F46",
                  },
              ]}
            >
              {habit ? (
  <View style={styles.blockContent}>
    <Text style={styles.blockHabit}>
      {habit.name}
    </Text>
    <Text style={styles.blockTime}>
      {formatStartTime(block.start_time)}
    </Text>
  </View>
) : (
  <Text style={styles.blockLabel}>
    {formatStartTime(block.start_time)}
  </Text>
)}

            </Pressable>
          );
        })}
      </ScrollView>

      {/* HABIT BANK (ALWAYS VISIBLE) */}
      <View style={styles.bank}>
        <Text style={styles.bankTitle}>Habits</Text>

        <View style={styles.habitRow}>
          {habits.map(habit => {
            const selected =
              habit.id === selectedHabitId;

            return (
              <Pressable
                key={habit.id}
                onPress={() =>
                  handleSelectHabit(habit.id)
                }
                style={[
                  styles.habitPill,
                  {
                    backgroundColor: habit.color,
                    opacity: selected ? 1 : 0.6,
                    transform: [
                      { scale: selected ? 1.05 : 1 },
                    ],
                  },
                ]}
              >
                <Text style={styles.habitText}>
                  {habit.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* CONTINUE */}
      <Pressable
        style={styles.continue}
        onPress={() => onContinue(blocks)}
      >
        <Text style={styles.continueText}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: CONTAINER_PADDING,
  },

  title: {
    color: "#F2F3F5",
    fontSize: 24,
    fontWeight: "600",
  },

  subtitle: {
    color: "#A1A1AA",
    marginTop: 6,
    marginBottom: 12,
  },

  blockScroll: {
    flex: 1,
    marginBottom: 12,
  },

  blocks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: BLOCK_GAP,
  },

  block: {
    width: BLOCK_WIDTH,
    height: 54,
    borderRadius: 10,
    backgroundColor: "#141B2E",
    justifyContent: "center",
    alignItems: "center",
  },


  bank: {
    borderTopWidth: 1,
    borderColor: "#27272A",
    paddingTop: 12,
    paddingBottom: 8,
  },

  bankTitle: {
    color: "#A1A1AA",
    marginBottom: 8,
  },

  habitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  habitPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  habitText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  continue: {
    marginTop: 10,
    backgroundColor: "#F2F3F5",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  continueText: {
    fontWeight: "600",
  },
  blockContent: {
  alignItems: "center",
  gap: 2,
},

blockHabit: {
  color: "#FFFFFF", // dark text on colored bg
  fontSize: 12,
  fontWeight: "600",
  textAlign: "center",
},

blockTime: {
  color: "#FFFFFF",
  fontSize: 10,
  opacity: 0.7,
},

blockLabel: {
  color: "#FFFFFF",
  fontSize: 12,
},

});
