// app/paywall/ExitPromo.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors } from "../../constants/colors";
import { useBilling } from "../../providers/BillingProvider";

const { width } = Dimensions.get("window");

export default function ExitPromoScreen() {
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

  const goToDiscountedPaywall = () => {
    // For now this just routes to your existing paywall.
    // If you add a special discounted offering in RC, you can handle it inside index.tsx.
    router.push("/paywall");
  };

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      {/* Progress bar (step 3 of 3) */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>One-time offer</Text>

        <Text style={styles.title}>
          Get your best year of focus at a lower price.
        </Text>

        <Text style={styles.subtitle}>
          Because you made it this far, you unlock a limited discount on your
          first year of Fifteen Pro.
        </Text>

        <View style={styles.discountCard}>
          <Text style={styles.discountBadge}>Limited time</Text>
          <Text style={styles.discountHeadline}>
            Save 20% on the annual plan
          </Text>
          <Text style={styles.discountSub}>
            3-day free trial · then annual billing at a lower locked-in rate.
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceOld}>$59.99</Text>
            <Text style={styles.priceNew}>$47.99 / year</Text>
          </View>

          <Text style={styles.discountFootnote}>
            Prices are example values — match these to your store pricing.
          </Text>
        </View>

        <Text style={styles.smallNote}>
          You won’t be charged today. Cancel anytime before the trial ends.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={styles.primaryButton}
          onPress={goToDiscountedPaywall}
        >
          <Text style={styles.primaryButtonText}>
            Claim my discounted trial
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>
            No thanks, maybe later
          </Text>
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
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
  discountCard: {
    backgroundColor: "rgba(22, 29, 60, 0.96)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  discountBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 199, 92, 0.2)",
    color: "#FFD36B",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  discountHeadline: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  discountSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  priceOld: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  priceNew: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  discountFootnote: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 4,
  },
  smallNote: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 16,
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
