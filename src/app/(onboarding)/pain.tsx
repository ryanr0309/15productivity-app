/**
 * app/onboarding/pain.tsx  — Screen 2: The Pain
 *
 * No selling. No features. Just the moment of recognition.
 * The user reads this and thinks "that's exactly me."
 *
 * NAVIGATION: → /onboarding/q-stealer (screen 3)
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
import { useOnboardingStore } from '../../store/onboardingStore';
import { usePostHog } from 'posthog-react-native';

const { width: SW, height: SH } = Dimensions.get('window');

// The micro-moments of distraction — appear one by one
const MOMENTS = [
  { icon: '📱', text: 'You unlock your phone to check the time.' },
  { icon: '💬', text: 'One notification. Just a glance.' },
  { icon: '🌀', text: 'You\'re still scrolling 47 minutes later.' },
];

// Stats that hit differently when you see them written out
const STATS = [
  { number: '4.1h', label: 'average daily phone use' },
  { number: '96×',  label: 'phone checks per day' },
  { number: '23m',  label: 'to regain deep focus after interruption' },
];

export default function PainScreen() {
      
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  // ── State ──────────────────────────────────────────────────────────────────
  const [momentIndex, setMomentIndex] = useState(0);   // which moment is active
  const [showStats,   setShowStats]   = useState(false);
  const [showCTA,     setShowCTA]     = useState(false);

  // ── Animations ─────────────────────────────────────────────────────────────

  const handleContinue = async () => {
          router.push('/(onboarding)/stealer');
        };
        
  // Header line — slides + fades in first
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(18)).current;

  // Each moment card fades in/out
  const momentOpacity = useRef(new Animated.Value(0)).current;
  const momentY       = useRef(new Animated.Value(22)).current;
  const momentScale   = useRef(new Animated.Value(0.95)).current;

  // Stats section
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsY       = useRef(new Animated.Value(20)).current;

  // Divider line grows across
  const dividerW = useRef(new Animated.Value(0)).current;

  // CTA
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY       = useRef(new Animated.Value(16)).current;

  // Pulsing red dot on the notification icon
  const dotPulse = useRef(new Animated.Value(1)).current;

  // Background red bleed — grows when moments play
  const bgBleed = useRef(new Animated.Value(0)).current;

  const posthog = usePostHog()

  useEffect(() => {
    posthog.capture('onboarding_step_viewed', { step: 'pain' })
  }, [])

  useEffect(() => {
    // 1. Header in
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerY,       { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // 2. Background grows a subtle warm bleed
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(bgBleed, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // 3. First moment card in
    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.spring(momentScale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(momentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(momentY,       { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
    ]).start();

    // 4. Auto-advance through moments 0 → 1 → 2 with crossfade
    const advance = (from: number) => {
      if (from >= MOMENTS.length - 1) {
        // After last moment — show stats
        setTimeout(() => {
          setShowStats(true);
          Animated.parallel([
            Animated.timing(statsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(statsY,       { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]).start();
          // Divider grows
          Animated.timing(dividerW, { toValue: 1, duration: 600, delay: 200, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
          // CTA appears
          setTimeout(() => {
            setShowCTA(true);
            Animated.parallel([
              Animated.timing(ctaOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(ctaY,       { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]).start();
          }, 800);
        }, 1400);
        return;
      }

      setTimeout(() => {
        // Fade out current
        Animated.parallel([
          Animated.timing(momentOpacity, { toValue: 0,    duration: 280, useNativeDriver: true }),
          Animated.timing(momentY,       { toValue: -12,  duration: 280, useNativeDriver: true }),
        ]).start(() => {
          // Switch content
          setMomentIndex(from + 1);
          momentY.setValue(18);
          momentScale.setValue(0.94);
          // Fade in next
          Animated.parallel([
            Animated.spring(momentScale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
            Animated.timing(momentOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.timing(momentY,       { toValue: 0, duration: 380, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
          ]).start(() => advance(from + 1));
        });
      }, from === 0 ? 1600 : 1800);
    };
    advance(0);

    // 5. Notification dot pulses forever
    Animated.loop(Animated.sequence([
      Animated.timing(dotPulse, { toValue: 1.6, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(dotPulse, { toValue: 1.0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  if (!fontsLoaded) return null;

  const moment = MOMENTS[momentIndex];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Background ── */}
      <LinearGradient
        colors={['#060302', '#0E0604', '#150806']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Warm bleed that grows as story progresses */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bgBleed,
          { opacity: bgBleed.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) },
        ]}
      />

      {/* Progress bar */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 28 }}>
        <OnboardingProgress step={2} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={showCTA}   // only scrollable once all content revealed
      >

        {/* ── Header ── */}
        <Animated.View style={[styles.headerWrap, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
          {/* Eyebrow */}
          <Text style={styles.eyebrow}>SOUND FAMILIAR?</Text>

          {/* Hero headline — the one that lands */}
          <Text style={styles.headline}>
            You opened your phone{'\n'}
            to do{' '}
            <Text style={styles.headlineAccent}>one thing.</Text>
          </Text>
        </Animated.View>

        {/* ── Animated moment card ── */}
        <Animated.View style={[
          styles.momentCard,
          {
            opacity:   momentOpacity,
            transform: [{ translateY: momentY }, { scale: momentScale }],
          },
        ]}>
          {/* Moment icon with notification dot */}
          <View style={styles.momentIconWrap}>
            <Text style={styles.momentIcon}>{moment.icon}</Text>
            {/* Pulsing notification dot */}
            {momentIndex === 1 && (
              <Animated.View style={[styles.notifDot, { transform: [{ scale: dotPulse }] }]} />
            )}
          </View>
          <Text style={styles.momentText}>{moment.text}</Text>

          {/* Progress dots */}
          <View style={styles.momentDots}>
            {MOMENTS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.momentDot,
                  i === momentIndex && styles.momentDotActive,
                  i < momentIndex  && styles.momentDotPast,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Divider ── */}
        {showStats && (
          <Animated.View style={[styles.divider, {
            width: dividerW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        )}

        {/* ── Stats ── */}
        {showStats && (
          <Animated.View style={[styles.statsWrap, { opacity: statsOpacity, transform: [{ translateY: statsY }] }]}>
            <Text style={styles.statsHeadline}>
              This isn't a{' '}
              <Text style={styles.statsHeadlineAccent}>you</Text>
              {' '}problem.{'\n'}This is everyone.
            </Text>

            <View style={styles.statsRow}>
              {STATS.map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statNumber}>{s.number}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* The real gut-punch line */}
            <View style={styles.gutPunchWrap}>
              <LinearGradient
                colors={['rgba(255,70,20,0.08)', 'rgba(255,70,20,0.04)']}
                style={styles.gutPunchGrad}
              >
                <Text style={styles.gutPunchLine}>
                  "I'll just check this one thing"{' '}
                  <Text style={styles.gutPunchAccent}>is the most expensive lie</Text>
                  {' '}you tell yourself every day.
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* ── CTA ── */}
        {showCTA && (
          <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={handleContinue}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#FF9030', '#FF5E0E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaTxt}>That's me — show me the fix</Text>
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
  scroll:{ flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 32, gap: 28 },

  // Background bleed
  bgBleed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF3300',
    opacity: 0,
  },

  // Header
  headerWrap: { gap: 12 },
  eyebrow: {
    fontFamily:    FONTS.bold,
    fontSize:      11,
    letterSpacing: 3.5,
    color:         'rgba(255,100,30,0.60)',
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily:    FONTS.black,
    fontSize:      34,
    color:         COLORS.cream,
    lineHeight:    42,
    letterSpacing: -0.6,
  },
  headlineAccent: {
    color: COLORS.orange,
  },

  // Moment card
  momentCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
    padding:         28,
    alignItems:      'center',
    gap:             18,
    // Warm inner glow
    shadowColor:    '#FF5500',
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.20,
    shadowRadius:   24,
    elevation:      4,
  },
  momentIconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentIcon: {
    fontSize: 64,
    lineHeight: 76,
  },
  notifDot: {
    position:        'absolute',
    top:             4,
    right:           -6,
    width:           14,
    height:          14,
    borderRadius:    7,
    backgroundColor: '#FF3333',
    borderWidth:     2,
    borderColor:     '#0E0604',
  },
  momentText: {
    fontFamily: FONTS.bold,
    fontSize:   20,
    color:      COLORS.cream,
    textAlign:  'center',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  momentDots: {
    flexDirection: 'row',
    gap:           8,
    marginTop:     4,
  },
  momentDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  momentDotActive: {
    backgroundColor: COLORS.orange,
    width:           20,
  },
  momentDotPast: {
    backgroundColor: 'rgba(255,107,26,0.35)',
  },

  // Divider
  divider: {
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius:    1,
  },

  // Stats
  statsWrap: { gap: 22 },
  statsHeadline: {
    fontFamily:    FONTS.black,
    fontSize:      26,
    color:         COLORS.cream,
    lineHeight:    34,
    letterSpacing: -0.4,
  },
  statsHeadlineAccent: {
    color: COLORS.orange,
  },

  statsRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    gap:             8,
  },
  statItem: {
    flex:       1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
    padding:         14,
    alignItems:      'center',
    gap:             4,
  },
  statNumber: {
    fontFamily:    FONTS.black,
    fontSize:      22,
    color:         COLORS.amber,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize:   10,
    color:      'rgba(255,244,230,0.40)',
    textAlign:  'center',
    lineHeight: 14,
  },

  // Gut-punch quote
  gutPunchWrap: {
    borderRadius: 16,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  'rgba(255,70,20,0.18)',
  },
  gutPunchGrad: {
    padding: 20,
  },
  gutPunchLine: {
    fontFamily:  FONTS.regular,
    fontSize:    16,
    color:       'rgba(255,244,230,0.60)',
    lineHeight:  24,
    fontStyle:   'italic',
  },
  gutPunchAccent: {
    fontFamily: FONTS.bold,
    color:      COLORS.orange,
    fontStyle:  'normal',
  },

  // CTA
  ctaWrap: {
    paddingTop:    8,
    paddingBottom: 16,
  },
  ctaBtn: {
    borderRadius:  22,
    overflow:      'hidden',
    shadowColor:   '#FF6600',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius:  16,
    elevation:     8,
  },
  ctaGrad: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    paddingVertical:   20,
    paddingHorizontal: 28,
    gap: 10,
  },
  ctaTxt: {
    fontFamily:    FONTS.black,
    fontSize:      17,
    color:         '#1A0602',
    letterSpacing: 0.2,
  },
  ctaArrow: {
    fontFamily: FONTS.black,
    fontSize:   18,
    color:      '#1A0602',
  },
});
