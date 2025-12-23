import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase"; // adjust path
import { formatTime, getCurrentBlockLabel } from "../../utils/time";
import { getCurrentBlock } from "../../utils/blocks";
import { normalizeBlocks } from "../../utils/blocks";
import {normalizeToInterval} from "../../utils/time";


/**
 * STALE DATA (replace later)
 */



export default function Home() {

  const [loading, setLoading] = useState(true);
const [openDay, setOpenDay] = useState<any | null>(null);
const [blocks, setBlocks] = useState<any[]>([]);
const heroBlock = openDay ? getCurrentBlock(blocks) : null;

const timelineBlocks = openDay
  ? blocks.filter((b) => b.status !== "active")
  : [];


  
useEffect(() => {
  if (!openDay) return;

  async function loadAndEnsureBlocks() {
    await ensureTimeBlocksExist(openDay);

    const { data } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("day_id", openDay.id)
      .order("start_time", { ascending: true });

    setBlocks(normalizeBlocks(data ?? []));
  }

  loadAndEnsureBlocks();
}, [openDay]);


  useEffect(() => {
  async function loadOpenDay() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setOpenDay(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
  .from("days")
  .select("*")
  .eq("user_id", user.id)
  .eq("status", "open")
  .maybeSingle();

  setOpenDay(data ?? null);

    setLoading(false);
  }

  loadOpenDay();
}, []);

async function ensureTimeBlocksExist(day: any) {
  const { data: existingBlocks } = await supabase
    .from("time_blocks")
    .select("start_time, end_time")
    .eq("day_id", day.id)
    .order("start_time", { ascending: true });

  const intervalMs = day.interval_minutes * 60 * 1000;
  const now = new Date();

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

  const blocksToInsert = [];

  while (nextStart < new Date(now.getTime() + intervalMs)) {
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

  if (blocksToInsert.length > 0) {
    await supabase.from("time_blocks").insert(blocksToInsert);
  }
}


  return (
    <LinearGradient
      colors={["#0B132B", "#1C2541"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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


        {/* PROMPT */}
        <Text style={styles.prompt}>What are you doing right now?</Text>

        {/* CURRENT BLOCK HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Ionicons name="calendar-outline" size={18} color="#AAB4D6" />
            <Text style={styles.heroTime}>
  {heroBlock
    ? `${formatTime(heroBlock.start_time)} – ${formatTime(heroBlock.end_time)}`
    : "No active block"}
</Text>


          </View>

    

          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Log Now</Text>
          </TouchableOpacity>
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

        {/* TIME BLOCK GRID */}
        <View style={styles.grid}>
  {timelineBlocks.map((block) => (
    <View
      key={block.id}
      style={[
        styles.block,
        block.status === "logged" && styles.blockLogged,
        block.status === "missed" && styles.blockMissed,
      ]}
    >
      <View style={styles.blockInner}>
        <Text style={styles.blockLabel}>
          {formatTime(block.start_time)}
        </Text>
      </View>
    </View>
  ))}
</View>


      </ScrollView>
    </LinearGradient>
  );
}

/**
 * SMALL COMPONENTS
 */

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

/**
 * STYLES
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
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

  prompt: {
    color: "#AAB4D6",
    fontSize: 14,
    marginBottom: 12,
  },

  heroCard: {
    backgroundColor: "#1C2541",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  heroTime: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  heroWarning: {
    color: "#FACC15",
    fontSize: 13,
    marginBottom: 14,
  },

  primaryButton: {
    backgroundColor: "#4DA3FF",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0B132B",
    fontSize: 15,
    fontWeight: "700",
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
  grid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  rowGap: 12,
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


 
});
