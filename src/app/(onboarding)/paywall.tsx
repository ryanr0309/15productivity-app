/**
 * app/onboarding/paywall.tsx  — Screen 14: Paywall
 *
 * Uses RevenueCat's built-in presentPaywall() — the simplest and most
 * conversion-optimised approach. RC handles all the UI, pricing display,
 * purchase flow, and restore.
 *
 * Two modes:
 *   1. presentPaywall()  — RC's full-screen paywall modal (recommended)
 *   2. Custom UI below   — fallback if RC paywall isn't configured in dashboard
 *
 * Setup:
 *   npm install react-native-purchases react-native-purchases-ui
 *   npx pod-install
 *
 * In app/_layout.tsx bootstrap:
 *   import Purchases from 'react-native-purchases';
 *   Purchases.configure({ apiKey: 'appl_XXXX' });
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
  Alert, ActivityIndicator, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

// ── YOUR IDs — set these in RevenueCat dashboard ──────────────────────────────
const RC_ENTITLEMENT_ID = 'Fifteen Pro';

const { width: SW } = Dimensions.get('window');
const PAD = 24;

const FEATURES = [
  { icon: '⏱', text: 'Timed focus sessions with app blocking' },
  { icon: '🎮', text: 'Active reset mini-games (science-backed)' },
  { icon: '🔥', text: 'Streak tracking & checkpoint rewards' },
  { icon: '📊', text: 'Focus insights & weekly patterns' },
  { icon: '🎯', text: 'Goal-linked session tracking' },
  { icon: '🔕', text: 'Smart distraction blocking' },
];

// ── Check if user has active entitlement ─────────────────────────────────────
async function checkEntitlement(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[RC_ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  const completeOnboarding = useOnboardingStore(s => s.completeOnboarding);
  const protectTime        = useOnboardingStore(s => (s as any).protectTime as string | null);
  const reclaimHoursWeek   = useOnboardingStore(s => Math.round(((s as any).dailyPhoneHours ?? 4) * 0.40 * 7));

  const [loading,    setLoading]    = useState(false);
  const [presenting, setPresenting] = useState(false);

  // Entrance anims
  const contentA = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const ctaA     = useRef(new Animated.Value(0)).current;
  const ctaY     = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(contentA, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(ctaA, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ctaY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // Auto-present RC paywall after brief moment to let screen render
    const timer = setTimeout(() => presentRCPaywall(), 800);
    return () => clearTimeout(timer);
  }, []);

  // ── Present RevenueCat's built-in paywall ─────────────────────────────────
  const presentRCPaywall = async () => {
    if (presenting) return;
    setPresenting(true);

    try {
      // presentPaywall() shows RC's native paywall UI
      // Configure the paywall appearance in your RC dashboard under
      // Paywalls → Create Paywall
      const result = await RevenueCatUI.presentPaywall({
        // Optional: force a specific offering
        // offering: await Purchases.getOfferings().then(o => o.current),
      });

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          // Verify entitlement and proceed
          const active = await checkEntitlement();
          if (active) {
            completeOnboarding();
            router.replace('/(protected)/(tabs)');
          }
          break;

        case PAYWALL_RESULT.NOT_PRESENTED:
          // RC paywall not configured in dashboard — fall back to custom UI below
          console.warn('RC paywall not configured — showing custom fallback UI');
          break;

        case PAYWALL_RESULT.CANCELLED:
          // User dismissed — stay on screen, let them use the custom CTA below
          break;

        case PAYWALL_RESULT.ERROR:
          Alert.alert('Something went wrong', 'Please try again or restore your purchase.');
          break;
      }
    } catch (e: any) {
      console.warn('presentPaywall error:', e);
    } finally {
      setPresenting(false);
    }
  };

  // ── Re-present if user comes back from background (e.g. went to settings) ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        const active = await checkEntitlement();
        if (active) {
          completeOnboarding();
          router.replace('/(protected)/(tabs)');
        }
      }
    });
    return () => sub.remove();
  }, []);

  // ── Restore purchases ─────────────────────────────────────────────────────
  const handleRestore = async () => {
    setLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active[RC_ENTITLEMENT_ID]) {
        completeOnboarding();
        router.replace('/(protected)/(tabs)');
      } else {
        Alert.alert('No purchases found', 'No active subscription found for this account.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const goalMap: Record<string, string> = {
    'Deep work':         'deep work',
    'Studying':          'studying',
    'Creative projects': 'creative projects',
    'Health & fitness':  'health habits',
    'Family & presence': 'presence',
    'Peace of mind':     'peace of mind',
  };
  const goalText = goalMap[protectTime ?? ''] ?? 'your goals';

  // ── Render ────────────────────────────────────────────────────────────────
  // This screen sits behind the RC paywall modal.
  // If RC paywall is configured, users see the RC UI instantly.
  // If not configured yet, this custom UI is the fallback.
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060200', '#0C0400', '#100602', '#060200']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgGlow} pointerEvents="none" />

      <View style={[styles.inner, {
        paddingTop:    insets.top + 96,
        paddingBottom: insets.bottom + 24,
      }]}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: contentA, transform: [{ translateY: contentY }] }]}>
          <Text style={styles.trialBadge}>✦  7-DAY FREE TRIAL  ✦</Text>
          <Text style={styles.headline}>
            Unlock your focus.{'\n'}
            <Text style={styles.headlineAccent}>Protect your {goalText}.</Text>
          </Text>
          <Text style={styles.sub}>
            <Text style={styles.subBold}>{reclaimHoursWeek}+ hours back per week</Text>
            {' '}on average, with consistent Ember use.
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View style={[styles.featsGrid, { opacity: contentA, transform: [{ translateY: contentY }] }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featItem}>
              <Text style={styles.featIcon}>{f.icon}</Text>
              <Text style={styles.featTxt}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* CTA — opens RC paywall */}
        <Animated.View style={[styles.ctaBlock, { opacity: ctaA, transform: [{ translateY: ctaY }] }]}>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={presentRCPaywall}
            activeOpacity={0.88}
            disabled={presenting || loading}
          >
            <LinearGradient
              colors={['#FF9030', '#FF5E0E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              {presenting ? (
                <ActivityIndicator color="#1A0602" size="small" />
              ) : (
                <Text style={styles.ctaTxt}>See pricing — 7 days free</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.ctaFine}>
            Free for 7 days. Cancel anytime before trial ends — you won't be charged.
          </Text>

          {/* Restore + legal */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleRestore} activeOpacity={0.7} disabled={loading}>
              {loading
                ? <ActivityIndicator size="small" color="rgba(255,244,230,0.30)" />
                : <Text style={styles.footerLink}>Restore purchases</Text>
              }
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#060200' },
  inner: { flex: 1, paddingHorizontal: PAD, gap: 20 },

  bgGlow: {
    position: 'absolute',
    top: 0, left: '-20%', right: '-20%', height: '50%',
    shadowColor:   '#FF6600',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius:  100,
  },

  header: { gap: 10, alignItems: 'center' },
  trialBadge: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: COLORS.amber, textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FONTS.black, fontSize: 28,
    color: COLORS.cream, textAlign: 'center',
    lineHeight: 36, letterSpacing: -0.4,
  },
  headlineAccent: { color: COLORS.amber },
  sub: {
    fontFamily: FONTS.regular, fontSize: 14,
    color: 'rgba(255,244,230,0.42)',
    textAlign: 'center', lineHeight: 22,
  },
  subBold: { fontFamily: FONTS.bold, color: 'rgba(255,244,230,0.70)' },

  featsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featItem:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    width: (SW - PAD * 2 - 10) / 2,
  },
  featIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  featTxt:  {
    fontFamily: FONTS.regular, fontSize: 12,
    color: 'rgba(255,244,230,0.55)', flex: 1, lineHeight: 17,
  },

  ctaBlock: { gap: 12 },
  ctaBtn: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#FF6600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 18, elevation: 10,
  },
  ctaGrad: {
    paddingVertical: 21, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTxt: {
    fontFamily: FONTS.black, fontSize: 17,
    color: '#1A0602', letterSpacing: 0.1,
  },
  ctaFine: {
    fontFamily: FONTS.regular, fontSize: 11,
    color: 'rgba(255,244,230,0.28)',
    textAlign: 'center', lineHeight: 17,
  },

  footer:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  footerLink: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.28)', textDecorationLine: 'underline' },
  footerDot:  { color: 'rgba(255,244,230,0.18)', fontSize: 11 },
});
