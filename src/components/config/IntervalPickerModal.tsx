import { View, Text, StyleSheet, Pressable } from "react-native";
import React, { useState, useEffect } from "react";
import { colors } from "../../constants/colors";

const INTERVAL_OPTIONS = [15, 30, 45, 60];

type IntervalPickerProps = {

  initialInterval: number;

  onSave: (interval: number) => void;
};


export default function IntervalPicker({
  initialInterval,
  onSave,
}: IntervalPickerProps) {

  const [selected, setSelected] = useState(initialInterval);

  useEffect(() => {
    setSelected(initialInterval);
  }, [initialInterval]);

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />

      <Text style={styles.title}>Interval Length</Text>

      <View style={styles.options}>
        {INTERVAL_OPTIONS.map(option => {
          const isActive = option === selected;

          return (
            <Pressable
              key={option}
              onPress={() => setSelected(option)}
              style={[
                styles.option,
                isActive && styles.optionActive,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isActive && styles.optionTextActive,
                ]}
              >
                {option} minutes
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={() => onSave(selected)}
      >
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#F7F7F7",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCC",
    alignSelf: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },

  options: {
    gap: 12,
  },

  option: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },

  optionActive: {
    backgroundColor: colors.accent,
  },

  optionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },

  optionTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },

  saveButton: {
    backgroundColor: "#18C964",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },

  saveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
