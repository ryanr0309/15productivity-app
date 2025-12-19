import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import React from "react";

type SettingsRowProps = {
  label: string;
  value?: string;
  showChevron?: boolean;
  danger?: boolean;
  onPress?: () => void;
};

export default function SettingsRow({
  label,
  value,
  showChevron = false,
  danger = false,
  onPress,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
    >
      <Text
        style={[
          styles.label,
          danger && { color: "#FF4D4D" },
        ]}
      >
        {label}
      </Text>

      <View style={styles.right}>
        {value && (
          <Text style={styles.value}>{value}</Text>
        )}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  value: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
