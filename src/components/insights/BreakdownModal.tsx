import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
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
  const data =
    mode === "outcome" ? outcomeData : categoryData;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      {/* BACKDROP */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* DIALOG */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Time Breakdown</Text>

<ScrollView
  style={{ maxHeight: 260 }}
  showsVerticalScrollIndicator={false}
>
  <TimeBreakdownBar
    mode={mode}
    data={data}
    onChangeMode={onChangeMode}
  />
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
  backgroundColor: colors.background,
  borderRadius: 20,
  padding: 20,
  borderWidth: 1,
  borderColor: colors.border,
  overflow: "hidden", // ✅ CRITICAL
},
chartContainer: {
  maxHeight: 260,     // 👈 adjust as needed
  width: "100%",
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
