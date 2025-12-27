import React, { useEffect, useRef, useState } from "react";
import {View,Text,StyleSheet,ScrollView,Pressable} from "react-native";
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
import { useDayGoals } from "../../services/useDayGoals";

/* ===================================================== */


export default function Home() {
  const {MIN_AWAKE_HOURS, COOLDOWN_HOURS, cooldownEnd, cooldownChecked, loadCooldown, getEarliestSleepTime} = useCooldown()
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  


  const { openDay, openDayChecked, reloadOpenDay } = useOpenDay();
  const { blocks, dayReady, saveTimeBlock, getCurrentBlockIndex } = useTimeBlocks(openDay);
  const { goals, goalsReady } = useDayGoals(openDay?.id ?? null);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [isTimeBlockModalOpen, setIsTimeBlockModalOpen] = useState(false);
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
} = useCategories();


/* ================== EFFECTS ======================== */

const hasFocusedRef = useRef(false);

useFocusEffect(
  useCallback(() => {
    if (hasFocusedRef.current) return;

    hasFocusedRef.current = true;
    reloadOpenDay();
  }, [reloadOpenDay])
);



useEffect(() => {
  if (openDayChecked) {
    loadCooldown();
  }
}, [openDayChecked, loadCooldown]);


async function handleConfirmSleep(sleepTime: Date) {
  console.log("HANDLE CONFIRM SLEEP FIRED", sleepTime);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("NO AUTH USER");
    return;
  }

  try {
    // 1️⃣ Close the open day in DB
    await closeOpenDay({
      userId: user.id,
      sleepTime,
    });

    // 2️⃣ Close modal immediately
    setIsSleepModalOpen(false);

    // 3️⃣ Refresh day identity
    await reloadOpenDay();

    // 4️⃣ Refresh cooldown (now that day is closed)
    await loadCooldown();

    // 5️⃣ OPTIONAL: clear blocks if day closed
    // reloadBlocks() will naturally no-op if openDay becomes null

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
  console.log(index)
  if (index === null) return;
  handleOpenBlock(index);
}

/* ================= RENDER ================= */

function renderContent() {
  // 1️⃣ App not ready
  if (!openDayChecked || !cooldownChecked) {
    return <HomeSkeleton />;
  }

  // 2️⃣ Cooldown
  if (cooldownEnd) {
    return (
      <CooldownScreen
        unlockTime={cooldownEnd}
        onFinished={async () => {
          await loadCooldown();
          await reloadOpenDay();
        }}
      />
    );
  }

  // 3️⃣ No open day
  if (!openDay) {
    return (
      <StartDayScreen
        onStarted={async () => {
          await reloadOpenDay();
        }}
      />
    );
  }

  // 4️⃣ Blocks not ready
  if (!dayReady) {
    return <HomeSkeleton />;
  }

  // 5️⃣ Fully ready
  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="time-outline" size={20} color="#FFFFFF" />
          <Text style={styles.headerText}>15 Productivity</Text>
        </View>



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
    onPress={()=>{setIsGoalsModalOpen(true)
    }}
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


        <Pressable
  style={[
    styles.sleepButton,
    !canLogSleep && { opacity: 0.4 },
  ]}
  disabled={!canLogSleep}
  onPress={() => setIsSleepModalOpen(true)}
>
  <Text style={styles.sleepText}>Log Sleep 🌙</Text>

  {!canLogSleep && earliestSleepTime && (
    <Text
      style={{
        color: "#B0B8D4",
        fontSize: 12,
        marginTop: 4,
      }}
    >
      Available in {formatRemaining(remainingMs)}
    </Text>
  )}
</Pressable>


            {/* GRID */}
            <View style={styles.grid}>
  {blocks.map((block, index) => {

 const category = categories.find(
      c => c.id === block.categoryId
    );

     console.log("MATCH ATTEMPT:", {
      blockCategoryId: block.categoryId,
      categoryIds: categories.map(c => c.id),
    });
  
  return (
    
    <TimeBlockCard
      key={block.id}
      block={block}
      onPress={() => handleOpenBlock(index)}
      category={category}
    />
  )})}
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
    avoidKeyboard
  >
    <View style={styles.modalContent}>
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
  </View>
  </Modal>

  
)}
{openDay && (
<SleepModal
  wakeTime={new Date(openDay.start_time)}  
  visible={isSleepModalOpen}
  onClose={() => {
      setIsSleepModalOpen(false);
      
    }}
  onHidden={() => setIsSleepModalOpen(false)} // 👈 FORCE RELEASE
  onConfirm={handleConfirmSleep}
/>
)}


{openDay && (
  <Modal
    isVisible={isGoalsModalOpen}
    onSwipeComplete={() => setIsGoalsModalOpen(false)}
    swipeDirection="down"
    onBackdropPress={() => setIsGoalsModalOpen(false)}
    backdropOpacity={0.5}
    style={styles.modalContainer}
    propagateSwipe
  >
    <View style={styles.modalContent}>
      <DailyGoalsModal
  goals={goals}
  loading={!goalsReady}
  onClose={() => setIsGoalsModalOpen(false)}
/>

    </View>
  </Modal>
)}
</>
  );
}

  return (
     <LinearGradient colors={["#0B132B", "#1C2541"]} style={styles.container}>
    {renderContent()}
  </LinearGradient>
)}

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
    justifyContent: "flex-start",
    flex: 1,
    gap: 18
  },

  modalOverlay: {
    flex: 1,
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
    justifyContent: "space-between",
    marginBottom: 24,
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
