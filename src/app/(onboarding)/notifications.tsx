/**
 * app/onboarding/notifications.tsx
 *
 * Shown once during onboarding to request notification permission.
 * Place it in your onboarding flow just before the paywall or as the
 * final onboarding step.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { requestNotificationPermission } from '../../lib/sessionNotifications';
import { usePostHog } from 'posthog-react-native';

const FEATURES = [
  { icon: '⏱', text: 'Know the moment your session ends' },
  { icon: '🔓', text: 'Reminder to unlock your apps' },
  { icon: '🔥', text: 'Session complete celebrations' },
];

export default function NotificationsPermissionScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });
  const [requesting, setRequesting] = useState(false);

  const headerA = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(18)).current;
  const cardA   = useRef(new Animated.Value(0)).current;
  const cardY   = useRef(new Animated.Value(20)).current;
  const ctaA    = useRef(new Animated.Value(0)).current;
  const ctaY    = useRef(new Animated.Value(14)).current;

  // Bell pulse
  const bellScale = useRef(new Animated.Value(1)).current;

  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture('onboarding_step_viewed', { step: 'notifications' })
  }, [])

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(headerA, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(cardA, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(ctaA, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(ctaY, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // Bell gentle pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bellScale, { toValue: 1.12, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bellScale, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(1800),
      ])
    ).start();
  }, []);

  const handleAllow = async () => {
    setRequesting(true);
    await requestNotificationPermission();
    // Whether they allow or deny, proceed — don't block onboarding on this
    navigateNext();
  };

  const handleSkip = () => navigateNext();

  const navigateNext = () => {
    // Adjust this route to wherever notifications sits in your onboarding flow
    router.replace('/(tabs)');
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060302', '#0E0604', '#150806']}
        start={{ x: 0.4, y: 0 }} end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
  
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        {/* Bell icon */}
        <Animated.View style={[styles.iconWrap, { opacity: headerA, transform: [{ translateY: headerY }, { scale: bellScale }] }]}>
          <LinearGradient
            colors={['rgba(255,144,48,0.18)', 'rgba(255,94,14,0.08)']}
            style={styles.iconGrad}
          >
            <Text style={styles.icon}>🔔</Text>
          </LinearGradient>
        </Animated.View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
          <Text style={styles.eyebrow}>STAY IN THE LOOP</Text>
          <Text style={styles.question}>Know when your{'\n'}session ends</Text>
          <Text style={styles.sub}>
            Ember sends one notification when your focus session completes — so you know when your apps are unlocked.
          </Text>
        </Animated.View>

        {/* Feature list */}
        <Animated.View style={[styles.featureCard, { opacity: cardA, transform: [{ translateY: cardY }] }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* CTAs */}
        <Animated.View style={[
          styles.ctaBlock,
          { opacity: ctaA, transform: [{ translateY: ctaY }], paddingBottom: insets.bottom + 28 },
        ]}>
          <TouchableOpacity
            style={styles.allowBtn}
            onPress={handleAllow}
            activeOpacity={0.88}
            disabled={requesting}
          >
            <LinearGradient
              colors={['#FF9030', '#FF5E0E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.allowGrad}
            >
              <Text style={styles.allowTxt}>Allow Notifications</Text>
              <Text style={styles.allowArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} activeOpacity={0.6} style={styles.skipBtn}>
            <Text style={styles.skipTxt}>Not now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060302' },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 16 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },

  iconWrap: { alignItems: 'center', marginBottom: 24 },
  iconGrad: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,144,48,0.22)',
  },
  icon: { fontSize: 40 },

  header:   { gap: 10, marginBottom: 28 },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: 'rgba(255,100,30,0.55)', textTransform: 'uppercase',
  },
  question: {
    fontFamily: FONTS.black, fontSize: 34,
    color: COLORS.cream, letterSpacing: -0.6, lineHeight: 40,
  },
  sub: {
    fontFamily: FONTS.regular, fontSize: 15,
    color: 'rgba(255,244,230,0.42)', lineHeight: 23,
  },

  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  featureRowBorder: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  featureIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  featureText: {
    fontFamily: FONTS.bold, fontSize: 14,
    color: 'rgba(255,244,230,0.75)', flex: 1,
  },

  ctaBlock: { gap: 12 },
  allowBtn: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#FF6600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 16, elevation: 8,
  },
  allowGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 19, paddingHorizontal: 28, gap: 10,
  },
  allowTxt:   { fontFamily: FONTS.black, fontSize: 17, color: '#1A0602', letterSpacing: 0.2 },
  allowArrow: { fontFamily: FONTS.black, fontSize: 18, color: '#1A0602' },

  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipTxt: {
    fontFamily: FONTS.regular, fontSize: 14,
    color: 'rgba(255,244,230,0.28)', letterSpacing: 0.2,
  },
});
