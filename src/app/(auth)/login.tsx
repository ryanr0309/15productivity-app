import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import LogoutButton from "../../components/auth/LogoutButton";

export default function LoginScreen() {
  console.log("LoginScreen rendered");

  const router = useRouter();
  const extra = Constants.expoConfig?.extra;

  const [_, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  /* ---------------- POST-LOGIN ROUTER ---------------- */

async function handlePostLogin(userId: string) {


  const { data: userRow } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

     Alert.alert("PostLogin", JSON.stringify(userRow));
  console.log("login routing:", userRow);

  if (!userRow || userRow.onboarding_completed !== true) {
    router.replace("/(onboarding)");
    return;
  }

  router.replace("/(tabs)");
}



  /* ---------------- GOOGLE LOGIN ---------------- */

  useEffect(() => {
    (async () => {
      if (googleResponse?.type !== "success") return;

      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) return;

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error || !data?.user) {
        console.error("Google sign-in failed", error);
        return;
      }

      await handlePostLogin(data.user.id);
    })();
  }, [googleResponse]);

  /* ---------------- APPLE LOGIN ---------------- */

  async function handleApple() {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    if (!credential.identityToken) return;

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });

    if (error || !data?.user) {
      console.error("Apple sign-in failed", error);
      return;
    }

    await handlePostLogin(data.user.id);
  }

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>

        <Pressable style={styles.apple} onPress={handleApple}>
          <Text style={styles.appleText}>Continue with Apple</Text>
        </Pressable>

        <Pressable style={styles.google} onPress={() => promptGoogle()}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>

        <LogoutButton />
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1224",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  content: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 16,
  },

  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
  },

  apple: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  google: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  appleText: {
    fontWeight: "600",
    color: "#000000",
  },

  googleText: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
