import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { colors } from "../../constants/colors";

type AISummaryPopupProps = {
  visible: boolean;
  summary: string;
  onClose: () => void;
};

export default function AISummaryPopup({
  visible,
  summary,
  onClose,
}: AISummaryPopupProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      {/* BACKDROP */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* CARD */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.label}>AI Summary</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <Text style={styles.text}>{summary}</Text>
          </ScrollView>

          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  scroll: {
    marginTop: 4,
  },

  text: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },

  close: {
    marginTop: 16,
    alignItems: "center",
  },

  closeText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
});
