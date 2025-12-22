import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import Modal from "react-native-modal";
import { colors } from "../../constants/colors";
import TimeBlockCard from "../../components/time-block/TimeBlockCard";
import ProgressBar from "../../components/ui/ProgressBar";
import { generateTimeBlocks } from "../../utils/timeBlocks";
import { useEffect, useState } from "react";
import React from "react";
import TimeBlockModal from "../../components/time-block/TimeBlockModal";
import TimePickerModal from "../../components/config/TimePickerModal";
import IntervalPicker from "../../components/config/IntervalPickerModal";
import {formatTime, getBlockDate, isFutureBlock, roundUpToInterval} from "../../utils/time";
import { dateToHHMM } from "../../utils/dateToHHMM";
import DailyGoalsModal from "../../components/config/DailyGoalsModal";
import { Category } from "../../constants/categories";
import { supabase } from "../../lib/supabase";
import LogoutButton from "../../components/auth/LogoutButton";
import { router } from "expo-router";
import { useAuthStore } from "../../store/useAuthStore";
import { fetchCategories, deleteCategory, addCategory } from "../../services/categories";
import { Block } from "../../utils/timeBlocks";
import { mergeTimeBlocks, loadPersistedTimeBlocks } from "../../utils/timeBlocks";
import { mergeAfterScheduleChange } from "../../utils/timeBlocks";




export default function Home() {

  /*HELPER FUNCTIONS */

  function todayISO() {
  return new Date().toISOString().slice(0, 10);
  }

  function parseDBTime(time: string) {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  function blockStartDate(startTime: string) {
  const [h, m] = startTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function inferIntervalFromBlocks(blocks: Block[]): number {
  if (blocks.length < 2) return intervalMinutes;

  const a = blockStartDate(blocks[0].startTime);
  const b = blockStartDate(blocks[1].startTime);

  return (b.getTime() - a.getTime()) / 60000;
}



  /*AUTHORITATIVE HYDRATION FUNCTION */

  const authUser = useAuthStore((s) => s.user);

async function hydrateAllForToday(userId: string) {
  console.log("🔥 hydrateAllForToday called", userId);

  // ---------- helpers ----------
  function safeTime(value: string | null) {
    return value && value.trim() !== "" ? value : null;
  }

  // ---------- ensure rows ----------
  const day = await getOrCreateToday(userId);
  if (!day) {
    console.error("❌ Failed to get/create day");
    return;
  }

  const settings = await getOrCreateUserSettings(userId);
  if (!settings) {
    console.error("❌ Failed to get/create user settings");
    return;
  }

  // ---------- resolve effective config ----------
  const effectiveWake =
    safeTime(day.wake_time) ??
    safeTime(settings.wake_time) ??
    "08:00";

  const effectiveSleep =
    safeTime(day.sleep_time) ??
    safeTime(settings.sleep_time) ??
    "22:00";

  const effectiveInterval =
    day.time_block_interval && day.time_block_interval > 0
      ? day.time_block_interval
      : settings.interval_minutes && settings.interval_minutes > 0
      ? settings.interval_minutes
      : 45;

  console.log("⏰ resolved schedule", {
    effectiveWake,
    effectiveSleep,
    effectiveInterval,
  });

  // ---------- convert ----------
  const wakeDate = parseDBTime(effectiveWake);
  const sleepDate = parseDBTime(effectiveSleep);

  if (wakeDate >= sleepDate) {
    console.warn("⚠️ Invalid wake/sleep range");
    setTimeBlocks([]);
    return;
  }

  // ---------- hydrate config state FIRST ----------
  setWakeTime(wakeDate);
  setSleepTime(sleepDate);
  setIntervalMinutes(effectiveInterval);
  setDailyGoals(day.goals ?? []);

  // ---------- load persisted blocks FIRST ----------
  const persistedBlocks = await loadPersistedTimeBlocks(userId);

  // ---------- generate schedule ----------
  const generatedBlocks = generateTimeBlocks(
    dateToHHMM(wakeDate),
    dateToHHMM(sleepDate),
    effectiveInterval
  );

  // ---------- merge (hydration-safe) ----------
  const mergedBlocks = mergeTimeBlocks(
    generatedBlocks,
    persistedBlocks
  );

  console.log("🧱 blocks after hydration", mergedBlocks.length);

  setTimeBlocks(mergedBlocks);
}



  useEffect(() => {
  if (!authUser) return;

  hydrateAllForToday(authUser.id);
  loadCategories();
}, [authUser]);

  /*CLEANED MUTATION HANDLERS */

 async function handleSaveTimeBlock(data: {
  categoryId: string | null;
  description: string;
}) {
  if (!activeBlockId || !authUser) return;

  const today = todayISO();

  const block = timeBlocks.find(b => b.id === activeBlockId);
  if (!block) return;

  // Optimistic UI update
  setTimeBlocks(prev =>
    prev.map(b =>
      b.id === activeBlockId
        ? {
            ...b,
            completed: true,
            categoryId: data.categoryId,
            description: data.description,
          }
        : b
    )
  );

  const { error } = await supabase
    .from("time_blocks")
    .upsert(
      {
        user_id: authUser.id,
        date: today,
        start_time: block.startTime,
        end_time: block.endTime,
        completed: true,
        category_id: data.categoryId,
        description: data.description,
      },
      { onConflict: "user_id,date,start_time" }
    );

  if (error) {
    console.error("Failed to save time block", error);
  }

  setIsModalOpen(false);
  setActiveBlockId(null);
}



async function saveDailyGoals(goals: string[]) {
  if (!authUser) return;

  const today = new Date().toISOString().slice(0, 10);

  // 🔑 Ensure row exists
  await getOrCreateToday(authUser.id);

  setDailyGoals(goals);

  const { error } = await supabase
    .from("days")
    .update({ goals })
    .eq("user_id", authUser.id)
    .eq("date", today);

  if (error) {
    console.error("Failed to save daily goals", error);
    return;
  }

  setActiveConfigModal(null);
}

async function saveWakeTime(time: Date) {
  if (!authUser) return;

  const newWake = dateToHHMM(time);

  // 1️⃣ Persist override
  await supabase
    .from("days")
    .update({ wake_time: newWake })
    .eq("user_id", authUser.id)
    .eq("date", todayISO());

  setWakeTime(time);

  // 2️⃣ Keep existing blocks >= new wake
  const keptBlocks = timeBlocks.filter(
    b => b.startTime >= newWake
  );

  // If no blocks exist yet, generate full day with DEFAULT interval
  if (keptBlocks.length === 0) {
    const regenerated = generateTimeBlocks(
      newWake,
      dateToHHMM(sleepTime),
      intervalMinutes
    );
    setTimeBlocks(regenerated);
    setActiveConfigModal(null);
    return;
  }

  // 3️⃣ Infer interval from existing structure
  const inferredInterval = inferIntervalFromBlocks(keptBlocks);

  // 4️⃣ Prepend missing blocks using INFERRED interval
  const firstExisting = keptBlocks[0].startTime;

  const prepend = generateTimeBlocks(
    newWake,
    firstExisting,
    inferredInterval
  ).filter(b => b.startTime < firstExisting);

  setTimeBlocks([...prepend, ...keptBlocks]);
  setActiveConfigModal(null);
}





async function saveSleepTime(time: Date) {
  if (!authUser) return;

  await supabase
    .from("days")
    .update({ sleep_time: dateToHHMM(time) })
    .eq("user_id", authUser.id)
    .eq("date", todayISO());

  setSleepTime(time);

  const now = new Date();

  // 1️⃣ Freeze past blocks
  const frozenPast = timeBlocks.filter(b =>
    blockStartDate(b.startTime) < now
  );

  // 2️⃣ Regenerate future blocks up to NEW sleep time
  const futureStart = roundUpToInterval(now, intervalMinutes);

  const regeneratedFuture = generateTimeBlocks(
    dateToHHMM(futureStart),
    dateToHHMM(time),
    intervalMinutes
  );

  // 3️⃣ Merge persisted work
  const persisted = await loadPersistedTimeBlocks(authUser.id);
  const persistedMap = new Map(
    persisted.map(p => [p.start_time, p])
  );

  const hydratedFuture = regeneratedFuture.map(b => {
    const p = persistedMap.get(b.startTime);
    return p
      ? {
          ...b,
          completed: p.completed,
          categoryId: p.category_id,
          description: p.description ?? "",
        }
      : b;
  });

  setTimeBlocks([...frozenPast, ...hydratedFuture]);
  setActiveConfigModal(null);
}


async function saveInterval(newInterval: number) {
  if (!authUser) return;

  await supabase
    .from("days")
    .update({ time_block_interval: newInterval })
    .eq("user_id", authUser.id)
    .eq("date", todayISO());

  setIntervalMinutes(newInterval);

  const now = new Date();

  // 1️⃣ Freeze ALL past blocks (structure preserved)
  const frozenPast = timeBlocks.filter(b =>
    blockStartDate(b.startTime) < now
  );

  // 2️⃣ Regenerate future blocks with NEW interval
  const futureStart = roundUpToInterval(now, newInterval);

  const regeneratedFuture = generateTimeBlocks(
    dateToHHMM(futureStart),
    dateToHHMM(sleepTime),
    newInterval
  );

  // 3️⃣ Merge persisted work
  const persisted = await loadPersistedTimeBlocks(authUser.id);
  const persistedMap = new Map(
    persisted.map(p => [p.start_time, p])
  );

  const hydratedFuture = regeneratedFuture.map(b => {
    const p = persistedMap.get(b.startTime);
    return p
      ? {
          ...b,
          completed: p.completed,
          categoryId: p.category_id,
          description: p.description ?? "",
        }
      : b;
  });

  setTimeBlocks([...frozenPast, ...hydratedFuture]);
  setActiveConfigModal(null);
}







/* =====================
   STATE
===================== */

// Time blocks
const [timeBlocks, setTimeBlocks] = useState<Block[]>([]);
const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// Categories
const [categories, setCategories] = useState<Category[]>([]);

// Daily config
const [dailyGoals, setDailyGoals] = useState<string[]>([]);
const [wakeTime, setWakeTime] = useState(new Date(2024, 0, 1, 8, 0));
const [sleepTime, setSleepTime] = useState(new Date(2024, 0, 1, 22, 0));
const [intervalMinutes, setIntervalMinutes] = useState(45);

// Config modal
type ConfigModal = "wake" | "sleep" | "interval" | "goals" | null;
const [activeConfigModal, setActiveConfigModal] = useState<ConfigModal>(null);


/* =====================
   DERIVED STATE
===================== */

const activeBlock = timeBlocks.find(b => b.id === activeBlockId);

const completedCount = timeBlocks.filter(b => b.completed).length;

const progress =
  timeBlocks.length > 0
    ? completedCount / timeBlocks.length
    : 0;

/* =====================
   CATEGORY HELPERS
===================== */

async function loadCategories() {
  if (!authUser) return;
  const data = await fetchCategories(authUser.id);
  setCategories(data);
}

function handleAddCategory(category: Category) {
  setCategories(prev => [...prev, category]);
}

async function handleDeleteCategory(categoryId: string) {
  await deleteCategory(categoryId);
  setCategories(prev => prev.filter(c => c.id !== categoryId));
}

/* =====================
   DB HELPERS
===================== */

async function getOrCreateUserSettings(userId: string) {
  const { data } = await supabase
    .from("user_settings")
    .select("wake_time, sleep_time, interval_minutes")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data;

  const { data: newSettings, error } = await supabase
    .from("user_settings")
    .insert({
      user_id: userId,
      interval_minutes: 45,
      wake_time: null,
      sleep_time: null,
    })
    .select("wake_time, sleep_time, interval_minutes")
    .single();

  if (error) {
    console.error("Failed to create user_settings", error);
    return null;
  }

  return newSettings;
}

async function getOrCreateToday(userId: string) {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (data) return data;

  const { data: newDay } = await supabase
    .from("days")
    .insert({ user_id: userId, date: today })
    .select()
    .single();

  return newDay;
}



  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      

      {/* HEADER */}
<View style={styles.header}>
  <Pressable onPress={() => router.push("/(auth)/login")}>
  <Text>GO TO LOGIN</Text>
</Pressable>
  <View style={styles.headerTop}>
    <Text style={styles.logo}>⏰</Text>
    <Text style={styles.title}>15 Productivity</Text>
  </View>

  <View style={styles.dateRow}>
    <View style={styles.line} />
    <Text style={styles.date}>Monday, January 15</Text>
    <View style={styles.line} />
  </View>
</View>

<View style={{ position: "absolute", top: 50, right: 20 }}>
        <LogoutButton />
      </View>

{/* CONFIG GRID (2x2) */}
<View style={styles.configGrid}>
  <Pressable
    style={styles.configCard}
    onPress={() => setActiveConfigModal("wake")}
  >
    <Text style={styles.configLabel}>Wake Up ☀️</Text>
    <Text style={styles.configValue}>
      {formatTime(wakeTime)}
    </Text>
  </Pressable>

  <Pressable
    style={styles.configCard}
    onPress={() => setActiveConfigModal("sleep")}
  >
    <Text style={styles.configLabel}>Sleep 🌙</Text>
    <Text style={styles.configValue}>
      {formatTime(sleepTime)}
    </Text>
  </Pressable>


  <Pressable style={styles.configCard} onPress={() => setActiveConfigModal("goals")}
>
    <Text style={styles.configLabel}>Goals 🎯</Text>
    <Text style={styles.configSub}>Tap to View/Add</Text>
  </Pressable>

  <Pressable
  style={styles.configCard}
  onPress={() => setActiveConfigModal("interval")}
>
    <Text style={styles.configLabel}>Interval ⏱</Text>
    <Text style={styles.configValue}>{intervalMinutes} minutes</Text>
  </Pressable>
</View>


      {/* TIME BLOCK GRID */}
      <View style={styles.timeGrid}>
  {timeBlocks.map(block => {
  const cat = categories.find(c => c.id === block.categoryId);

  return (
    <TimeBlockCard
      key={block.id}
      style={styles.timeCard}
      time={block.timeLabel}
      completed={block.completed}
      active={block.id === activeBlockId}
      disabled={isFutureBlock(block.timeLabel)}
      categoryLabel={cat?.label}
      categoryColor={cat?.color}
      onPress={() => {
        if (isFutureBlock(block.timeLabel)) return;
        setActiveBlockId(block.id);
        setIsModalOpen(true);
      }}
    />
  );
})}


</View>



      {/* PROGRESS */}
      <ProgressBar progress={progress} />

      {/* MODAL */}
     <Modal
  isVisible={isModalOpen}
  onSwipeComplete={() => setIsModalOpen(false)}
  swipeDirection="down"
  onBackdropPress={() => setIsModalOpen(false)}
  backdropOpacity={0.5}
  style={styles.modalContainer}
>
  <View style={styles.modalContent}>
    <TimeBlockModal
  timeRange={activeBlock?.timeLabel ?? ""}
  dateLabel="Tuesday, January 16"
  initialCategoryId={activeBlock?.categoryId ?? null}
  initialDescription={activeBlock?.description ?? ""}

  categories={categories}

  onAddCategory={handleAddCategory}
  onDeleteCategory={handleDeleteCategory}

  onSave={handleSaveTimeBlock}
/>



  </View>
</Modal>

<Modal
  isVisible={activeConfigModal === "wake"}
  onBackdropPress={() => setActiveConfigModal(null)}
  swipeDirection="down"
  style={styles.modalContainer}
>
  <TimePickerModal
  title="Wake Time ☀️"
  initialTime={wakeTime}
  onSave={saveWakeTime}
/>

</Modal>


<Modal
  isVisible={activeConfigModal === "sleep"}
  onBackdropPress={() => setActiveConfigModal(null)}
  swipeDirection="down"
  style={styles.modalContainer}
>
<TimePickerModal
  title="Sleep Time 🌙"
  initialTime={sleepTime}
  onSave={saveSleepTime}
/>

</Modal>

<Modal
  isVisible={activeConfigModal === "interval"}
  onBackdropPress={() => setActiveConfigModal(null)}
  swipeDirection="down"
  style={styles.modalContainer}
>
  <IntervalPicker
  initialInterval={intervalMinutes}
  onSave={saveInterval}
/>

</Modal>

<Modal
  isVisible={activeConfigModal === "goals"}
  onBackdropPress={() => setActiveConfigModal(null)}
  onSwipeComplete={() => setActiveConfigModal(null)}
  swipeDirection="down"
  style={styles.modalContainer}
>
  <DailyGoalsModal
    initialGoals={dailyGoals}
    onSave={saveDailyGoals}
  />
</Modal>

    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // #1B3061
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },

  /* HEADER */
  header: {
  marginBottom: 24,
},

headerTop: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
},

logo: {
  fontSize: 22,
},

title: {
  color: colors.textPrimary,
  fontSize: 20,
  fontWeight: "700",
},

dateRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},

line: {
  flex: 1,
  height: 1,
  backgroundColor: "rgba(255,255,255,0.3)",
},

date: {
  color: colors.textSecondary,
  fontSize: 14,
},


  /* CONFIG GRID */

  configGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 28,
},
  configCard: {
  width: "48%",
  backgroundColor: colors.card,
  borderRadius: 16,
  padding: 14,
  marginBottom: 12,
},

configLabel: {
  color: colors.textSecondary,
  fontSize: 12,
  marginBottom: 6,
},

configValue: {
  color: colors.textPrimary,
  fontSize: 16,
  fontWeight: "700",
},

configSub: {
  color: colors.textPrimary,
  fontSize: 14,
  fontWeight: "600",
},


  /* TIME BLOCK GRID */
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeCard: {
    width: "30%", // ← THIS creates the grid look
    marginBottom: 12,
  },

  modalContainer: {
  justifyContent: "flex-end",
  margin: 0, // IMPORTANT — removes white margins
},

modalContent: {
  backgroundColor: "#F7F7F7", // same as app
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 10,
  minHeight: 350,
},
});
