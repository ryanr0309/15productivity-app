import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import LogoutButton from "../../components/auth/LogoutButton";

export default function LoginScreen() {
  const router = useRouter();
  const extra = Constants.expoConfig?.extra;

  const [_, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  async function finalizeLogin() {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) return;



    // paywall check later
    router.replace("/(protected)");
  }

  // Google Response Handler
  useEffect(() => {
    (async () => {
      if (googleResponse?.type !== "success") return;

      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) return;

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (!error) {
        await finalizeLogin();
      }
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

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
    });


    if (!error) {
      await finalizeLogin();
    }
  }

  return (
  <View style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>Login</Text>

      <Pressable style={styles.apple} onPress={handleApple}>
        <Text style={styles.btnText}>Continue with Apple</Text>
      </Pressable>

      <Pressable style={styles.google} onPress={() => promptGoogle()}>
        <Text style={styles.btnText}>Continue with Google</Text>
      </Pressable>
      <LogoutButton/>
    </View>
  </View>
);


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1224", // optional for 15 aesthetic
    justifyContent: "center",   // vertical center
    alignItems: "center",       // horizontal center
    paddingHorizontal: 24,
  },

  content: {
    width: "100%",              // buttons stretch to device width
    maxWidth: 360,              // keeps it elegant
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
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  google: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  btnText: {
    fontWeight: "600",
    color: "white",
  },
});
