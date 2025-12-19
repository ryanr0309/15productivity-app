import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import Modal from "react-native-modal";
import { colors } from "../../constants/colors";
import TimeBlockCard from "../../components/time-block/TimeBlockCard";
import ProgressBar from "../../components/ui/ProgressBar";
import { generateTimeBlocks } from "../../utils/timeBlocks";
import { useState } from "react";
import React from "react";
import TimeBlockModal from "../../components/time-block/TimeBlockModal";
import TimePickerModal from "../../components/config/TimePickerModal";
import IntervalPicker from "../../components/config/IntervalPickerModal";
import formatTime from "../../utils/time";
import { dateToHHMM } from "../../utils/dateToHHMM";
import DailyGoalsModal from "../../components/config/DailyGoalsModal";
import { Category } from "../../constants/categories";

const MOCK_CONFIG = {
  wakeTime: "09:00",
  sleepTime: "22:00",
  intervalMinutes: 45,
};

export default function Home() {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyGoals, setDailyGoals] = useState<string[]>([
]);
  const [timeBlocks, setTimeBlocks] = useState(() =>
  generateTimeBlocks(
    MOCK_CONFIG.wakeTime,
    MOCK_CONFIG.sleepTime,
    MOCK_CONFIG.intervalMinutes
  )
);

const [categories, setCategories] = useState<Category[]>([
  { id: "school", label: "School", color: "#4DA3FF" },
  { id: "gym", label: "Gym", color: "#18C964" },
  { id: "work", label: "Work", color: "#FF9F43" },
  { id: "focus", label: "Deep Focus", color: "#A55EEA" },
]);

  const activeBlock = timeBlocks.find(b => b.id === activeBlockId);


  const completedCount = timeBlocks.filter(b => b.completed).length;

  const progress =
  timeBlocks.length > 0
    ? completedCount / timeBlocks.length
    : 0;

  function handleSaveTimeBlock(data: {
  categoryId: string | null;
  description: string;
}) {
  if (!activeBlockId) return;

  setTimeBlocks(prev =>
    prev.map(block =>
      block.id === activeBlockId
        ? {
            ...block,
            completed: true,
            categoryId: data.categoryId,
            description: data.description,
          }
        : block
    )
  );

  setIsModalOpen(false);
  setActiveBlockId(null);
}

type ConfigModal = "wake" | "sleep" | "interval" | "goals" | null;

const [activeConfigModal, setActiveConfigModal] = useState<ConfigModal>(null);



const [wakeTime, setWakeTime] = useState(new Date(2024, 0, 1, 8, 0));
const [sleepTime, setSleepTime] = useState(new Date(2024, 0, 1, 22, 0));
const [intervalMinutes, setIntervalMinutes] = useState(45);

function regenerateTimeBlocks(
  wake: Date,
  sleep: Date,
  interval: number
) {
  setTimeBlocks(
    generateTimeBlocks(
      dateToHHMM(wake),
      dateToHHMM(sleep),
      interval
    )
  );
}

function getBlockDate(timeLabel: string): Date {
  const now = new Date();

  // Extract hour/minute from "h:mmAM"
  const match = timeLabel.match(/(\d+):(\d+)(AM|PM)/);
  if (!match) return now;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3];

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const blockDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  );

  return blockDate;
}

function isFutureBlock(timeLabel: string): boolean {
  const blockDate = getBlockDate(timeLabel);
  return blockDate.getTime() > Date.now();
}


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* HEADER */}
<View style={styles.header}>
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
  onAddCategory={(newCategory) => {
    setCategories(prev => [...prev, newCategory]);
  }}

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
    onSave={(time) => {
      setWakeTime(time);
      regenerateTimeBlocks(time, sleepTime, intervalMinutes)
      setActiveConfigModal(null);
    }}
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
    onSave={(time) => {
      setSleepTime(time);
      regenerateTimeBlocks(wakeTime, time, intervalMinutes)
      setActiveConfigModal(null);
    }}
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
    onSave={(newInterval) => {
      setIntervalMinutes(newInterval);
      regenerateTimeBlocks(wakeTime, sleepTime, newInterval)
      setActiveConfigModal(null);
    }}
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
    onSave={(goals) => {
      setDailyGoals(goals);
      setActiveConfigModal(null);
    }}
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
