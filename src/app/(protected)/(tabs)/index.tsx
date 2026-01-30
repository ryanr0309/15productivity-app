
import React, { useEffect, useRef, useState } from "react";
import { useScrollToTop } from "@react-navigation/native";
import { useData } from "../../../providers/DataProvider";
import { useAuth } from "../../../hooks/useAuth";
import {View,Text,StyleSheet,ScrollView,Pressable, Platform, FlatList, Image} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import Modal from "react-native-modal";
import CooldownScreen from "../../../components/home/cooldown";
import { formatTime } from "../../../utils/time";
import {getCurrentBlock,getCurrentBlockIndex} from "../../../utils/blocks";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import TimeBlockCard from "../../../components/time-block/TimeBlockCard";
import TimeBlockModal from "../../../components/time-block/TimeBlockModal";
import SleepModal from "../../../components/home/sleepModal";
import { closeOpenDay } from "../../../lib/days";
import StartDayScreen from "../../../components/home/startday";
import DailyGoalsModal from "../../../components/config/DailyGoalsModal";
import HomeSkeleton from "../../../components/home/HomeSkeleton"
import { useOpenDay } from "../../../services/useOpenDay";
import { useCooldown } from "../../../services/useCooldown";
import { useTimeBlocks } from "../../../services/useTimeBlocks";
import { formatRemaining } from "../../../utils/time";
import { ContextPill } from "../../../components/home/contextPill";
import DayUnlockFlow from "../../../components/day-unlock/DayUnlockFlow";
import { Habit } from "../../../constants/habits";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Block } from "../../../utils/timeBlocks";
import { closeDay } from "../../../utils/dayLifecycle";
import HomeAnalyticsLoading from "../../../components/home/HomeAnalyticsLoading";
import AnalyticsSummarySheet from "../../../components/home/AnalyticsSummarySheet";



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

type PostDayState =
  | "idle"
  | "closing"
  | "analyzing"
  | "show_summary"
  | "cooldown";



/* ===================================================== */


export default function Home() {
  const {MIN_AWAKE_HOURS, COOLDOWN_HOURS, cooldownEnd, cooldownChecked, loadCooldown, getEarliestSleepTime} = useCooldown()
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const {
  openDay,
  openDayChecked,
  reloadOpenDay,
  categories,
  addCategory,
  deleteCategory,
  habits,
  homeCache,
  homeReady,
  markHomeReady,
  insightsCache,
  fetchInsights
} = useData();


const [postDayState, setPostDayState] =
  useState<PostDayState>("idle");

  const [isMultiSelect, setIsMultiSelect] = useState(false);
const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());


const initial: Block[] =
  openDay?.id &&
  homeCache !== null &&
  homeCache.dayId === openDay.id
    ? homeCache.blocks
    : [];


    const shouldUnlock = (
  !openDay ||
  openDay.day_phase !== "locked" ||
  !homeReady ||
  !homeCache
);

    const { blocks, dayReady, saveTimeBlock, getCurrentBlockIndex } =
  useTimeBlocks(openDay, initial, () => {
    markHomeReady();
  });

  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [isTimeBlockModalOpen, setIsTimeBlockModalOpen] = useState(false);
  const wakeTime = openDay ? new Date(openDay.start_time) : null;
  const earliestSleepTime = wakeTime ? getEarliestSleepTime(wakeTime) : null;
  const [now, setNow] = useState(new Date());
  const canLogSleep = earliestSleepTime ? now >= earliestSleepTime : false;
  const remainingMs = earliestSleepTime ? Math.max(earliestSleepTime.getTime() - now.getTime(), 0) : 0;
  const heroBlock = openDay ? getCurrentBlock(blocks) : null;
  const activeBlock = activeBlockIndex !== null ? blocks[activeBlockIndex] : null;
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  const [summaryDayId, setSummaryDayId] = useState<string | null>(null);


  const { userId } = useAuth();





/* ================== EFFECTS ======================== */

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



const isLogged =
  heroBlock &&
  (heroBlock.categoryId !== null ||
    (heroBlock.description &&
      heroBlock.description.trim().length > 0));


const startedBlocks = blocks.filter(
  b => new Date(b.startTime) <= now
);

const loggedBlocks = startedBlocks.filter(
  b =>
    b.categoryId !== null ||
    (b.description && b.description.trim().length > 0)
);

const totalStarted = startedBlocks.length;
const totalLogged = loggedBlocks.length;

const loggedPercent =
  totalStarted === 0
    ? 0
    : Math.round((totalLogged / totalStarted) * 100);







useEffect(() => {
  // Align to the next minute boundary
  const syncToMinute = () => {
    const msUntilNextMinute =
      60000 - (Date.now() % 60000);

    setTimeout(() => {
      setNow(new Date());

      const interval = setInterval(() => {
        setNow(new Date());
      }, 60000);

      // cleanup interval when component unmounts
      return () => clearInterval(interval);
    }, msUntilNextMinute);
  };

  syncToMinute();
}, []);


useEffect(() => {
  if (openDayChecked) {
    loadCooldown();
  }
}, [openDayChecked, loadCooldown]);



async function handleConfirmSleep(sleepTime: Date) {
  if (!openDay || !userId) return;

  setPostDayState("analyzing");

  const dayId = await closeDay({
    dayId: openDay.id,
    endTime: sleepTime,
    reason: "manual",
  });

  await waitForDailyReport(supabase, dayId);
  await fetchInsights(userId);

  setSummaryDayId(dayId);            // ✅ store the closed day id
  setPostDayState("show_summary");   // ✅ now open sheet
}




useEffect(() => {
  async function loadDayNumber() {
    if (!userId) return;

    const { count, error } = await supabase
      .from("days")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!error && typeof count === "number") {
      setDayNumber(count);
    }
  }

  loadDayNumber();
}, [userId]);



async function waitForDailyReport(
  supabase: any,
  dayId: string,
  timeoutMs = 15000
): Promise<any | null> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("day_id", dayId)
      .maybeSingle();

    if (data) return data;

    // wait 750ms before next check
    await new Promise(res => setTimeout(res, 750));
  }

  return null;
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

function toggleBlockSelection(blockId: string) {
  setSelectedBlockIds(prev => {
    const next = new Set(prev);
    next.has(blockId) ? next.delete(blockId) : next.add(blockId);
    return next;
  });
}

async function saveMultiBlock(
  categoryId: string | null,
  description: string,
  status: "logged" | "unknown"
) {
  const ids = Array.from(selectedBlockIds);

  const category =
    categoryId
      ? categories.find(c => c.id === categoryId) ?? null
      : null;

 await Promise.all(
  ids.map(blockId =>
    saveTimeBlock({
      blockId,
      status, // ✅ THIS IS THE FIX
      categoryId,
      categoryLabel: category?.label ?? null,
      categoryColor: category?.color ?? null,
      description,
    })
  )
);


  setIsMultiSelect(false);
  setSelectedBlockIds(new Set());
}


function renderContent() {
 
  

  // 5️⃣ Fully ready
  return (
    <>
      
        {/* HEADER */}
       <View style={styles.header}>
                 <View style={styles.brandLeft}>
         
  <Image
    source={require("../../../assets/images/fifteen.png")}
    style={styles.logoImage}
    resizeMode="contain"
  />


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
  label="Day ⏱"
  value={dayNumber !== null ? `Day ${dayNumber}` : "—"}
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
      {heroBlock
        ? isLogged
          ? "This time block has been logged"
          : "Tap Log Now to record this block"
        : "No active block"}
    </Text>
  </View>

  <Pressable
    onPress={handleLogNow}
    style={[
      styles.primaryButton,
      isLogged && styles.primaryButtonSecondary,
    ]}
  >
    <Text style={styles.primaryButtonText}>
      {isLogged ? "View Log" : "Log Now"}
    </Text>

    <Ionicons
      name={isLogged ? "eye-outline" : "arrow-forward"}
      size={16}
      color={colors.textPrimary}
    />
  </Pressable>
</View>
            

{/* PRODUCTIVITY BAR */}
        <View style={styles.prodWrap}>
  <View style={styles.prodRow}>
    <Text style={styles.prodLabel}>
      Logged so far
    </Text>

    <Text style={styles.prodValue}>
      {`${loggedPercent}% (${totalLogged}/${totalStarted})`}
    </Text>
  </View>

  <View style={styles.barOuter}>
    <View
      style={[
        styles.barInner,
        { width: `${loggedPercent}%` },
      ]}
    />
  </View>

  <Text style={styles.prodHint}>
    Only time that has already started is counted.
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

<View style={styles.sectionHeaderRow}>
  <View>
    <Text style={styles.sectionTitle}>Time Blocks</Text>
    <Text style={styles.sectionSubtitle}>
      15-minute universal schedule
    </Text>
  </View>


  <Pressable
    onPress={() => {
      setIsMultiSelect(!isMultiSelect);
      setSelectedBlockIds(new Set());
    }}
    style={styles.selectBtn}
  >
    <Text style={styles.selectBtnText}>
      {isMultiSelect ? "Cancel" : "Multi-Select"}
    </Text>
  </Pressable>
</View>


{isMultiSelect && selectedBlockIds.size > 0 && (
  <View style={styles.multiActionBar}>
    <Text style={styles.multiActionText}>
      {selectedBlockIds.size} blocks selected
    </Text>

    <Pressable
      style={styles.multiActionBtn}
      onPress={() => setIsTimeBlockModalOpen(true)}
    >
      <Text style={styles.multiActionBtnText}>
        Log Activity
      </Text>
    </Pressable>
  </View>
)}
            {/* GRID */}

<FlatList
  data={blocks}
  keyExtractor={(item) => item.id}
  numColumns={3}
  scrollEnabled={false}
  columnWrapperStyle={styles.gridRow}
  contentContainerStyle={styles.gridContainer}
  renderItem={({ item, index }) => {
    const plannedHabit = habits.find(h => h.id === item.habit_id);
    const category = categories.find(c => c.id === item.categoryId);

      return (
    <View style={styles.gridItem}>
      <TimeBlockCard
        block={item}
        plannedHabit={plannedHabit}
        loggedCategory={category}
        selectionMode={isMultiSelect}
        isSelected={selectedBlockIds.has(item.id)}
        onPress={() => {
          if (isMultiSelect) {
            toggleBlockSelection(item.id);
          } else {
            handleOpenBlock(index);
          }
        }}
      />
    </View>
      );
  }}
/>





          </>
        )}

</>
  );
}

if (postDayState === "closing" || postDayState === "analyzing") {
  return <HomeAnalyticsLoading/>;
}


      return (
  <SafeAreaView style={styles.safe}>
    {cooldownEnd ? (
      <View style={{ flex: 1 }}>
        <CooldownScreen
          unlockTime={cooldownEnd}
          onFinished={loadCooldown}
        />
      </View>
    ) : (shouldUnlock) ? (
      <View style={{ flex: 1 }}>
        <DayUnlockFlow
          day={openDay}
          onDayChanged={reloadOpenDay}
        />
      </View>
    ):(
      // ACTIVE DAY = SCROLL + HOME UI
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    )}
     {/* MODAL */}

      <AnalyticsSummarySheet
  visible={postDayState === "show_summary"}
  dayId={openDay?.id}
  onDismiss={() => setPostDayState("cooldown")}
/>

      {(isMultiSelect || activeBlock) && openDay && (

        
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
  blockId={activeBlock?.id ?? "__bulk__"}
  timeRange={
    isMultiSelect
      ? `${selectedBlockIds.size} blocks selected`
      : activeBlock!.timeLabel
  }
  dateLabel={new Date().toDateString()}
  initialCategoryId={
    isMultiSelect ? null : activeBlock!.categoryId
  }
  initialDescription={
    isMultiSelect ? "" : activeBlock!.description
  }
  editCount={isMultiSelect ? 0 : activeBlock!.edit_count ?? 0}
  onAddCategory={addCategory}
  onDeleteCategory={deleteCategory}
  onSave={async (categoryId, description, status = "logged") => {
  if (isMultiSelect) {
    return saveMultiBlock(categoryId, description,status);
  }

  const category =
    categoryId
      ? categories.find(c => c.id === categoryId) ?? null
      : null;

  await saveTimeBlock({
    blockId: activeBlock!.id,
    status, // ✅ THIS IS ESSENTIAL
    categoryId,
    categoryLabel: category?.label ?? null,
    categoryColor: category?.color ?? null,
    description,
  });
}}

  onClose={() => {
    setIsTimeBlockModalOpen(false);
    setActiveBlockIndex(null);
    setIsMultiSelect(false);
    setSelectedBlockIds(new Set());
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
  justifyContent: "space-between",               // 👈 horizontal spacing
  marginBottom: 10,        // 👈 vertical spacing
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
  },
  primaryButtonSecondary: {
  backgroundColor: colors.cardStrong,
  borderWidth: 1,
  borderColor: colors.border,
},
logoImage: {
  width: 24,
  height: 24,
  borderRadius: 4
},
sectionHeaderRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 4,
  marginBottom: 10,
},

selectBtn: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 999,
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
},

selectBtnText: {
  color: colors.textPrimary,
  fontSize: 12,
  fontWeight: "800",
},
multiActionBar: {
  marginTop: 10,
  marginBottom: 12,
  backgroundColor: colors.cardStrong,
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
},


multiActionText: {
  color: colors.textPrimary,
  fontSize: 13,
  fontWeight: "700",
},

multiActionBtn: {
  backgroundColor: colors.accent,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 12,
},

multiActionBtnText: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "800",
},
gridItem: {
  flex: 1,
  marginHorizontal: 5, // horizontal spacing
},



});
