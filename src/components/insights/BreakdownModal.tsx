import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import TimeBreakdownBar from "./TimeBreakdownBar";
import { colors } from "../../constants/colors";

type BreakdownMode = "outcome" | "category";

type BreakdownItem = {
  label: string;
  minutes: number;
  color: string;
};

type BreakdownPopupProps = {
  visible: boolean;
  onClose: () => void;
  categoryData: BreakdownItem[];
  outcomeData: BreakdownItem[];
  mode: BreakdownMode;
  onChangeMode: (mode: BreakdownMode) => void;
};

export default function BreakdownPopup({
  visible,
  onClose,
  categoryData,
  outcomeData,
  mode,
  onChangeMode,
}: BreakdownPopupProps) {
  const data = mode === "outcome" ? outcomeData : categoryData;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      {/* BACKDROP */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* CARD */}
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>Time Breakdown</Text>

          {/* 🔑 NO ScrollView here */}
          <TimeBreakdownBar
            mode={mode}
            data={data}
            onChangeMode={onChangeMode}
          />

          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.close}>
              <Text style={styles.closeText}>Done</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%", // 🔑 REQUIRED FOR SCROLL
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
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
