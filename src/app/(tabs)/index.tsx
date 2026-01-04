
import React, { useEffect, useRef, useState } from "react";
import {View,Text,StyleSheet,ScrollView,Pressable, Platform, FlatList} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import Modal from "react-native-modal";
import CooldownScreen from "../../components/home/cooldown";
import { formatTime } from "../../utils/time";
import {getCurrentBlock,getCurrentBlockIndex} from "../../utils/blocks";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import TimeBlockCard from "../../components/time-block/TimeBlockCard";
import TimeBlockModal from "../../components/time-block/TimeBlockModal";
import SleepModal from "../../components/home/sleepModal";
import { closeOpenDay } from "../../lib/days";
import StartDayScreen from "../../components/home/startday";
import DailyGoalsModal from "../../components/config/DailyGoalsModal";
import HomeSkeleton from "../../components/home/HomeSkeleton"
import { useCategories } from "../../services/useCategories";
import { useOpenDay } from "../../services/useOpenDay";
import { useCooldown } from "../../services/useCooldown";
import { useTimeBlocks } from "../../services/useTimeBlocks";
import { formatRemaining } from "../../utils/time";
import { ContextPill } from "../../components/home/contextPill";
import DayUnlockFlow from "../../components/day-unlock/DayUnlockFlow";
import { Habit } from "../../constants/habits";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
const colors = {
  background: "#0B1224",
  card: "rgba(255,255,255,0.06)",
  cardStrong: "rgba(255,255,255,0.09)",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.7)",
  border: "rgba(255,255,255,0.10)",
  accent: "#4DA3FF",
  good: "#22C55E",
  warn: "#F59E0B",
  danger: "#EF4444",
};




/* ===================================================== */


export default function Home() {
  const {MIN_AWAKE_HOURS, COOLDOWN_HOURS, cooldownEnd, cooldownChecked, loadCooldown, getEarliestSleepTime} = useCooldown()
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const { openDay, openDayChecked, reloadOpenDay } = useOpenDay();
  const { blocks, dayReady, saveTimeBlock, getCurrentBlockIndex, reloadTimeBlocks } = useTimeBlocks(openDay);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [isTimeBlockModalOpen, setIsTimeBlockModalOpen] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const insets = useSafeAreaInsets();
  const homeReady = openDayChecked && cooldownChecked;
  const wakeTime = openDay ? new Date(openDay.start_time) : null;
  const earliestSleepTime = wakeTime ? getEarliestSleepTime(wakeTime) : null;
  const now = new Date();
  const canLogSleep = earliestSleepTime ? now >= earliestSleepTime : false;
  const remainingMs = earliestSleepTime ? Math.max(earliestSleepTime.getTime() - now.getTime(), 0) : 0;
  const heroBlock = openDay ? getCurrentBlock(blocks) : null;
  const activeBlock = activeBlockIndex !== null ? blocks[activeBlockIndex] : null;
  const {
  categories,
  handleAddCategory,
  handleDeleteCategory,
  reloadCategories
} = useCategories();


/* ================== EFFECTS ======================== */

const hasFocusedRef = useRef(false);

useFocusEffect(
  useCallback(() => {
    let cancelled = false;

    async function loadHome() {
      if (cancelled) return;

      await reloadOpenDay();      // source of truth
      await reloadCategories();   // cheap
      await reloadTimeBlocks();   // depends on openDay
    }

    loadHome();

    return () => {
      cancelled = true;
    };
  }, [reloadOpenDay, reloadCategories, reloadTimeBlocks])
);


useEffect(() => {
  async function loadHabits() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("habits")
      .select("id, name, color")
      .eq("user_id", user.id);

    setHabits(data ?? []);
  }

  loadHabits();
}, []);


useEffect(() => {
  if (openDayChecked) {
    loadCooldown();
  }
}, [openDayChecked, loadCooldown]);


async function handleConfirmSleep(sleepTime: Date) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  try {
    // 1️⃣ Close day and capture ID
    const dayId = await closeOpenDay({
      userId: user.id,
      sleepTime,
    });

    // 2️⃣ Analyze the completed day (fire-and-forget)
    supabase.functions.invoke("analyze-day", {
      body: { dayId },
    });

    // 3️⃣ Close modal
    setIsSleepModalOpen(false);

    // 4️⃣ Refresh state
    await reloadOpenDay();
    await loadCooldown();

  } catch (err) {
    console.error("Failed to log sleep", err);
  }
}



function handleOpenBlock(blockIndex: number) {
  setActiveBlockIndex(blockIndex);
  setIsTimeBlockModalOpen(true);
}

function handleLogNow() {
  const index = getCurrentBlockIndex();

  if (index === null) return;
  handleOpenBlock(index);
}

/* ================= RENDER ================= */


function renderContent() {
  // 1️⃣ App still loading initial state
  if (!openDayChecked) {
    return <HomeSkeleton />;
  }

  // 2️⃣ Cooldown (passive gate)
  if (cooldownEnd) {
    return (
      <CooldownScreen
        unlockTime={cooldownEnd}
        onFinished={loadCooldown}
      />
    );
  }

  // 3️⃣ Day Unlock Flow
  // - If NO open day → flow will create one
  // - If open day but not locked → flow continues
  if (!openDay || openDay.day_phase !== "locked") {
    return <DayUnlockFlow
  day={openDay}
  onDayChanged={reloadOpenDay}
/>
  }

  // 4️⃣ Open day exists, locked, but blocks still loading
  if (!dayReady) {
    return <HomeSkeleton />;
  }

  // 5️⃣ Fully ready
  return (
    <>
      
        {/* HEADER */}
       <View style={styles.header}>
                 <View style={styles.brandLeft}>
                   <View style={styles.logoCircle}>
                     <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
                   </View>
                   <Text style={styles.brandText}>15 Productivity</Text>
                 </View>
       
                 <View style={styles.headerRightPill}>
                   <Text style={styles.headerRightPillText}>{formatTime(now)}</Text>
                 </View>
               </View>



        {/* DAY CONTEXT */}
        <View style={styles.contextRow}>
  <ContextPill
    label="Day Started 🌅"
    value={openDay ? formatTime(openDay.start_time) : "—"}
  />
  <ContextPill
    label="Streaks ⏱"
    value="5 days"
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
            <View style={styles.hero}>
            <Text style={styles.prompt}>What are you doing right now?</Text>

            {/* HERO */}
            <View style={styles.heroCard}>
              <View style={styles.heroCardTop}>
              <View>
              <Text style={styles.heroTime}>
              {heroBlock ? heroBlock.timeLabel : "No active block"}
              </Text>
              <Text style={styles.heroSmall}>
              {"Tap Log Now to record this block"}
                </Text>
              </View>

              <Pressable onPress={handleLogNow} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Log Now</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textPrimary} />
              </Pressable>
              </View>
            

{/* PRODUCTIVITY BAR */}
        <View style={styles.prodWrap}>
                      <View style={styles.prodRow}>
                        <Text style={styles.prodLabel}>Productivity today</Text>
                        <Text style={styles.prodValue}>
                          {"50% (15/30)"}
                        </Text>
                      </View>
        
                      <View style={styles.barOuter}>
                        <View style={[styles.barInner, { width: `50%` }]} />
                      </View>
        
                      <Text style={styles.prodHint}>
                        Scored on blocks that have started (universal 15-min intervals).
                      </Text>
                    </View>

        {/* LOG SLEEP */}


        <Pressable
  style={[
    styles.sleepButton,
    !canLogSleep ? styles.sleepBtnLocked : null,
  ]}
  disabled={!canLogSleep}
  onPress={() => setIsSleepModalOpen(true)}
>
  <View style={styles.sleepBtnLeft}>
                  <Text style={styles.sleepEmoji}>🌙</Text>
                  <Text style={styles.sleepBtnText}>Log Sleep</Text>
  </View>

  {!canLogSleep && earliestSleepTime && (
    <Text
      style={styles.sleepBtnRight}
    >
      Available in {formatRemaining(remainingMs)}
    </Text>
  )}
</Pressable>
</View>
</View>

<View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Time Blocks</Text>
    <Text style={styles.sectionSubtitle}>15-minute universal schedule</Text>
</View>

            {/* GRID */}

<FlatList
  data={blocks}
  keyExtractor={(item) => item.id}
  numColumns={3}
  scrollEnabled={false} // 👈 IMPORTANT: parent handles scroll
  columnWrapperStyle={styles.gridRow}
  contentContainerStyle={styles.gridContainer}
  renderItem={({ item, index }) => {
    const plannedHabit = habits.find(
      h => h.id === item.habit_id
    );

    const category = categories.find(
      c => c.id === item.categoryId
    );

    return (
      <TimeBlockCard
        block={item}
        plannedHabit={plannedHabit}
        loggedCategory={category}
        onPress={() => handleOpenBlock(index)}
      />
    );
  }}
/>



          </>
        )}

</>
  );
}

  return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.bg}>
     
           <ScrollView
             contentContainerStyle={styles.container}
             showsVerticalScrollIndicator={false}
           >
    {renderContent()}
    </ScrollView>
    </View>
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
    avoidKeyboard
  >
 
  <TimeBlockModal
    blockId={activeBlock.id}
    timeRange={activeBlock.timeLabel}
    dateLabel={new Date().toDateString()}
    initialCategoryId={activeBlock.categoryId}
    initialDescription={activeBlock.description}
    categories={categories}
    onAddCategory={handleAddCategory}
    onDeleteCategory={handleDeleteCategory}
    onSave={saveTimeBlock}
    onClose={() => {
      setIsTimeBlockModalOpen(false);
      setActiveBlockIndex(null);
    }}
  />
  </Modal>

  
)}
{openDay && (
  <Modal
    isVisible={isSleepModalOpen}
    onSwipeComplete={() => {
      setIsSleepModalOpen(false);
    }}
    swipeDirection="down"
    onBackdropPress={() => {
      setIsSleepModalOpen(false);
    }}
    backdropOpacity={0.5}
    style={styles.modalContainer}
    propagateSwipe // 👈 IMPORTANT if modal scrolls
    avoidKeyboard
  >
<SleepModal
  wakeTime={new Date(openDay.start_time)}  
  visible={isSleepModalOpen}
  onClose={() => {
      setIsSleepModalOpen(false);
      
    }}
  onHidden={() => setIsSleepModalOpen(false)} // 👈 FORCE RELEASE
  onConfirm={handleConfirmSleep}
/>
</Modal>
)}

  </SafeAreaView>
)}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
   container: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "android" ? 10 : 6,
      paddingBottom: 28,
    },

  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  
  headerText: { color: "#EAEAF0", fontSize: 18, fontWeight: "600" },

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

  startDayText: { color: "#EAEAF0", fontWeight: "600" },

  prompt: { 
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },

  heroCard: {
    backgroundColor: colors.cardStrong,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  heroTime: { 
     color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
    backgroundColor: "rgba(77,163,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(77,163,255,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  primaryButtonText: {
   color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },

gridContainer: {
  paddingTop: 12,
},

gridRow: {
  justifyContent: "space-between",
  marginBottom: 10,
},


  modalOverlay: {

    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
  justifyContent: "flex-end",
  margin: 0, // 🚨 REQUIRED for keyboard to work
},

modalContent: {
  backgroundColor: "#F7F7F7",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 10,
  minHeight: 300,
},

modalContentSleep: {
  backgroundColor: "#1E2A4A",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 10,
  minHeight: 300,
},

  contextRow: {
    flexDirection: "row",
    gap: 10 as any,
    marginBottom: 14,
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
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sleepText: {
    color: "#EAEAF0",
    fontSize: 15,
    fontWeight: "600",
  },
   sleepBtnLocked: {
    opacity: 0.55,
  },


block: {
  width: "30%",
  height: 64,
  borderRadius: 16,
  backgroundColor: "#1C2541",
},

blockInner: {
  alignItems: "center",
  justifyContent: "center",
},

blockLabel: {
  color: "#EAEAF0",
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
 brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10 as any,
  },
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerRightPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRightPillText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },

    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    bg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
    },
    hero: {
    marginBottom: 14,
  },
  
  prodWrap: {
    marginTop: 14,
  },
  prodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  prodLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  prodValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  barOuter: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  barInner: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.55)",
  },
  prodHint: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  sleepBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
  },
  sleepEmoji: {
    fontSize: 16,
  },
  sleepBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  sleepBtnRight: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  heroSmall: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  heroCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10 as any,
  },
  
  sectionHeader: {
    marginTop: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  }
});
