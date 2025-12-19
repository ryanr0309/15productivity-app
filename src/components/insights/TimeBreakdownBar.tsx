import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import React from "react";

type TimeDistributionItem = {
  label: string;
  minutes: number;
  color: string;
};

type Props = {
  data: TimeDistributionItem[];
};

export default function TimeBreakdownBar({ data }: Props) {
  const maxMinutes = Math.max(...data.map(item => item.minutes), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where Your Time Went</Text>

      {data.map(item => {
        const widthPercent = (item.minutes / maxMinutes) * 100;

        return (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>

            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${widthPercent}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
            </View>

            <Text style={styles.value}>{formatMinutes(item.minutes)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function formatMinutes(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;

  return `${hrs}h ${mins}m`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  label: {
    width: 70,
    color: colors.textPrimary,
    fontSize: 13,
  },

  barWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },

  bar: {
    height: "100%",
    borderRadius: 4,
  },

  value: {
    width: 55,
    textAlign: "right",
    color: colors.textSecondary,
    fontSize: 12,
  },
});


