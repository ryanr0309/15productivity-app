import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { AntDesign } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import { preloadOnboardingAssets } from "../../lib/preloadOnboardingAssets";

export default function Welcome() {
  const router = useRouter();
  const extra = Constants.expoConfig?.extra;
  const [showModal, setShowModal] = useState(false);

  const [_, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  async function handleGetStarted() {

  await preloadOnboardingAssets();
  router.push("/(onboarding)");
}
  async function handlePostLogin(userId: string) {
    const { data: userRow } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    setShowModal(false);

    if (!userRow || userRow.onboarding_completed !== true) {
      router.replace("/(onboarding)");
      return;
    }

    router.replace("/(protected)");
  }

  useEffect(() => {
    (async () => {
      if (googleResponse?.type !== "success") return;
      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) return;

      const { data } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (!data?.user) return;
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

    if (!credential.identityToken) return;

    const { data } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });

    if (!data?.user) return;
    await handlePostLogin(data.user.id);
  }

  const player = useVideoPlayer(
    require("../../assets/animations/intro.mp4"),
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* BACKGROUND VIDEO */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
   
        pointerEvents="none"
      />

      {/* BOTTOM GRADIENT FADE */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(0,0,0,0)",
          "rgba(7,11,23,0.85)",
          "#070B17",
        ]}
        style={styles.bottomFade}
      />

      {/* BOTTOM CONTENT */}
      <View style={styles.bottomContent}>
        <Text style={styles.title}>Master your time.</Text>

        <Text style={styles.subtitle}>
          Track, analyze, and improve in 15-minute blocks.
        </Text>

        <View style={styles.ctaStack}>
          <Pressable
            style={styles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Pressable onPress={() => setShowModal(true)}>
            <Text style={styles.signInText}>
              Already have an account? Sign In
            </Text>
          </Pressable>
        </View>
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
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            }
            cornerRadius={8}
            style={{ width: "100%", height: 48 }}
            onPress={handleApple}
          />



          <Pressable onPress={() => setShowModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070B17",
  },

  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "35%",
  },

  bottomContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "30%",
    paddingHorizontal: 28,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    maxWidth: 320,
  },

  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    maxWidth: 300,
  },

  ctaStack: {
    width: "100%",
    gap: 16,
    marginTop: 24,
  },

  primaryButton: {
    height: 52,
    borderRadius: 30,
    backgroundColor: "#2563EB", // ✅ stronger CTA
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  signInText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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
    fontSize: 15,
    color: "#5E5E5E",
  },
});
