import React from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import * as Notifications from "expo-notifications";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";

const { width } = Dimensions.get("window");

type Props = {
  step: number;
  onDone: () => void; // parent advances ONLY after decision
  onBack?: () => void;
};

export default function NotificationsOnboarding({
  step=11,
  onDone,
  onBack
}: Props) {
  async function handleEnable() {
    const { status, canAskAgain } =
    await Notifications.requestPermissionsAsync();

    console.log("Notification status:", status, canAskAgain);


    const user = (await supabase.auth.getUser()).data.user;

    if (user) {
      await supabase
        .from("user_settings")
        .update({
          notifications_enabled: status === "granted",
        })
        .eq("user_id", user.id);
    }

    // ✅ advance ONLY after permission flow completes
    onDone();
  }

  async function handleSkip() {
    const user = (await supabase.auth.getUser()).data.user;

    if (user) {
      await supabase
        .from("user_settings")
        .update({ notifications_enabled: false })
        .eq("user_id", user.id);
    }

    // ✅ advance ONLY after explicit skip
    onDone();
  }

  return (
    <LinearGradient
          colors={["#050816", colors.background ?? "#0B1224", "#111827"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >

{/* BACK BUTTON */}
{/* HEADER */}
<View style={styles.headerRow}>
  {/* Back */}
  <View style={styles.backSlot}>
  
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => [
          styles.backButton,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Ionicons name="chevron-back" size={26} color="#FFF" />
      </Pressable>
 
  </View>

  {/* Progress */}
  <View style={styles.progressContainer}>
    {Array.from({ length: 11 }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.progressDot,
          i + 1 <= step && styles.activeDot,
        ]}
      />
    ))}
  </View>

  {/* Right spacer (keeps progress centered) */}
 
</View>
      {/* Content */}
      <View style={styles.content}>
        <LottieView
          autoPlay
          loop={false}
          style={styles.lottie}
          source={require("../../assets/animations/Notifications.json")}
        />

        <Text style={styles.title}>Stay on track</Text>

        <Text style={styles.subtitle}>
          Get two gentle reminders a day. One in the morning to start your day and once to remind you to close your day near sleep time.
        </Text>

        <Pressable style={styles.primaryButton} onPress={handleEnable}>
          <Text style={styles.primaryText}>Enable notifications</Text>
        </Pressable>

        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>Maybe later</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: "#070B17",
    justifyContent: "space-between",
  },



  progressDot: {
    width: width * 0.055,
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
  },

  /* Main content */
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 120,
  },

  lottie: {
    width: 220,
    height: 220,
    marginBottom: 8,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: width * 0.82,
    marginBottom: 36,
  },

  primaryButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  primaryText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
  },

  skipText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
  },
  headerRow: {
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  marginBottom: 16,
},

backSlot: {
  width: 44,
  alignItems: "flex-start",
},

backButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: "center",
  alignItems: "center",
},

backArrow: {
  fontSize: 28,
  color: "#FFF",
  fontWeight: "400",
},

progressContainer: {
  flexDirection: "row",
  gap: 6,
},

});
