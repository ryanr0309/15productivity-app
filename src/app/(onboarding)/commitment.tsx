/**
 * app/onboarding/commitment.tsx  — Screen 13: The Commitment
 *
 * High-intent screen. NOT a passive "tap continue."
 * The user:
 *   1. Reads a personalised declaration built from their answers
 *   2. Drags a "seal" token into a circle to lock it in
 *   3. Long-presses a final confirm button (3 seconds) to make it feel earned
 *
 * The act of effort = psychological commitment = higher downstream retention.
 *
 * NAVIGATION → /onboarding/paywall
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
  PanResponder, Vibration, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { useOnboardingStore } from '../../store/onboardingStore';

const { width: SW, height: SH } = Dimensions.get('window');
const PAD = 28;

// ── How long the hold needs to be ────────────────────────────────────────────
const HOLD_DURATION_MS = 2600;

// ── Build the declaration lines from store answers ────────────────────────────
function buildDeclaration(
  focusStealer:    string | null,
  protectTime:     string | null,
  dailyPhoneHours: number,
  reclaimHours:    number,
): string[] {
  const goalMap: Record<string, string> = {
    'Deep work':         'deep, uninterrupted work',
    'Studying':          'focused study time',
    'Creative projects': 'my creative work',
    'Health & fitness':  'my health and fitness',
    'Family & presence': 'being present with the people I love',
    'Peace of mind':     'my own peace of mind',
  };
  const stealerMap: Record<string, string> = {
    'Social media':      'social media',
    'Messages & apps':   'messaging apps',
    'My own thoughts':   'distracted thinking',
    'Notifications':     'constant notifications',
    'Video & streaming': 'endless video',
    'Browsing & news':   'mindless browsing',
  };

  const goal    = goalMap[protectTime ?? '']    ?? 'what matters most to me';
  const stealer = stealerMap[focusStealer ?? ''] ?? 'distraction';

  return [
    `I spend ${dailyPhoneHours} hours a day on my phone.`,
    `I know ${stealer} is stealing my focus.`,
    `I'm choosing to protect my time for ${goal}.`,
    `I commit to reclaiming ${reclaimHours} hours back every week.`,
    `Starting today.`,
  ];
}

// ── Animated declaration line ─────────────────────────────────────────────────
function DeclarationLine({
  text, delay, isLast,
}: { text: string; delay: number; isLast: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(a, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[dl.wrap, { opacity: a, transform: [{ translateX: x }] }]}>
      <View style={[dl.bar, isLast && dl.barLast]} />
      <Text style={[dl.txt, isLast && dl.txtLast]}>{text}</Text>
    </Animated.View>
  );
}

const dl = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  bar:  { width: 3, borderRadius: 2, marginTop: 3, minHeight: 18, backgroundColor: 'rgba(255,144,48,0.35)' },
  barLast: { backgroundColor: COLORS.amber, minHeight: 24 },
  txt: {
    fontFamily: FONTS.regular, fontSize: 16,
    color: 'rgba(255,244,230,0.55)', lineHeight: 24, flex: 1,
  },
  txtLast: {
    fontFamily: FONTS.black, fontSize: 18,
    color: COLORS.cream, letterSpacing: -0.2,
  },
});

// ── Long-press commit button ──────────────────────────────────────────────────
function HoldToCommit({ onComplete }: { onComplete: () => void }) {
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdAnim     = useRef<Animated.CompositeAnimation | null>(null);
  const [holding,  setHolding]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [progress, setProgress] = useState(0);

  const scale   = useRef(new Animated.Value(1)).current;
  const glowA   = useRef(new Animated.Value(0)).current;
  const successS = useRef(new Animated.Value(0)).current;
  const successA = useRef(new Animated.Value(0)).current;

  // Track progress value to control label
  useEffect(() => {
    holdProgress.addListener(({ value }) => setProgress(value));
    return () => holdProgress.removeAllListeners();
  }, []);

  const startHold = () => {
    if (done) return;
    setHolding(true);

    Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
    Animated.timing(glowA, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    holdAnim.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing:  Easing.linear,
      useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => {
      if (finished) {
        setDone(true);
        Vibration.vibrate(80);

        // Success burst
        Animated.parallel([
          Animated.spring(successS, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
          Animated.timing(successA,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(scale,     { toValue: 1.04, tension: 60, friction: 5, useNativeDriver: true }),
        ]).start(() => {
          setTimeout(onComplete, 600);
        });
      }
    });
  };

  const releaseHold = () => {
    if (done) return;
    setHolding(false);
    holdAnim.current?.stop();

    Animated.parallel([
      Animated.timing(scale,    { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(glowA,    { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(holdProgress, { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();
  };

  // Arc fill: convert progress (0–1) to strokeDashoffset
  const RADIUS = 40;
  const CIRC   = 2 * Math.PI * RADIUS;

  const arcFill = holdProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: [CIRC, 0],
  });
  const fillColor = holdProgress.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ['#FF6030', '#FF9030', '#FFCC33'],
  });

  const labelText = done ? '✓  Committed' :
    holding ? `Hold… ${Math.round(progress * 100)}%` : 'Hold to commit';

  const BUTTON_SIZE = 120;

  return (
    <View style={htc.wrap}>
      <Text style={htc.instruction}>
        {done ? 'Commitment locked in.' : 'Hold the button until it fills.'}
      </Text>

      <TouchableOpacity
        style={[htc.btnOuter, { width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2 }]}
        onPressIn={startHold}
        onPressOut={releaseHold}
        activeOpacity={1}
      >
        {/* Glow ring */}
        <Animated.View style={[htc.glowRing, { opacity: glowA, width: BUTTON_SIZE + 24, height: BUTTON_SIZE + 24, borderRadius: (BUTTON_SIZE + 24) / 2 }]} />

        {/* SVG-free progress ring using border trick */}
        <Animated.View style={[htc.btn, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={done ? ['#FFCC33', '#FF9030'] : ['rgba(255,144,48,0.12)', 'rgba(255,94,14,0.08)']}
            style={[StyleSheet.absoluteFill, { borderRadius: BUTTON_SIZE / 2 }]}
          />

          {/* Progress arc — approximated with an animated circular border */}
          <Animated.View style={[
            htc.progressRing,
            {
              borderColor: done ? '#FFCC33' : COLORS.orange,
              borderWidth: holdProgress.interpolate({
                inputRange: [0, 0.01, 1], outputRange: [2, 4, 4],
              }),
            },
          ]} />

          {/* Inner circle fill that grows */}
          <Animated.View style={[
            htc.innerFill,
            {
              opacity: holdProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }),
              transform: [{ scale: holdProgress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
            },
          ]} />

          <Text style={[htc.btnLabel, done && htc.btnLabelDone]}>{labelText}</Text>
        </Animated.View>

        {/* Success checkmark burst */}
        <Animated.View style={[
          htc.successBurst,
          { opacity: successA, transform: [{ scale: successS }] },
        ]}>
          <Text style={htc.successIcon}>✓</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Progress indicator text */}
      {holding && !done && (
        <View style={htc.progressBarWrap}>
          <Animated.View style={[htc.progressBar, {
            width: holdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]}>
            <LinearGradient
              colors={['#FF6030', '#FFCC33']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const htc = StyleSheet.create({
  wrap:        { alignItems: 'center', gap: 20 },
  instruction: {
    fontFamily: FONTS.regular, fontSize: 13,
    color: 'rgba(255,244,230,0.40)',
    textAlign: 'center', letterSpacing: 0.3,
  },
  btnOuter: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position:   'absolute',
    borderWidth: 0,
    backgroundColor: 'transparent',
    shadowColor:   COLORS.orange,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.60,
    shadowRadius:  22,
  },
  btn: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,144,48,0.25)',
  },
  progressRing: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
  },
  innerFill: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.orange,
  },
  btnLabel: {
    fontFamily:    FONTS.bold,
    fontSize:      13,
    color:         'rgba(255,244,230,0.65)',
    textAlign:     'center',
    letterSpacing: 0.2,
    lineHeight:    18,
  },
  btnLabelDone: { color: '#1A0602', fontFamily: FONTS.black },

  successBurst: {
    position:      'absolute',
    width:         120, height: 120, borderRadius: 60,
    alignItems:    'center', justifyContent: 'center',
    backgroundColor: COLORS.amber,
  },
  successIcon: { fontSize: 42, color: '#1A0602' },

  progressBarWrap: {
    width: 200, height: 4, borderRadius: 2, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressBar: { height: '100%', borderRadius: 2, overflow: 'hidden', minWidth: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function CommitmentScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  const focusStealer    = useOnboardingStore(s => (s as any).focusStealer    as string | null);
  const protectTime     = useOnboardingStore(s => (s as any).protectTime     as string | null);
  const dailyPhoneHours = useOnboardingStore(s => (s as any).dailyPhoneHours as number) ?? 4;

  const reclaimHours = Math.round(dailyPhoneHours * 0.40 * 7 * 10) / 10;
  const lines = buildDeclaration(focusStealer, protectTime, dailyPhoneHours, reclaimHours);

  const headerA = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(16)).current;
  const holdA   = useRef(new Animated.Value(0)).current;
  const holdY   = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(headerA, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // Hold button appears after all declaration lines have shown
    const totalLineDelay = lines.length * 220 + 800;
    Animated.sequence([
      Animated.delay(totalLineDelay),
      Animated.parallel([
        Animated.timing(holdA, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(holdY, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#050204', '#0A0508', '#100608']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Deep ember glow */}
      <View style={styles.deepGlow} pointerEvents="none" />

      <View style={[styles.root, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 32 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <OnboardingProgress step={13} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
          <Text style={styles.eyebrow}>ONE LAST THING</Text>
          <Text style={styles.headline}>
            Say it out loud.{'\n'}
            <Text style={styles.headlineAccent}>Mean it.</Text>
          </Text>
          <Text style={styles.sub}>
            Read this declaration. If it's true, commit to it.
          </Text>
        </Animated.View>

        {/* Declaration */}
        <View style={styles.declarationCard}>
          <LinearGradient
            colors={['rgba(255,144,48,0.06)', 'rgba(255,94,14,0.03)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.declarationLines}>
            {lines.map((line, i) => (
              <DeclarationLine
                key={i}
                text={line}
                delay={400 + i * 220}
                isLast={i === lines.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Hold to commit */}
        <Animated.View style={[styles.holdWrap, { opacity: holdA, transform: [{ translateY: holdY }], marginTop: 'auto' }]}>
          <HoldToCommit onComplete={() => router.push('/(onboarding)/paywall')} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050204' },

  deepGlow: {
    position: 'absolute',
    top: '40%', left: '10%', right: '10%', bottom: 0,
    shadowColor:   '#FF5500',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius:  80,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },

  header: { paddingHorizontal: PAD, gap: 8, marginBottom: 8 },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: 'rgba(255,150,50,0.55)', textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FONTS.black, fontSize: 34,
    color: COLORS.cream, lineHeight: 42, letterSpacing: -0.5,
  },
  headlineAccent: { color: COLORS.amber },
  sub: {
    fontFamily: FONTS.regular, fontSize: 15,
    color: 'rgba(255,244,230,0.38)', lineHeight: 22,
  },

  declarationCard: {
    marginHorizontal: PAD,
    borderRadius: 24, borderWidth: 1.5,
    borderColor: 'rgba(255,144,48,0.18)',
    padding: 24, overflow: 'hidden',
  },
  declarationLines: { gap: 18 },

  holdWrap: {
    paddingHorizontal: PAD,
    paddingBottom: 8,
    alignItems: 'center',
  },
});
