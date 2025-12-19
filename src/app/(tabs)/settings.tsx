import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import SettingsRow from "../../components/settings/SettingsRow";
import React from "react";

export default function Settings() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* HEADER */}
      <Text style={styles.header}>15 Productivity</Text>

      {/* DAILY STRUCTURE */}
      <Text style={styles.sectionTitle}>Daily Structure 📅</Text>
      <SettingsRow label="Default Wake Up Time" value="8:00 AM" />
      <SettingsRow label="Default Sleep Time" value="10:00 PM" />
      <SettingsRow label="Interval Length" value="15 mins" />

      {/* NOTIFICATIONS */}
      <Text style={styles.sectionTitle}>Notifications 🔔</Text>
      <SettingsRow label="Log Time Block Reminders" value="ON" />
      <SettingsRow label="Start/End of Day Reminders" value="ON" />

      {/* PREFERENCES */}
      <Text style={styles.sectionTitle}>Preferences 🎨</Text>
      <SettingsRow label="Appearance" value="System" showChevron />

      {/* ABOUT */}
      <Text style={styles.sectionTitle}>About ❓</Text>
      <SettingsRow
        label="Privacy Policy / Terms of Service"
        showChevron
      />

      {/* ACCOUNT */}
      <Text style={styles.sectionTitle}>Account 👤</Text>
      <SettingsRow
        label="Subscription"
        value="Manage"
        showChevron
      />
      <SettingsRow
        label="Log Out"
        danger
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },

  header: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 20,
  },

  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
});
