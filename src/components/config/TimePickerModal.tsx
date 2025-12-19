import { View, Text, StyleSheet, Pressable } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../../constants/colors";
import { useState } from "react";
import React from "react";

type Props = {
  title: string;
  initialTime: Date;
  onSave: (time: Date) => void;
};


export default function TimePickerModal({
  title,
  initialTime,
  onSave,
}: Props) {
  const [time, setTime] = useState(initialTime);

  return (

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>{title}</Text>

        <DateTimePicker
          value={time}
          mode="time"
          display="spinner" // 👈 THIS IS THE WHEEL
          onChange={(_, selectedTime) => {
            if (selectedTime) setTime(selectedTime);
          }}
          textColor="#000"
        />

        <Pressable
          style={styles.saveButton}
          onPress={() => onSave(time)}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },

  sheet: {
    backgroundColor: "#F7F7F7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    textAlign: "center",
    marginBottom: 12,
  },

  saveButton: {
    backgroundColor: "#18C964",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  saveText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
