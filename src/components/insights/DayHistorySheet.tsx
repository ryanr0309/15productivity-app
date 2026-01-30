import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import TimeBlockCard from "../time-block/TimeBlockCard";
import { Block } from "../../utils/timeBlocks";
import { colors } from "../../constants/colors";

type Props = {
  visible: boolean;
  blocks: Block[];
  onClose: () => void;
};


export default function DayHistorySheet({
  visible,
  blocks,
  onClose,
}: Props) {

    
    const sortedBlocks = [...blocks].sort(
  (a, b) =>
    new Date(a.startTime).getTime() -
    new Date(b.startTime).getTime()
);
const dayLabelStart =
  sortedBlocks.length > 0
    ? new Date(sortedBlocks[0].startTime).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

    const dayLabelEnd =
  sortedBlocks.length > 0
    ? new Date(sortedBlocks[0].endTime).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;



const startTime =
  sortedBlocks.length > 0
    ? new Date(sortedBlocks[0].startTime).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

const endTime =
  sortedBlocks.length > 0
    ? new Date(
        sortedBlocks[sortedBlocks.length - 1].endTime ??
          sortedBlocks[sortedBlocks.length - 1].startTime
      ).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <Modal
      isVisible={visible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.45}
      swipeDirection="down"
      onSwipeComplete={onClose}
      onBackdropPress={onClose}
      style={{ margin: 0, justifyContent: "flex-end" }}
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
       <View style={styles.header}>
  <View>
    <Text style={styles.title}>Day history</Text>

    {startTime && endTime && (
      <Text style={styles.subtitle}>
        {dayLabelStart} · {startTime} – {dayLabelEnd} · {endTime}
      </Text>
    )}
  </View>

  <Pressable onPress={onClose}>
    <Ionicons name="close" size={22} color="#FFF" />
  </Pressable>
</View>


        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.grid}>
  {sortedBlocks.map(block => (
    <View key={block.id} style={styles.col}>
      <TimeBlockCard
        block={block}
        onPress={() => {}}
      />
    </View>
  ))}
</View>


        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    flex: 1,
  },

  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginVertical: 10,
  },

  col: {
  width: "31.5%", // perfect 3 columns with gap
},


  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10, // 👈 modern RN (works in Expo)
  },
  subtitle: {
  color: "rgba(255,255,255,0.6)",
  fontSize: 13,
  fontWeight: "600",
  marginTop: 2,
},

});
