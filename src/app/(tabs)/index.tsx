import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import Modal from "react-native-modal";

import { formatTime } from "../../utils/time";
import {
  getCurrentBlock,
  getCurrentBlockIndex
} from "../../utils/blocks";
import { normalizeToInterval } from "../../utils/time";

import TimeBlockCard from "../../components/time-block/TimeBlockCard";
import TimeBlockModal from "../../components/time-block/TimeBlockModal";
import { Block } from "../../utils/timeBlocks";
import { dateToHHMM } from "../../utils/dateToHHMM";
import { Category } from "../../constants/categories";
import { User } from "@supabase/supabase-js";
import { deleteCategory, fetchCategories } from "../../services/categories";
import { useAuthStore } from "../../store/useAuthStore";

/* ===================================================== */

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState<any | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);


  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [isTimeBlockModalOpen, setIsTimeBlockModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const authUser = useAuthStore((s) => s.user);


  const heroBlock = openDay ? getCurrentBlock(blocks) : null;
  const dayId = openDay?.id ?? null;

  function handleAddCategory(category: Category) {
  setCategories(prev => [...prev, category]);
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


  /* ================= LOAD OPEN DAY ================= */



useEffect(() => {
  if (!authUser?.id) return;

  async function loadCategories() {
    if (!authUser) return;
    try {
      const data = await fetchCategories(authUser.id);
      setCategories(data ?? []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }

  loadCategories();
}, [authUser?.id]);




  useEffect(() => {
    async function loadOpenDay() {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("days")
        .select("*")
        .eq("user_id", auth.user.id)
        .eq("status", "open")
        .maybeSingle();

      setOpenDay(data ?? null);
      setLoading(false);
    }

    loadOpenDay();
  }, []);

  /* ================= LOAD BLOCKS ================= */

  useEffect(() => {
  console.log(
    "HOME categories state:",
    categories.map(c => c.name)
  );
}, [categories]);


  useEffect(() => {
    if (!openDay) return;

    async function loadBlocks() {
      await ensureTimeBlocksExist(openDay);

      const { data } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("day_id", openDay.id)
        .order("start_time", { ascending: true });

      setBlocks(normalizeBlocks(data ?? []));
    }

    loadBlocks();
  }, [openDay]);

  /* ================= HELPERS ================= */

  function handleOpenBlock(blockIndex: number) {
    setActiveBlockIndex(blockIndex);
    setIsTimeBlockModalOpen(true);
  }

  function handleLogNow() {
    const index = getCurrentBlockIndex(blocks);
    if (index === null) return;
    handleOpenBlock(index);
  }

  function normalizeBlocks(rows: any[]): Block[] {
  return rows.map((row) => {
    const startISO = row.start_time; // string
    const endISO = row.end_time;     // string

    return {
      id: row.id,
      startISO,
      endISO,

      startTime: dateToHHMM(startISO),
      endTime: dateToHHMM(endISO),
      timeLabel: `${formatTime(startISO)} – ${formatTime(endISO)}`,

      completed: row.status === "logged",
      categoryId: row.category_id ?? null,
      description: row.description ?? "",
    };
  });
}

  async function ensureTimeBlocksExist(day: any) {
  const { data: existingBlocks } = await supabase
    .from("time_blocks")
    .select("start_time, end_time")
    .eq("day_id", day.id)
    .order("start_time", { ascending: true });

  const intervalMs = day.interval_minutes * 60 * 1000;
  const now = Date.now();

  let nextStart: Date;

  if (existingBlocks && existingBlocks.length > 0) {
    nextStart = new Date(
      existingBlocks[existingBlocks.length - 1].end_time
    );
  } else {
    nextStart = normalizeToInterval(
      new Date(day.start_time),
      day.interval_minutes
    );
  }

  const blocksToInsert: any[] = [];

  // ✅ Generate until one block PAST now
  while (nextStart.getTime() < now + intervalMs) {
    const start = new Date(nextStart);
    const end = new Date(start.getTime() + intervalMs);

    blocksToInsert.push({
      day_id: day.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "upcoming",
    });

    nextStart = end;
  }

  // 🔥 THIS WAS MISSING
  if (blocksToInsert.length > 0) {
    await supabase.from("time_blocks").insert(blocksToInsert);
  }

}




  async function handleSaveTimeBlock({
    dayId,
    blockIndex,
    categoryId,
    description,
  }: {
    dayId: string;
    blockIndex: number;
    categoryId: string | null;
    description: string;
  }) {
    // Optimistic update
    setBlocks((prev) => {
      const copy = [...prev];
      copy[blockIndex] = {
  ...copy[blockIndex],
  categoryId,
  description,
  completed: true,
};

      return copy;
    });

    await supabase
  .from("time_blocks")
  .update({
    category_id: categoryId,
    description,
    status: "logged",
  })
  .eq("id", blocks[blockIndex].id);


    setIsTimeBlockModalOpen(false);
    setActiveBlockIndex(null);
  }


  const activeBlock =
  activeBlockIndex !== null ? blocks[activeBlockIndex] : null;

  /* ================= RENDER ================= */

  return (
    <LinearGradient colors={["#0B132B", "#1C2541"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="time-outline" size={20} color="#FFFFFF" />
          <Text style={styles.headerText}>15 Productivity</Text>
        </View>

        {!loading && !openDay && (
  <TouchableOpacity
    onPress={() => router.push("/start-day")}
    style={{
      backgroundColor: "#24304D",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      alignSelf: "center",
      marginTop: 12,
    }}
  >
    <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
      Start Day
    </Text>
  </TouchableOpacity>
)}



        {/* DAY CONTEXT */}
        <View style={styles.contextRow}>
  <ContextPill
    label="Day Started 🌅"
    value={openDay ? formatTime(openDay.start_time) : "—"}
  />
  <ContextPill
    label="Interval ⏱"
    value={openDay ? `${openDay.interval_minutes} min` : "—"}
  />
  <ContextPill
    label="Goals 🎯"
    value={openDay ? "View" : "—"}
  />
  <ContextPill
    label="Sleep 😴"
    value={
      openDay
        ? formatTime(openDay.estimated_sleep_time)
        : "—"
    }
  />
</View>




        {openDay && (
          <>
            {/* PROMPT */}
            <Text style={styles.prompt}>What are you doing right now?</Text>

            {/* HERO */}
            <View style={styles.heroCard}>
              <Text style={styles.heroTime}>
  {heroBlock ? heroBlock.timeLabel : "No active block"}
</Text>


              <Pressable onPress={handleLogNow} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Log Now</Text>
              </Pressable>
            </View>

{/* PRODUCTIVITY BAR */}
        <View style={styles.productivity}>
          <Text style={styles.productivityLabel}>Productivity Today</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* LOG SLEEP */}
        <TouchableOpacity style={styles.sleepButton}>
          <Ionicons name="moon-outline" size={18} color="#FFFFFF" />
          <Text style={styles.sleepText}>Log Sleep</Text>
        </TouchableOpacity>

            {/* GRID */}
            <View style={styles.grid}>
  {blocks.map((block, index) => (
    <TimeBlockCard
      key={block.id}
      block={block}
      onPress={() => handleOpenBlock(index)}
    />
  ))}
</View>


          </>
        )}

      


      </ScrollView>

      {/* MODAL */}
      {activeBlock && openDay && (
        
  <Modal
    isVisible={isTimeBlockModalOpen}
    onSwipeComplete={() => {
      setIsTimeBlockModalOpen(false);
      setActiveBlockIndex(null);
    }}
    swipeDirection="down"
    onBackdropPress={() => {
      setIsTimeBlockModalOpen(false);
      setActiveBlockIndex(null);
    }}
    backdropOpacity={0.5}
    style={styles.modalContainer}
    propagateSwipe // 👈 IMPORTANT if modal scrolls
  >
    <View style={styles.modalContent}>
  <TimeBlockModal
    dayId={openDay.id}
    blockIndex={activeBlockIndex as number}
    timeRange={activeBlock.timeLabel}
    dateLabel={new Date().toDateString()}
    initialCategoryId={activeBlock.categoryId}
    initialDescription={activeBlock.description}
    categories={categories}
    onAddCategory={handleAddCategory}
    onDeleteCategory={handleDeleteCategory}
    onSave={handleSaveTimeBlock}
    onClose={() => {
      setIsTimeBlockModalOpen(false);
      setActiveBlockIndex(null);
    }}
  />
  </View>
  </Modal>
)}


    </LinearGradient>
  );
}

function ContextPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.contextPill}>
      <Text style={styles.contextLabel}>{label}</Text>
      <Text style={styles.contextValue}>{value}</Text>
    </View>
  );
}


/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: "row", gap: 8, marginBottom: 20 },
  headerText: { color: "#FFF", fontSize: 18, fontWeight: "600" },

  startDay: {
    backgroundColor: "#24304D",
    padding: 14,
    borderRadius: 14,
    alignSelf: "center",
  },
  sheetContainer: {
    minHeight: "50%",
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  startDayText: { color: "#FFF", fontWeight: "600" },

  prompt: { color: "#AAB4D6", marginBottom: 12 },

  heroCard: {
    backgroundColor: "#1C2541",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  heroTime: { color: "#FFF", fontSize: 18, fontWeight: "600" },

  primaryButton: {
    backgroundColor: "#4DA3FF",
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0B132B",
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
  justifyContent: "flex-end",
  margin: 0,
},

modalContent: {
  backgroundColor: "#F7F7F7",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 10,
  minHeight: 450,
},


  contextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  contextPill: {
    backgroundColor: "#24304D",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    width: "23%",
  },
  contextLabel: {
    color: "#6F7BAE",
    fontSize: 11,
  },
  contextValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  heroWarning: {
    color: "#FACC15",
    fontSize: 13,
    marginBottom: 14,
  },


  productivity: {
    marginBottom: 16,
  },
  productivityLabel: {
    color: "#AAB4D6",
    fontSize: 13,
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#24304D",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    width: "42%",
    height: "100%",
    backgroundColor: "#4ADE80",
  },

  sleepButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#24304D",
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 28,
  },
  sleepText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },


block: {
  width: "30%",
  height: 64,
  borderRadius: 16,
  backgroundColor: "#1C2541",
},

blockInner: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
},

blockLabel: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "600",
  lineHeight: 14, // optical centering
  textAlign: "center",

  // Android safety (harmless on iOS)
  includeFontPadding: false,
},

blockLogged: {
  backgroundColor: "#4ADE80",
},

blockMissed: {
  backgroundColor: "#374151",
},
press: {
  borderWidth: 2,
  borderColor: "red", 
},
});
