import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Linking,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { reconcileNotifications } from "../../lib/reconcileNotifications";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type PermissionStatus = "granted" | "denied" | "undetermined";

export default function NotificationsModal({ visible, onClose }: Props) {
  const { userId } = useAuth();

  const [permission, setPermission] =
    useState<PermissionStatus>("undetermined");

  const [prefs, setPrefs] = useState({
  notify_morning: true,
  notify_afternoon: true, // ✅ NEW
  notify_night: true,
});


  /* ===================== LOAD PERMISSION ===================== */

  useEffect(() => {
    if (!visible) return;

    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermission(status as PermissionStatus);
    });
  }, [visible]);

  /* ===================== LOAD PREFS ===================== */

  useEffect(() => {
    if (!visible || !userId) return;

    supabase
  .from("user_settings")
  .select("notify_morning, notify_afternoon, notify_night")
  .eq("user_id", userId)
  .single()
  .then(({ data }) => {
    if (data) setPrefs(data);
  });

  }, [visible, userId]);

  /* ===================== ACTIONS ===================== */

  const requestPermission = async () => {
    const result = await Notifications.requestPermissionsAsync();
    setPermission(result.status as PermissionStatus);
  };

const updatePref = async (
  key: "notify_morning" | "notify_afternoon" | "notify_night",
  value: boolean
) => {

  const next = { ...prefs, [key]: value };
  setPrefs(next);

  await supabase
    .from("user_settings")
    .update({ [key]: value })
    .eq("user_id", userId);

  await reconcileNotifications({
  notifyMorning: next.notify_morning,
  notifyAfternoon: next.notify_afternoon,
  notifyNight: next.notify_night,
});


  console.log(
  "[NotificationsModal] scheduled notifications:",
  await Notifications.getAllScheduledNotificationsAsync()
);

};

  const notificationsDisabled =
    permission === "denied" || permission === "undetermined";

  /* ===================== RENDER ===================== */

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* HEADER */}
          <View style={styles.header}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.headerText}>Notifications</Text>
          </View>

          {/* DESCRIPTION */}
          <Text style={styles.description}>
            Get reminders to start your day and reflect at night.
          </Text>

          {/* ===================== iOS PERMISSION NOTICE ===================== */}
          {permission !== "granted" && (
            <View style={styles.notice}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.noticeText}>
                Notifications are currently disabled at the iOS level.
              </Text>
            </View>
          )}

          {/* ===================== UNDETERMINED ===================== */}
          {permission === "undetermined" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermission}
            >
              <Text style={styles.primaryButtonText}>
                Enable Notifications
              </Text>
            </TouchableOpacity>
          )}

          {/* ===================== DENIED ===================== */}
          {permission === "denied" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.primaryButtonText}>
                Open iOS Settings
              </Text>
            </TouchableOpacity>
          )}

          {/* ===================== TOGGLES ===================== */}
          <View
            style={[
              styles.toggleSection,
              notificationsDisabled && { opacity: 0.45 },
            ]}
          >
            <View style={styles.row}>
              <Text style={styles.label}>Morning reminder</Text>
              <Switch
                value={prefs.notify_morning}
                disabled={notificationsDisabled}
                onValueChange={(v) =>
                  updatePref("notify_morning", v)
                }
              
              />
            </View>

<View style={styles.row}>
  <Text style={styles.label}>Afternoon check-in</Text>
  <Switch
    value={prefs.notify_afternoon}
    disabled={notificationsDisabled}
    onValueChange={(v) =>
      updatePref("notify_afternoon", v)
    }
  />
</View>

            <View style={styles.row}>
              <Text style={styles.label}>Night reflection</Text>
              <Switch
                value={prefs.notify_night}
                disabled={notificationsDisabled}
                onValueChange={(v) =>
                  updatePref("notify_night", v)
                }
              />
            </View>
          </View>

          {/* HELPER */}
          {permission === "granted" &&
            !prefs.notify_morning &&
            !prefs.notify_night && (
              <Text style={styles.helper}>
                You won’t receive reminders unless at least one option
                is enabled.
              </Text>
            )}

          {/* DONE */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onClose}
          >
            <Text style={styles.secondaryButtonText}>Done</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Notification permissions are managed in iOS Settings.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  noticeText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },
  toggleSection: {
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  helper: {
    marginTop: 4,
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    marginTop: 12,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    textAlign: "center",
  },
});
