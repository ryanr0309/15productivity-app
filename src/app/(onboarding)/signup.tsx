import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useOnboarding } from "../../providers/OnboardingProvider";
import { CATEGORY_COLORS } from "../../constants/categoryColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignupAuthScreen() {
  const router = useRouter();
  const { goals, categories, habits } = useOnboarding();
  console.log(goals, categories, habits)

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const extra = Constants.expoConfig?.extra;

  const [_, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

async function attachOnboarding(userId: string) {
  try {
    // 1) goals → user_settings
    const { data, error } = await supabase
  .from("user_settings")
  .upsert({
    user_id: userId,
    goals: goals ?? [],
    updated_at: new Date().toISOString(),
  })
  .select("*");

console.log("UPSET_GOALS:", { data, error });
    // 2) normalize helper
    const normalize = (s: string) =>
      s.toLowerCase().trim();

    // 3) fetch existing categories
    const { data: existingCategories } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId);

    const final = existingCategories ?? [];

    // 4) color allocator
    const usedColors = new Set(final.map(c => c.color));

    function nextColor() {
      for (const c of CATEGORY_COLORS) {
        if (!usedColors.has(c)) {
          usedColors.add(c);
          return c;
        }
      }
      // fallback wrap
      const c = CATEGORY_COLORS[0];
      usedColors.add(c);
      return c;
    }

    // 5) insert primary categories
    const normalizedExisting = new Set(final.map(c => normalize(c.label)));

    const categoriesToInsert = [];

    for (const cat of categories) {
      const norm = normalize(cat);
      if (!normalizedExisting.has(norm)) {
        const color = nextColor();
        categoriesToInsert.push({ user_id: userId, label: cat, color });
        normalizedExisting.add(norm);
        final.push({ label: cat, color });
      }
    }

    let insertedCategories = [];
    if (categoriesToInsert.length > 0) {
      const { data } = await supabase
        .from("categories")
        .insert(categoriesToInsert)
        .select("*");
      insertedCategories = data ?? [];
      final.push(...insertedCategories);
    }

    // 6) insert habits w/ pairing
    const habitsToInsert = [];

    for (const h of habits) {
      const normH = normalize(h);
      const match = final.find(c => normalize(c.label) === normH);

      if (match) {
        // matched category → adopt color
        habitsToInsert.push({
          user_id: userId,
          name: h,
          color: match.color,
        });
      } else {
        // no match → create both
        const color = nextColor();
        const newCat = {
          user_id: userId,
          label: h,
          color,
        };

        final.push(newCat);
        habitsToInsert.push({
          user_id: userId,
          name: h,
          color,
        });

        await supabase.from("categories").insert(newCat);
      }
    }

    if (habitsToInsert.length > 0) {
      await supabase.from("habits").insert(habitsToInsert);
    }

    // 7) onboarding flag
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });

    // 8) redirect
    router.replace("/paywall");
  } catch (err) {
    console.log("ATTACH ERROR:", err);
  }
}



  // 🍏 APPLE SIGN-IN
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

      const { identityToken } = credential;
      if (!identityToken) throw new Error("Missing identity token");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      });

      if (error) throw error;

      await attachOnboarding(data.user.id);
    } catch (err: any) {
      console.log(err);
      setErrorMsg(err?.message || "Apple sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  // 🔵 GOOGLE SIGN-IN
  async function handleGoogle() {
    try {
      setLoading(true);
      setErrorMsg("");
      await promptGoogle();
    } catch (err: any) {
      console.log(err);
      setErrorMsg("Google sign-in failed");
      setLoading(false);
    }
  }

  // Google Auth handler
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

        await attachOnboarding(data.user.id);
      }
    })();
  }, [googleResponse]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your 15 Account</Text>
      <Text style={styles.sub}>
        Save your onboarding so your goals and habits sync across devices.
      </Text>

      {loading && <ActivityIndicator style={{ marginVertical: 20 }} />}

      <View style={styles.buttonStack}>
        <Pressable style={styles.apple} onPress={handleApple} disabled={loading}>
          <Text style={styles.btnText}>Continue with Apple</Text>
        </Pressable>

        <Pressable
          style={styles.google}
          onPress={handleGoogle}
          disabled={loading}
        >
          <Text style={styles.btnText}>Continue with Google</Text>
        </Pressable>
      </View>

      {errorMsg !== "" && <Text style={styles.error}>{errorMsg}</Text>}

      <Pressable onPress={() => router.push("/login")}>
        <Text style={styles.existing}>Already have an account? Sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
  },
  buttonStack: {
    gap: 14,
    marginBottom: 18,
  },
  apple: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
  },
  google: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnText: {
    textAlign: "center",
    fontWeight: "600",
  },
  existing: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
    marginTop: 24,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
});
