// app/paywall/TrialExplainer.tsx
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

export default function TrialExplainerScreen() {
  const router = useRouter();
  const { loading, isActive } = useBilling();

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

  const goToPaywall = () => {
    // Your existing paywall index.tsx handles calling RevenueCat
    router.push("/paywall");
  };

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      {/* Progress bar (step 2 of 3) */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= 1 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>3-Day Free Trial</Text>

        <Text style={styles.title}>
          Start your 3-day free trial. Cancel anytime.
        </Text>

        <Text style={styles.subtitle}>
          We’ll remind you before your trial ends. If you cancel in time,
          you won’t be charged.
        </Text>

        <View style={styles.timelineCard}>
          <View style={styles.timelineRow}>
            <View style={[styles.timelineDot, styles.timelineDotActive]} />
            <View style={styles.timelineTextWrap}>
              <Text style={styles.timelineTitle}>Today</Text>
              <Text style={styles.timelineText}>
                Unlock full access to Fifteen Pro for free.
              </Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineRow}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineTextWrap}>
              <Text style={styles.timelineTitle}>Day 2</Text>
              <Text style={styles.timelineText}>
                We’ll remind you your trial ends soon.
              </Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineRow}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineTextWrap}>
              <Text style={styles.timelineTitle}>Day 3</Text>
              <Text style={styles.timelineText}>
                Trial ends. Your annual plan starts at a low yearly price.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Recommended</Text>
          <Text style={styles.priceMain}>Annual plan · 3-day free trial</Text>
          <Text style={styles.priceSub}>
            Best value. Less than the price of one coffee per month.
          </Text>
        </View>

        <Text style={styles.smallNote}>
          You can cancel anytime in your App Store or Google Play settings.
        </Text>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          style={styles.primaryButton}
          onPress={goToPaywall}
        >
          <Text style={styles.primaryButtonText}>
            Start my 3-day free trial
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/paywall/ExitPromo")}
        >
          <Text style={styles.secondaryButtonText}>Not sure yet</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  timelineCard: {
    backgroundColor: "rgba(16,22,44,0.95)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotActive: {
    backgroundColor: colors.background,
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineTitle: {
    color: "white",
    fontWeight: "600",
    marginBottom: 2,
  },
  timelineText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
  },
  timelineLine: {
    height: 18,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.18)",
    marginLeft: 4.5,
    marginVertical: 4,
  },
  priceCard: {
    backgroundColor: "rgba(10,220,170,0.07)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10,220,170,0.3)",
    marginBottom: 12,
  },
  priceLabel: {
    color: "rgba(10,220,170,0.9)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  priceMain: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  priceSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
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
