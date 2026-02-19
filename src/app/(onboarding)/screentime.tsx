/**
 * app/(onboarding)/screen-time.tsx
 * Onboarding Screen 15 — Screen Time Permission
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import * as RNDeviceActivity from 'react-native-device-activity';
import {
  requestScreenTimeAuthorization,
  saveSelectionToken,
  getAuthorizationStatus,
} from '../../services/screenTimeService';
import { useOnboardingStore } from '../../store/onboardingStore';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: '🚫', title: 'Block distracting apps',   sub: 'Instagram, TikTok, Reddit — gone during focus.' },
  { icon: '🔓', title: 'Auto-unlocks at break',     sub: 'Apps unblock when your checkpoint starts.' },
  { icon: '📊', title: 'Track real usage',           sub: 'See which apps actually eat your time.' },
];

type Step = 'explain' | 'requesting' | 'picker' | 'done' | 'denied';

export default function ScreenTimePermissionScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  const [step, setStep] = useState<Step>('explain');
  const { setScreenTimeSelectionId } = useOnboardingStore();
  const [hasSelection, setHasSelection] = useState(false);

  // ── Animations ────────────────────────────────────────────────────────
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(30)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(iconPulse, { toValue: 1.08, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(iconPulse, { toValue: 1.00, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  // getAuthorizationStatus is synchronous — no .then(), no await
  useEffect(() => {
    const status = getAuthorizationStatus();
    if (status === 'approved') setStep('picker');
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAllow = useCallback(async () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }),
    ]).start();

    setStep('requesting');
    const status = await requestScreenTimeAuthorization();
    setStep(status === 'approved' ? 'picker' : 'denied');
  }, [btnScale]);

  const handleSelectionChange = useCallback((event: any) => {
    const rawToken: string = event.nativeEvent.familyActivitySelection;
    if (rawToken) {
      const id = saveSelectionToken(rawToken);
      setScreenTimeSelectionId(id);
      setHasSelection(true);
    }
  }, [setScreenTimeSelectionId]);

  const handleConfirm = useCallback(() => {
    setStep('done');
    setTimeout(() => router.replace('/(tabs)'), 900);
  }, []);

  const handleSkip = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0A0603', '#190C05', '#2C1608']} style={StyleSheet.absoluteFill} />
      <View style={styles.bloom} />

      <Animated.View style={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
      ]}>

        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          <Animated.Text style={[styles.heroIcon, { transform: [{ scale: iconPulse }] }]}>
            {step === 'done' ? '✅' : step === 'denied' ? '⚠️' : '📱'}
          </Animated.Text>

          <Text style={styles.headline}>
            {step === 'done'    ? "You're all set!"
           : step === 'denied' ? 'Access not granted'
           : step === 'picker' ? 'Choose apps to block'
           : 'Allow Screen Time Access'}
          </Text>

          <Text style={styles.subheadline}>
            {step === 'done'
              ? 'Ember will block your chosen apps during every focus session.'
              : step === 'denied'
              ? 'You can enable this later in Settings → Screen Time → Ember.'
              : step === 'picker'
              ? 'Tap the selector below and pick the apps you want blocked. You can change this any time.'
              : 'Ember uses Screen Time to block distracting apps while you focus. Your data stays on-device.'}
          </Text>
        </View>

        {/* ── Feature list (explain step only) ── */}
        {step === 'explain' && (
          <>
            <View style={styles.featureList}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <Text style={styles.featureIcon}>{f.icon}</Text>
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureSub}>{f.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyText}>
                🔒 Ember never sees which apps you pick. The selection is handled entirely by iOS.
              </Text>
            </View>
          </>
        )}

        {/* ── Loading dots ── */}
        {step === 'requesting' && (
          <View style={styles.loadingWrap}>
            <LoadingDots />
            <Text style={styles.loadingText}>Waiting for iOS…</Text>
          </View>
        )}

        {/* ── Native app picker ── */}
        {step === 'picker' && (
          <View style={styles.pickerCard}>
            <Text style={styles.pickerLabel}>Tap to select apps</Text>

            <View style={styles.pickerViewWrap}>
              <View style={styles.pickerFallback}>
                <Text style={styles.pickerFallbackText}>Loading picker…</Text>
              </View>

              <RNDeviceActivity.DeviceActivitySelectionView
                style={styles.pickerNativeView}
                onSelectionChange={handleSelectionChange}
                familyActivitySelection={null}
              />
            </View>

            {hasSelection && (
              <View style={styles.selectionConfirmed}>
                <Text style={styles.selectionConfirmedText}>✓ Apps selected</Text>
              </View>
            )}
          </View>
        )}

        {/* ── CTAs ── */}
        <View style={styles.ctaArea}>
          {step === 'explain' && (
            <Animated.View style={[styles.btnShadow, { transform: [{ scale: btnScale }] }]}>
              <TouchableOpacity activeOpacity={0.9} onPress={handleAllow}>
                <LinearGradient colors={['#FF7830', '#EE4800']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Allow Screen Time Access</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === 'picker' && (
            <Animated.View style={[styles.btnShadow, { transform: [{ scale: btnScale }] }]}>
              <TouchableOpacity activeOpacity={0.9} onPress={handleConfirm}>
                <LinearGradient
                  colors={hasSelection ? ['#FF7830', '#EE4800'] : ['#3A2A1A', '#2A1A0A']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>
                    {hasSelection ? 'Done →' : 'Skip app selection'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === 'denied' && (
            <Animated.View style={[styles.btnShadow, { transform: [{ scale: btnScale }] }]}>
              <TouchableOpacity activeOpacity={0.9} onPress={handleSkip}>
                <LinearGradient colors={['#FF7830', '#EE4800']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Continue anyway →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {(step === 'explain' || step === 'picker') && (
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.6} style={styles.skipBtn}>
              <Text style={styles.skipText}>
                {step === 'picker' ? 'Skip for now' : 'Not now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </Animated.View>
    </View>
  );
}

// ── Loading dots ──────────────────────────────────────────────────────────────
function LoadingDots() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(d, { toValue: 1,   duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.delay(320 - i * 160),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B1A', opacity: d }} />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0603' },

  bloom: {
    position: 'absolute', top: height * 0.08, alignSelf: 'center',
    width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45,
    backgroundColor: 'transparent',
    shadowColor: '#FF5500', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40, shadowRadius: 120, elevation: 0,
  },

  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },

  heroSection:  { alignItems: 'center', marginTop: 8 },
  heroIcon:     { fontSize: 68, marginBottom: 16 },
  headline: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: '#FFF4E6',
    letterSpacing: -0.4, textAlign: 'center', marginBottom: 10,
  },
  subheadline: {
    fontFamily: 'Nunito_400Regular', fontSize: 15,
    color: 'rgba(255,244,230,0.55)', textAlign: 'center', lineHeight: 22,
    paddingHorizontal: 4,
  },

  featureList: { gap: 10 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,107,26,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureIcon:  { fontSize: 24 },
  featureText:  { flex: 1 },
  featureTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF4E6', marginBottom: 2 },
  featureSub:   { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,244,230,0.50)', lineHeight: 17 },

  privacyNote: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  privacyText: {
    fontFamily: 'Nunito_400Regular', fontSize: 12,
    color: 'rgba(255,244,230,0.38)', lineHeight: 18, textAlign: 'center',
  },

  loadingWrap: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  loadingText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,244,230,0.40)' },

  pickerCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,107,26,0.20)',
    padding: 16, gap: 12,
  },
  pickerLabel: {
    fontFamily: 'Nunito_700Bold', fontSize: 13,
    color: 'rgba(255,244,230,0.50)', textAlign: 'center', letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickerViewWrap: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  pickerFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pickerFallbackText: {
    fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,244,230,0.30)',
  },
  pickerNativeView: {
    ...StyleSheet.absoluteFillObject,
  },
  selectionConfirmed: {
    alignItems: 'center', paddingVertical: 6,
  },
  selectionConfirmedText: {
    fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FF8C3A',
  },

  ctaArea:   { gap: 10 },
  btnShadow: {
    shadowColor: '#FF4400', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40, shadowRadius: 16, elevation: 12,
  },
  primaryBtn: {
    paddingVertical: 18, alignItems: 'center',
    justifyContent: 'center', borderRadius: 50,
  },
  primaryBtnText: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: '#fff', letterSpacing: 0.2,
  },
  skipBtn:  { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,244,230,0.30)' },
});
