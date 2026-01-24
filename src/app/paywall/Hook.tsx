// app/paywall/Hook.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors } from "../../constants/colors";
import { useBilling } from "../../providers/BillingProvider";

const { width } = Dimensions.get("window");

export default function HookScreen() {
  const router = useRouter();
  const { loading, isActive } = useBilling();

  // If somehow user already has an active entitlement, skip funnel
  useEffect(() => {
    if (!loading && isActive) {
      router.replace("/(protected)");
    }
  }, [loading, isActive, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      {/* Progress bar (step 1 of 3) */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === 0 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Free Hook</Text>

        <Text style={styles.title}>
          We’ll help you master your time in just 3 days.
        </Text>

        <Text style={styles.subtitle}>
          Fifteen tracks your day in 15-minute blocks so you can finally see
          where your time really goes — and fix it.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>With Fifteen Pro you can:</Text>
          <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>
              See exactly where every 15 minutes of your day went.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>
              Turn your habits into clear stats and streaks.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>
              Get daily and weekly productivity scores.
            </Text>
          </View>
        </View>

        <Text style={styles.smallNote}>
          Try everything free for 3 days. No commitment. Cancel anytime.
        </Text>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/paywall/TrialExplainer")}
        >
          <Text style={styles.primaryButtonText}>Try for $0.00</Text>
        </Pressable>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: "#070B17",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
  },
  progressDot: {
    height: 3,
    borderRadius: 999,
    width: width * 0.12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  progressDotActive: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  label: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 8,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "rgba(16,22,44,0.95)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
    marginTop: 7,
    marginRight: 8,
  },
  bulletText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    flex: 1,
  },
  smallNote: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 8,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#050711",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
});
