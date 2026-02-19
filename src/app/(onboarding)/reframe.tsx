/**
 * app/onboarding/reframe.tsx  — Screen 8: You're Not Broken
 *
 * Emotional pivot from the pain/waste screens.
 * Reframes distraction as an engineering problem, not a character flaw.
 * Tone: warm, validating, then empowering.
 *
 * NAVIGATION → /onboarding/science
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { OnboardingProgress } from '../../components/OnboardingProgress';

const { width: SW } = Dimensions.get('window');

// The "vs" comparison cards
const COMPARISONS = [
  {
    wrong: 'I have no willpower',
    right: 'My environment is engineered against me',
  },
  {
    wrong: 'I\'m addicted to my phone',
    right: 'My phone is designed by 1,000 engineers to grab my attention',
  },
  {
    wrong: 'I should just try harder',
    right: 'I need a system that works with my brain, not against it',
  },
];

// Supporting facts that appear staggered
const FACTS = [
  {
    icon: '🧪',
    stat: '1,000+',
    label: 'engineers at every major app company whose only job is keeping you scrolling',
  },
  {
    icon: '🎰',
    stat: 'Variable rewards',
    label: 'the same psychological mechanism used in slot machines — used in every feed',
  },
  {
    icon: '🧠',
    stat: '23 minutes',
    label: 'average time to regain deep focus after a single phone check',
  },
];

export default function ReframeScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  const [activeComparison, setActiveComparison] = useState(0);
  const [showFacts, setShowFacts]   = useState(false);
  const [showCTA,   setShowCTA]     = useState(false);

  // ── Animations ─────────────────────────────────────────────────────────────
  const headerA    = useRef(new Animated.Value(0)).current;
  const headerY    = useRef(new Animated.Value(18)).current;

  // Wrong side — strikes through
  const wrongA     = useRef(new Animated.Value(0)).current;
  const strikeW    = useRef(new Animated.Value(0)).current;  // 0→1 = line grows

  // Right side — slides in from below
  const rightA     = useRef(new Animated.Value(0)).current;
  const rightY     = useRef(new Animated.Value(20)).current;

  // Card exit
  const cardA      = useRef(new Animated.Value(1)).current;
  const cardY      = useRef(new Animated.Value(0)).current;

  // Facts section
  const factsA     = useRef(new Animated.Value(0)).current;
  const factsY     = useRef(new Animated.Value(20)).current;

  // CTA
  const ctaA       = useRef(new Animated.Value(0)).current;
  const ctaY       = useRef(new Animated.Value(14)).current;

  // Warm glow pulse
  const glowOpacity = useRef(new Animated.Value(0.0)).current;

  const runCard = (idx: number, onDone?: () => void) => {
    // Reset
    wrongA.setValue(0);
    strikeW.setValue(0);
    rightA.setValue(0);
    rightY.setValue(20);
    cardA.setValue(1);
    cardY.setValue(0);

    Animated.sequence([
      // 1. Wrong text fades in
      Animated.timing(wrongA, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.delay(500),
      // 2. Strikethrough line grows across
      Animated.timing(strikeW, { toValue: 1, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.delay(200),
      // 3. Right reframe slides up
      Animated.parallel([
        Animated.timing(rightA, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(rightY, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
      Animated.delay(1400),
    ]).start(() => {
      if (idx < COMPARISONS.length - 1) {
        // Slide card out upward
        Animated.parallel([
          Animated.timing(cardA, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.timing(cardY, { toValue: -18, duration: 260, useNativeDriver: true }),
        ]).start(() => {
          setActiveComparison(idx + 1);
          runCard(idx + 1, onDone);
        });
      } else {
        onDone?.();
      }
    });
  };

  useEffect(() => {
    // Header in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(headerA, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // Warm glow builds
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(glowOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]).start();

    // Start comparison cards
    setTimeout(() => {
      runCard(0, () => {
        // After last card — show facts
        setShowFacts(true);
        Animated.parallel([
          Animated.timing(factsA, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(factsY, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start();
        // CTA after facts
        setTimeout(() => {
          setShowCTA(true);
          Animated.parallel([
            Animated.timing(ctaA, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.timing(ctaY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]).start();
        }, 900);
      });
    }, 700);
  }, []);

  if (!fontsLoaded) return null;

  const comparison = COMPARISONS[activeComparison];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060302', '#0A0604', '#100804']}
        start={{ x: 0.4, y: 0 }} end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Warm ambient glow — hope replacing dread */}
      <Animated.View pointerEvents="none" style={[styles.warmGlow, { opacity: glowOpacity }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 32,
        }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={showCTA}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <OnboardingProgress step={8} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
          <Text style={styles.eyebrow}>HERE'S THE TRUTH</Text>
          <Text style={styles.headline}>
            You're not broken.{'\n'}
            <Text style={styles.headlineAccent}>The game is rigged.</Text>
          </Text>
          <Text style={styles.sub}>
            Every app on your phone was built by teams of engineers whose only metric is time-on-screen. You were never meant to win with willpower alone.
          </Text>
        </Animated.View>

        {/* ── Comparison card ── */}
        <Animated.View style={[styles.compCard, { opacity: cardA, transform: [{ translateY: cardY }] }]}>

          {/* Step counter */}
          <View style={styles.stepDots}>
            {COMPARISONS.map((_, i) => (
              <View key={i} style={[
                styles.stepDot,
                i === activeComparison && styles.stepDotActive,
                i < activeComparison && styles.stepDotDone,
              ]} />
            ))}
          </View>

          {/* Wrong belief — gets struck through */}
          <Animated.View style={[styles.wrongWrap, { opacity: wrongA }]}>
            <View style={styles.wrongLabelRow}>
              <View style={styles.wrongBadge}>
                <Text style={styles.wrongBadgeTxt}>What you tell yourself</Text>
              </View>
            </View>
            <View style={styles.wrongTextWrap}>
              <Text style={styles.wrongText}>{comparison.wrong}</Text>
              {/* Animated strikethrough */}
              <Animated.View style={[
                styles.strikeLine,
                { width: strikeW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]} />
            </View>
          </Animated.View>

          {/* Divider arrow */}
          <Animated.View style={[styles.arrowWrap, { opacity: rightA }]}>
            <View style={styles.arrowLine} />
            <View style={styles.arrowDown} />
          </Animated.View>

          {/* Reframe — slides in */}
          <Animated.View style={[styles.rightWrap, { opacity: rightA, transform: [{ translateY: rightY }] }]}>
            <View style={styles.rightLabelRow}>
              <View style={styles.rightBadge}>
                <Text style={styles.rightBadgeTxt}>The reality</Text>
              </View>
            </View>
            <Text style={styles.rightText}>{comparison.right}</Text>
          </Animated.View>

        </Animated.View>

        {/* ── Facts ── */}
        {showFacts && (
          <Animated.View style={[styles.factsWrap, { opacity: factsA, transform: [{ translateY: factsY }] }]}>
            <Text style={styles.factsHeadline}>
              This isn't a moral failing.{'\n'}It's an{' '}
              <Text style={styles.factsAccent}>engineering problem.</Text>
            </Text>

            {FACTS.map((f, i) => (
              <Animated.View
                key={i}
                style={[styles.factCard, {
                  opacity: factsA,
                  transform: [{
                    translateY: factsY.interpolate({
                      inputRange: [0, 20],
                      outputRange: [0, 20 + i * 8],
                    }),
                  }],
                }]}
              >
                <Text style={styles.factIcon}>{f.icon}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.factStat}>{f.stat}</Text>
                  <Text style={styles.factLabel}>{f.label}</Text>
                </View>
              </Animated.View>
            ))}

            {/* The pivot */}
            <View style={styles.pivotCard}>
              <LinearGradient
                colors={['rgba(255,170,50,0.10)', 'rgba(255,100,20,0.06)']}
                style={styles.pivotGrad}
              >
                <Text style={styles.pivotText}>
                  The solution isn't{' '}
                  <Text style={styles.pivotStrike}>more willpower.</Text>
                  {'\n'}
                  It's a better{' '}
                  <Text style={styles.pivotAccent}>system.</Text>
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* CTA */}
        {showCTA && (
          <Animated.View style={[styles.ctaWrap, { opacity: ctaA, transform: [{ translateY: ctaY }] }]}>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/(onboarding)/science')}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#FF9030', '#FF5E0E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaTxt}>Show me the system</Text>
                <Text style={styles.ctaArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#060302' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 28, gap: 24 },

  warmGlow: {
    position: 'absolute',
    top: '30%', left: '-20%', right: '-20%', bottom: '-10%',
    backgroundColor: 'transparent',
    shadowColor:   '#FF8800',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius:  90,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },

  header: { gap: 10 },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: 'rgba(255,170,60,0.55)', textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FONTS.black, fontSize: 32,
    color: COLORS.cream, lineHeight: 40, letterSpacing: -0.5,
  },
  headlineAccent: { color: COLORS.amber },
  sub: {
    fontFamily: FONTS.regular, fontSize: 15,
    color: 'rgba(255,244,230,0.45)', lineHeight: 23,
  },

  // Comparison card
  compCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    gap: 16,
  },
  stepDots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 4 },
  stepDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stepDotActive: { backgroundColor: COLORS.orange, width: 18 },
  stepDotDone:   { backgroundColor: 'rgba(255,170,60,0.35)' },

  // Wrong side
  wrongWrap: { gap: 10 },
  wrongLabelRow: { flexDirection: 'row' },
  wrongBadge: {
    backgroundColor: 'rgba(255,80,50,0.14)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,80,50,0.22)',
  },
  wrongBadgeTxt: {
    fontFamily: FONTS.bold, fontSize: 11,
    color: 'rgba(255,120,90,0.85)', letterSpacing: 0.5,
  },
  wrongTextWrap: { position: 'relative' },
  wrongText: {
    fontFamily: FONTS.bold, fontSize: 18,
    color: 'rgba(255,244,230,0.55)',
    lineHeight: 26, letterSpacing: -0.2,
  },
  strikeLine: {
    position: 'absolute',
    top: '50%', left: 0,
    height: 2.5,
    backgroundColor: '#FF4422',
    borderRadius: 2,
  },

  // Arrow divider
  arrowWrap: { alignItems: 'center', gap: 0 },
  arrowLine: { width: 1, height: 14, backgroundColor: 'rgba(255,170,60,0.30)' },
  arrowDown: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,170,60,0.30)',
  },

  // Right side
  rightWrap: { gap: 10 },
  rightLabelRow: { flexDirection: 'row' },
  rightBadge: {
    backgroundColor: 'rgba(255,170,50,0.14)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,170,50,0.25)',
  },
  rightBadgeTxt: {
    fontFamily: FONTS.bold, fontSize: 11,
    color: 'rgba(255,200,80,0.90)', letterSpacing: 0.5,
  },
  rightText: {
    fontFamily: FONTS.bold, fontSize: 18,
    color: COLORS.cream,
    lineHeight: 26, letterSpacing: -0.2,
  },

  // Facts
  factsWrap:      { gap: 16 },
  factsHeadline: {
    fontFamily: FONTS.black, fontSize: 26,
    color: COLORS.cream, lineHeight: 34, letterSpacing: -0.4,
  },
  factsAccent: { color: COLORS.amber },
  factCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  factIcon:  { fontSize: 26, marginTop: 2 },
  factStat: {
    fontFamily: FONTS.black, fontSize: 16,
    color: COLORS.amber, letterSpacing: -0.3,
  },
  factLabel: {
    fontFamily: FONTS.regular, fontSize: 13,
    color: 'rgba(255,244,230,0.45)', lineHeight: 19,
  },

  pivotCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,170,50,0.20)',
  },
  pivotGrad:  { padding: 20 },
  pivotText: {
    fontFamily: FONTS.bold, fontSize: 20,
    color: COLORS.cream, lineHeight: 30,
  },
  pivotStrike: {
    color: 'rgba(255,100,60,0.70)',
    textDecorationLine: 'line-through',
    textDecorationColor: '#FF4422',
  },
  pivotAccent: { color: COLORS.amber },

  ctaWrap: { paddingBottom: 8 },
  ctaBtn: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#FF6600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 16, elevation: 8,
  },
  ctaGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20, paddingHorizontal: 28, gap: 10,
  },
  ctaTxt:   { fontFamily: FONTS.black, fontSize: 17, color: '#1A0602', letterSpacing: 0.2 },
  ctaArrow: { fontFamily: FONTS.black, fontSize: 18, color: '#1A0602' },
});
