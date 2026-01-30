import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Purchases from "react-native-purchases";
import { colors } from "../../../constants/colors";
import { supabase } from "../../../lib/supabase";
import { router } from "expo-router";
import NotificationsModal from "../../../components/settings/NotificationsModal";


/* ===================== ROW ===================== */

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? "#FF5A5F" : "#FFFFFF"}
        style={{ marginRight: 12 }}
      />

      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.rowTitle,
            danger && { color: "#FF5A5F" },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color="rgba(255,255,255,0.35)"
      />
    </TouchableOpacity>
  );
}

/* ===================== SECTION ===================== */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}


/* ===================== SCREEN ===================== */

export default function Settings() {
  const [showNotifications, setShowNotifications] = React.useState(false);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
          <View style={styles.header}>
                                 <View style={styles.brandLeft}>
                         
                  <Image
                    source={require("../../../assets/images/fifteen.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                
                
                                   <Text style={styles.brandText}>15 Productivity</Text>
                                 </View>
                                </View>

        {/* ===================== PREFERENCES ===================== */}
        <Section title="Preferences">
          <SettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Daily reminders & alerts"
            onPress={() => {
  setShowNotifications(true);
}}

          />
        </Section>


        {/* ===================== SUBSCRIPTION ===================== */}
        <Section title="Subscription & Billing">
          <SettingsRow
            icon="star-outline"
            title="Manage Subscription"
            subtitle="View or cancel your plan"
            onPress={() =>
              Linking.openURL(
                "https://apps.apple.com/account/subscriptions"
              )
            }
          />
          <SettingsRow
            icon="refresh-outline"
            title="Restore Purchases"
            subtitle="Recover previous subscriptions"
            onPress={async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();

    const isActive =
      customerInfo.entitlements.active["Fifteen Pro"];

    if (isActive) {
      Alert.alert(
        "Restored",
        "Your subscription has been successfully restored."
      );
    } else {
      Alert.alert(
        "No Subscription Found",
        "We couldn’t find an active subscription to restore."
      );
    }
  } catch (e) {
    Alert.alert(
      "Restore Failed",
      "Something went wrong while restoring purchases."
    );
  }
}}

          />
        </Section>

        {/* ===================== SUPPORT ===================== */}
        <Section title="Support">
          <SettingsRow
            icon="mail-outline"
            title="Contact Support"
            subtitle="Get help or report an issue"
            onPress={() =>
              Linking.openURL("ryanthony2007@gmail.com")
            }
          />
          <SettingsRow
            icon="bulb-outline"
            title="Feature Requests"
            subtitle="Suggest improvements"
            onPress={() =>
              Linking.openURL("ryanthony2007@gmail.com")
            }
          />
        </Section>

        {/* ===================== LEGAL ===================== */}
        <Section title="Legal">
          <SettingsRow
            icon="document-text-outline"
            title="Privacy Policy"
            onPress={() =>
              Linking.openURL("https://docs.google.com/document/d/e/2PACX-1vRYS59Wa2jxrQHTF8cAn7gcjlvQqtatxv3Bqr_3FzgyPqaaxG4rVijCkQh78b1FZ0S54ghgQMIaD-hW/pub")
            }
          />
          <SettingsRow
            icon="document-outline"
            title="Terms of Service"
            onPress={() =>
              Linking.openURL("https://docs.google.com/document/d/e/2PACX-1vSB3VgbpuJh3FbeaWz5a2CIxXx3UIirNZmK3l0l6V_bP4Ikil0TRWW0n-dPC2Cgx3gEel81km8ugidv/pub")
            }
          />
        </Section>

        {/* ===================== ACCOUNT ===================== */}
        <Section title="Account">
          <SettingsRow
            icon="log-out-outline"
            title="Log Out"
            onPress={async () => {
              await supabase.auth.signOut();
            }}
          />

          <SettingsRow
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently remove your data"
            danger
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "This will permanently delete your data. Your subscription will continue until canceled in Apple Settings.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
  console.log("Deleting account...");
  const session = await supabase.auth.getSession();

  await fetch(
    "https://jwbbftmmtoukqgjaefaa.supabase.co/functions/v1/delete-account",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.data.session?.access_token}`,
      },
    }
  );

  await supabase.auth.signOut();
}

                  },
                ]
              );
            }}
          />
        </Section>
      </ScrollView>
      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </SafeAreaView>
     
    
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 4,
  },
header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  
  headerText: { color: "#EAEAF0", fontSize: 18, fontWeight: "600" },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  
brandLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

logoImage: {
  width: 24,
  height: 24,
  borderRadius: 4
},

brandText: {
  color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
},
});
