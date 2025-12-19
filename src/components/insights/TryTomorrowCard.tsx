import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import React from "react";

type TryTomorrowCardProps = {
  items: string[];
};

export default function TryTomorrowCard({ items }: TryTomorrowCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>3 Things to Try Tomorrow</Text>

      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <Ionicons
            name="star"
            size={14}
            color={colors.accent}
            style={styles.icon}
          />
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, // rgba(0,0,0,0.5)
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  icon: {
    marginTop: 2,
    marginRight: 10,
  },

  text: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
