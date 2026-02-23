/**
 * app/onboarding/paywall.tsx  — Screen 14: Paywall
 *
 * FIX: RevenueCat throws "no singleton instance" if Purchases.configure()
 * hasn't completed before presentPaywall() is called. Added waitForRC()
 * which retries getCustomerInfo() until RC is ready before proceeding.
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
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function checkEntitlement(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[RC_ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

/**
 * Poll until Purchases is configured and responsive.
 * Retries up to maxAttempts times with a delay between each.
 * Returns true when ready, false if it times out.
 */
async function waitForRC(maxAttempts = 10, delayMs = 300): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await Purchases.getCustomerInfo(); // throws if not configured
      return true;
    } catch (e: any) {
      // "no singleton instance" means not configured yet — keep waiting
      const isUninitialised =
        e?.message?.toLowerCase().includes('singleton') ||
        e?.message?.toLowerCase().includes('configure') ||
        e?.code === 'PURCHASES_NOT_CONFIGURED';

      if (!isUninitialised) {
        // A real error (network etc.) — RC is configured, proceed
        return true;
      }

      if (i < maxAttempts - 1) {
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
  return false;
}

async function onPurchaseSuccess(completeOnboarding: () => Promise<void>) {
  await completeOnboarding();
  router.replace('/(onboarding)/screentime');
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  const [rcReady,    setRcReady]    = useState(false);

  const contentA = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const ctaA     = useRef(new Animated.Value(0)).current;
  const ctaY     = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    // Run entrance animations
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

    // Wait for RC to be ready, then auto-present the paywall
    let cancelled = false;
    (async () => {
      const ready = await waitForRC();
      if (cancelled) return;
      setRcReady(ready);
      if (ready) {
        presentRCPaywall();
      } else {
        console.warn('RevenueCat did not initialise in time — showing fallback UI');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const presentRCPaywall = async () => {
    if (presenting) return;
    setPresenting(true);
    try {
      // Double-check RC is ready — catches edge cases where rcReady
      // state hasn't propagated but the function is called directly
      const ready = await waitForRC(5, 200);
      if (!ready) {
        Alert.alert('Not ready', 'Please wait a moment and try again.');
        return;
      }

      const result = await RevenueCatUI.presentPaywall();
      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED: {
          const active = await checkEntitlement();
          if (active) await onPurchaseSuccess(completeOnboarding);
          break;
        }
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.warn('RC paywall not configured — showing custom fallback UI');
          break;
        case PAYWALL_RESULT.CANCELLED:
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

  // Re-check if user paid on another device / via Settings
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        const active = await checkEntitlement();
        if (active) await onPurchaseSuccess(completeOnboarding);
      }
    });
    return () => sub.remove();
  }, []);

  const handleRestore = async () => {
    setLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active[RC_ENTITLEMENT_ID]) {
        await onPurchaseSuccess(completeOnboarding);
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

        <Animated.View style={[styles.header, { opacity: contentA, transform: [{ translateY: contentY }] }]}>
          <Text style={styles.trialBadge}>✦  3-DAY FREE TRIAL  ✦</Text>
          <Text style={styles.headline}>
            Unlock your focus.{'\n'}
            <Text style={styles.headlineAccent}>Protect your {goalText}.</Text>
          </Text>
          <Text style={styles.sub}>
            <Text style={styles.subBold}>{reclaimHoursWeek}+ hours back per week</Text>
            {' '}on average, with consistent Ember use.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featsGrid, { opacity: contentA, transform: [{ translateY: contentY }] }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featItem}>
              <Text style={styles.featIcon}>{f.icon}</Text>
              <Text style={styles.featTxt}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ flex: 1 }} />

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
              {presenting
                ? <ActivityIndicator color="#1A0602" size="small" />
                : <Text style={styles.ctaTxt}>See pricing — 3 days free</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.ctaFine}>
            Free for 3 days. Cancel anytime before trial ends — you won't be charged.
          </Text>

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
  featItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    width: (SW - PAD * 2 - 10) / 2,
  },
  featIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  featTxt: {
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

  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  footerLink: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.28)', textDecorationLine: 'underline' },
  footerDot:  { color: 'rgba(255,244,230,0.18)', fontSize: 11 },
});
