import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  habitName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteHabitModal({
  visible,
  habitName,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      onSwipeComplete={onCancel}
      swipeDirection="down"
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Ionicons
            name="warning-outline"
            size={20}
            color="#EF4444"
          />
          <Text style={styles.title}>Delete Habit</Text>
        </View>

        <Text style={styles.message}>
          Delete habit{" "}
          <Text style={styles.bold}>
            “{habitName}”
          </Text>
          ?
        </Text>

        <Text style={styles.subtext}>
          This action cannot be undone.
        </Text>

        <Pressable
          style={styles.deleteButton}
          onPress={onConfirm}
        >
          <Text style={styles.deleteText}>
            Delete Habit
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    backgroundColor: "#1E2A4A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6B7280",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  message: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 6,
  },
  bold: {
    fontWeight: "600",
  },
  subtext: {
    color: "#B0B8D4",
    fontSize: 13,
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    color: "#B0B8D4",
    fontSize: 14,
  },
});
