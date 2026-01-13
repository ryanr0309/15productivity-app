import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { supabase } from "../../lib/supabase";

import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";


WebBrowser.maybeCompleteAuthSession();



export default function SignInScreen() {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const router = useRouter();

  const redirectUri = Linking.createURL("auth/callback");

  // ---------------------------
  // GOOGLE (unchanged)
  // ---------------------------
  async function handleGoogle() {
    try {
      setLoading("google");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri },
      });

      if (error) {
        console.log("Google OAuth error:", error);
        return;
      }

      const authUrl = data?.url;
      if (!authUrl) return;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success" && result.url) {
        const { data: sessionData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(result.url);

        if (exchangeError) {
          console.log("Session exchange error:", exchangeError);
          return;
        }

        if (sessionData.session) {
          console.log("SIGNED IN:", sessionData.session.user.id);
          router.replace("/(tabs)");
        }
      }
    } finally {
      setLoading(null);
    }
  }

  // ---------------------------
  // APPLE (NATIVE FLOW)
  // ---------------------------
async function logOut(){
  await supabase.auth.signOut();

}
async function handleApple() {
  console.log("🍏 Apple Sign-In started");

  setLoading("apple");

  try {
    // STEP 1 — Native Apple Auth
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log("🍏 Apple credential:", credential);

    if (!credential.identityToken) {
      console.log("❌ Apple missing identityToken");
      return;
    }

    if (!credential.authorizationCode) {
      console.log("❌ Apple missing authorizationCode");
      return;
    }

    // STEP 2 — Ensure deterministic email for linking
    let email = credential.email ?? `${credential.user}@apple.local`;
    console.log("📧 Apple email used:", email);

    // STEP 3 — Check if Supabase user already logged in (manual link case)
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("🟦 Existing Supabase session:", sessionData?.session);

    if (sessionData?.session) {
      console.log("🔗 Linking Apple identity to existing user");

      const { data: linkData, error: linkError } = await supabase.auth.linkIdentity({
        provider: "apple",
        token: credential.identityToken,
        access_token: credential.authorizationCode,
      });

      console.log("🔗 linkIdentity data:", linkData);
      console.log("🔗 linkIdentity error:", linkError);

      return;
    }

    // STEP 4 — Provision user (first time Apple login)
    console.log("🆕 Provisioning new Apple user via signInWithIdToken");

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      access_token: credential.authorizationCode,
    });

    console.log("🆕 signInWithIdToken data:", data);
    console.log("🆕 signInWithIdToken error:", error);

    // STEP 5 — Check if session was established
    const { data: newSession } = await supabase.auth.getSession();
    console.log("🔐 Session after provisioning:", newSession?.session);
    console.log(newSession?.session?.user);


    if (!newSession?.session) {
      console.log("⚠️ No session after signIn — likely auto-linking prevented provisioning");
      return;
    }

    // STEP 6 — Navigate to Paywall or Profile Setup
    console.log("🚀 Apple Sign-In success:", newSession.session.user.id);
    router.replace("/paywall");

  } catch (e: any) {
    if (e.code === "ERR_REQUEST_CANCELED") {
      console.log("🚫 Apple Sign-In cancelled");
    } else {
      console.log("❌ Apple Sign-In error:", e);
    }
  } finally {
    setLoading(null);
  }
}







  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.sub}>Sign in to continue</Text>

      {/* APPLE */}

<AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
  cornerRadius={8}
  style={{ width: "100%", height: 50 }}
  onPress={handleApple}
/>


      {/* GOOGLE */}
      <Pressable
        style={styles.oauthBtn}
        onPress={handleGoogle}
        disabled={loading !== null}
      >
        <Text style={styles.oauthText}>
          {loading === "google" ? "Signing in..." : "Continue with Google"}
        </Text>
      </Pressable>

      <Pressable style={styles.oauthBtn} onPress={logOut}>
        <Text>Log Out</Text>
      </Pressable>

      {loading && (
        <ActivityIndicator color="white" style={{ marginTop: 20 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    color: "white",
    fontWeight: "700",
    marginBottom: 6,
  },
  sub: {
    color: "#999",
    marginBottom: 40,
    fontSize: 16,
  },
  oauthBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#1E1E1E",
    marginBottom: 12,
    alignItems: "center",
  },
  oauthText: {
    color: "white",
    fontSize: 16,
  },
});
