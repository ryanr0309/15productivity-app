import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { AntDesign } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import LottieView from "lottie-react-native";

export default function Welcome() {
  const router = useRouter();
  const extra = Constants.expoConfig?.extra;
  const [showModal, setShowModal] = useState(false);

  const [_, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  async function handlePostLogin(userId: string) {
  const { data: userRow } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  // Close modal before routing
  setShowModal(false);

  if (!userRow || userRow.onboarding_completed !== true) {
    router.replace("/(onboarding)");
    return;
  }

  router.replace("/(protected)");
}


  // Google response handling
  useEffect(() => {
    (async () => {
      if (googleResponse?.type !== "success") return;

      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) return;

      const { data, error } = await supabase.auth.signInWithIdToken({
  provider: "google",
  token: idToken,
});

if (error || !data?.user) return;

await handlePostLogin(data.user.id);

    })();
  }, [googleResponse]);

  async function handleApple() {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    const { identityToken } = credential;
    if (!identityToken) return;

    const { data, error } = await supabase.auth.signInWithIdToken({
  provider: "apple",
  token: identityToken,
});

if (error || !data?.user) return;

await handlePostLogin(data.user.id);

  }

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >

      <LottieView
      autoPlay
      loop={false}
      style={{ width: 250, height: 250 }}
      source={require("../../assets/animations/splash.json")}
    />

     <LottieView
      autoPlay
      loop={false}
      style={{ width: 250, height: 250 }}
      source={require("../../assets/animations/time.json")}
    />
    
      <View style={styles.centerContent}>
        <Text style={styles.title}>Master your time.</Text>
        <Text style={styles.subtitle}>
          Track, analyze, and improve in 15-minute blocks.
        </Text>
      </View>

      

      <View style={styles.bottom}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/(onboarding)")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        <Pressable onPress={() => setShowModal(true)}>
          <Text style={styles.signInText}>Already have an account? Sign In</Text>
        </Pressable>
      </View>

      {/* LOGIN SHEET */}
      <Modal visible={showModal} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => setShowModal(false)}
          activeOpacity={1}
        />

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Sign In</Text>

          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={8}
            style={{ width: "100%", height: 48 }}
            onPress={handleApple}
          />

          <Pressable style={styles.googleButton} onPress={() => promptGoogle()}>
            <AntDesign name="google" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Pressable onPress={() => setShowModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 120,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  centerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    maxWidth: 300,
  },
  bottom: {
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 30,
    backgroundColor: "#1B2238",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  signInText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
  },

  // Sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    padding: 22,
    paddingBottom: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    height: 48,
    borderRadius: 8,
  },
  googleText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cancelText: {
    textAlign: "center",
    marginTop: 4,
    fontSize: 15,
    color: "#5E5E5E",
  },
});
