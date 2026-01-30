import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";

import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { useOnboarding } from "../../providers/OnboardingProvider";
import { CATEGORY_COLORS } from "../../constants/categoryColors";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onBack: () => void;
  onSuccess: () => void;
};

export default function SignupAuthScreen({ onBack, onSuccess }: Props) {
  const router = useRouter();
  const { goals, categories, habits } = useOnboarding();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ───────────────── HELPERS ───────────────── */

  const normalize = (s: string) => s.toLowerCase().trim();

  const stripEmoji = (s: string) =>
    s.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g,
      ""
    ).trim();

  /* ───────────────── ATTACH ONBOARDING ───────────────── */

 async function attachOnboarding(userId: string) {
  if (habits.length === 0) {
    console.warn("No habits selected — skipping onboarding attach");
    return;
  }

  const normalize = (s: string) => s.toLowerCase().trim();

  const stripEmoji = (s: string) =>
    s.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g,
      ""
    ).trim();

  try {
    /* ---------- USER SETTINGS ---------- */
    await supabase.from("user_settings").upsert({
      user_id: userId,
      goals,
      updated_at: new Date().toISOString(),
    });

    /* ---------- EXISTING CATEGORIES ---------- */
    const { data: existingCategories, error: fetchErr } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId);

    if (fetchErr) throw fetchErr;

    const categoryMap = new Map<string, any>();
    const usedColors = new Set<string>();

    (existingCategories ?? []).forEach(c => {
      categoryMap.set(normalize(c.label), c);
      if (c.color) usedColors.add(c.color);
    });

    const nextColor = () => {
      for (const c of CATEGORY_COLORS) {
        if (!usedColors.has(c)) {
          usedColors.add(c);
          return c;
        }
      }
      return CATEGORY_COLORS[0];
    };

    /* ---------- NORMALIZE HABITS (SAFE) ---------- */
    const normalizedHabits = habits.map(h => {
      if (typeof h === "string") {
        return {
          label: stripEmoji(h),
          color: nextColor(),
        };
      }
      return {
        label: stripEmoji(h.label),
        color: h.color ?? nextColor(),
      };
    });

    /* ---------- EXPLICIT CATEGORIES ---------- */
    const explicitCategoryRows = categories
      .map(stripEmoji)
      .filter(label => !categoryMap.has(normalize(label)))
      .map(label => ({
        user_id: userId,
        label,
        color: nextColor(),
        origin: "manual",
      }));

    /* ---------- HABIT-DERIVED CATEGORIES ---------- */
    const habitCategoryRows = normalizedHabits
      .filter(h => !categoryMap.has(normalize(h.label)))
      .map(h => ({
        user_id: userId,
        label: h.label,
        color: h.color,
        origin: "habit",
      }));

    const categoryRows = [
      ...explicitCategoryRows,
      ...habitCategoryRows,
    ];

    if (categoryRows.length > 0) {
      const { data: inserted, error: catErr } = await supabase
        .from("categories")
        .insert(categoryRows)
        .select("*");

      if (catErr) throw catErr;

      inserted?.forEach(c => {
        categoryMap.set(normalize(c.label), c);
      });
    }

    /* ---------- HABITS ---------- */
    const habitRows = normalizedHabits.map(h => {
      const category = categoryMap.get(normalize(h.label));
      if (!category) {
        throw new Error(`Missing category for habit "${h.label}"`);
      }

      return {
        user_id: userId,
        name: h.label,
        category_id: category.id,
        color: category.color,
      };
    });

    const { error: habitErr } = await supabase
      .from("habits")
      .insert(habitRows);

    if (habitErr) throw habitErr;

    /* ---------- MARK COMPLETE ---------- */
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    });

    await supabase
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", userId);

  } catch (err) {
    console.error("attachOnboarding FAILED", err);
    throw err;
  }
}


  /* ───────────────── AUTH FLOW ───────────────── */

  async function handlePostAuth(userId: string) {
    const { data: userRow } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    if (!userRow) {
      await supabase.from("users").insert({
        id: userId,
        onboarding_completed: false,
      });
    }

    if (
      goals.length === 0 &&
      categories.length === 0 &&
      habits.length === 0
    ) {
      router.replace("/(onboarding)");
      return;
    }

    if (!userRow || userRow.onboarding_completed !== true) {
      await attachOnboarding(userId);
    }

    onSuccess();
  }

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

  /* ───────────────── UI ───────────────── */

  return (
    <LinearGradient
      colors={["#050816", colors.background, "#111827"]}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Image
          source={require("../../assets/images/fifteen.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.sub}>
          Save your goals, habits, and progress across devices.
        </Text>

        {loading && <ActivityIndicator color="#FFF" />}

        <Pressable
          style={styles.appleButton}
          onPress={handleApple}
          disabled={loading}
        >
          <Ionicons name="logo-apple" size={20} color="#000" />
          <Text style={styles.appleText}>Continue with Apple</Text>
        </Pressable>

        {errorMsg !== "" && (
          <Text style={styles.error}>{errorMsg}</Text>
        )}
      </View>
    </LinearGradient>
  );
}

/* ───────────────── STYLES ───────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  headerRow: {
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 40,
  },
  appleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF",
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 20,
  },
  appleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  error: {
    marginTop: 14,
    color: "#FF6B6B",
  },
});
