import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useOnboarding } from "../../providers/OnboardingProvider";
import { CATEGORY_COLORS } from "../../constants/categoryColors";
import { useBilling } from "../../providers/BillingProvider";

WebBrowser.maybeCompleteAuthSession();

export default function SignupAuthScreen() {
  const router = useRouter();
  const { goals, categories, habits } = useOnboarding();
  const { presentPaywall } = useBilling();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const extra = Constants.expoConfig?.extra;

  const [_, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  /* ---------------- ATTACH ONBOARDING (UNCHANGED) ---------------- */

  
  async function attachOnboarding(userId: string) {
  // 🔒 fetch onboarding from DB-safe source
  const onboarding = {
    goals,
    categories,
    habits,
  };

  if (
    onboarding.goals.length === 0 &&
    onboarding.categories.length === 0 &&
    onboarding.habits.length === 0
  ) {
    console.warn("attachOnboarding called with empty state");
    return;
  }

    try {
      await supabase.from("user_settings").upsert({
        user_id: userId,
        goals: goals ?? [],
        updated_at: new Date().toISOString(),
      });

      const normalize = (s: string) => s.toLowerCase().trim();

      const { data: existingCategories } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId);

      const final = existingCategories ?? [];
      const usedColors = new Set(final.map((c) => c.color));

      function nextColor() {
        for (const c of CATEGORY_COLORS) {
          if (!usedColors.has(c)) {
            usedColors.add(c);
            return c;
          }
        }
        return CATEGORY_COLORS[0];
      }

      const normalizedExisting = new Set(final.map((c) => normalize(c.label)));
      const categoriesToInsert: any[] = [];

      for (const cat of categories) {
        const norm = normalize(cat);
        if (!normalizedExisting.has(norm)) {
          categoriesToInsert.push({
            user_id: userId,
            label: cat,
            color: nextColor(),
          });
          normalizedExisting.add(norm);
        }
      }

      if (categoriesToInsert.length > 0) {
        const { data } = await supabase
          .from("categories")
          .insert(categoriesToInsert)
          .select("*");
        final.push(...(data ?? []));
      }

      const habitsToInsert: any[] = [];

      for (const h of habits) {
        const match = final.find(
          (c) => normalize(c.label) === normalize(h)
        );

        if (match) {
          habitsToInsert.push({
            user_id: userId,
            name: h,
            color: match.color,
          });
        } else {
          const color = nextColor();
          await supabase.from("categories").insert({
            user_id: userId,
            label: h,
            color,
          });

          habitsToInsert.push({
            user_id: userId,
            name: h,
            color,
          });
        }
      }

      if (habitsToInsert.length > 0) {
        await supabase.from("habits").insert(habitsToInsert);
      }

      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });

      await supabase
  .from("users")
  .update({ onboarding_completed: true })
  .eq("id", userId);


    } catch {}
  }

  async function handlePostAuth(userId: string) {
  // Always ensure users row exists
  const { data: userRow } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  if (!userRow) {
    // first-ever signup → create row
    await supabase.from("users").insert({
      id: userId,
      onboarding_completed: false,
    });
  }

  // 🚨 onboarding data MUST exist here
  if (
    goals.length === 0 &&
    categories.length === 0 &&
    habits.length === 0
  ) {
    router.replace("/(onboarding)");
    return;
  }

  // Attach onboarding ONCE
  if (!userRow || userRow.onboarding_completed !== true) {
    await attachOnboarding(userId);
  }

  router.replace("/(protected)");
}


  /* ---------------- APPLE SIGN IN ---------------- */

  async function handleApple() {
  try {
    setLoading(true);
    setErrorMsg("");

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    if (!credential.identityToken) {
      throw new Error("Missing identity token");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });

    if (error) throw error;

    await handlePostAuth(data.user.id);
  } catch (err: any) {
    setErrorMsg(err?.message || "Apple sign-in failed");
  } finally {
    setLoading(false);
  }
}


  /* ---------------- GOOGLE SIGN IN ---------------- */

  async function handleGoogle() {
    try {
      setLoading(true);
      setErrorMsg("");
      await promptGoogle();
    } catch {
      setErrorMsg("Google sign-in failed");
      setLoading(false);
    }
  }

useEffect(() => {
  (async () => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) return;

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      await handlePostAuth(data.user.id);
    }
  })();
}, [googleResponse]);


  /* ---------------- UI ---------------- */

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.sub}>
          Save your goals, habits, and progress across devices.
        </Text>

        {loading && (
          <ActivityIndicator
            color="#FFFFFF"
            style={{ marginVertical: 20 }}
          />
        )}

        <View style={styles.buttonStack}>
          <Pressable
            style={[styles.authButton, styles.apple]}
            onPress={handleApple}
            disabled={loading}
          >
            <Text style={styles.appleText}>Continue with Apple</Text>
          </Pressable>

          <Pressable
            style={[styles.authButton, styles.google]}
            onPress={handleGoogle}
            disabled={loading}
          >
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>
        </View>

        {errorMsg !== "" && (
          <Text style={styles.error}>{errorMsg}</Text>
        )}

        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.existing}>
            Already have an account? Sign in
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  sub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },

  buttonStack: {
    gap: 14,
    marginBottom: 24,
  },

  authButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  apple: {
    backgroundColor: "#FFFFFF",
  },

  google: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  appleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
  },

  googleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  existing: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    textAlign: "center",
    marginTop: 20,
  },

  error: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 14,
    fontSize: 14,
  },
});
