/**
 * app/onboarding/science.tsx  — Screen 9: The Science
 *
 * Explains WHY Ember works. Three-act structure:
 *   1. Why willpower fails (the depletion model)
 *   2. What the research actually says about breaks
 *   3. Why active reset (games) beats passive rest
 *
 * Tone: credible, slightly nerdy but warm. Not a lecture — a revelation.
 * NAVIGATION → /onboarding/reveal
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
const PAD = 28;

// ── Brain battery meter ───────────────────────────────────────────────────────
// Animated bar that drains, then refills
function BrainBattery({ phase }: { phase: 'full' | 'drained' | 'refilled' }) {
  const fillW   = useRef(new Animated.Value(1)).current;
  const fillCol = useRef(new Animated.Value(0)).current; // 0=green,1=red,2=amber

  useEffect(() => {
    if (phase === 'drained') {
      Animated.timing(fillW, {
        toValue: 0.12,
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();
      Animated.timing(fillCol, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    } else if (phase === 'refilled') {
      Animated.spring(fillW, {
        toValue: 0.9,
        tension: 40, friction: 8,
        useNativeDriver: false,
      }).start();
      Animated.timing(fillCol, {
        toValue: 2,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [phase]);

  const bgColor = fillCol.interpolate({
    inputRange:  [0,       1,         2       ],
    outputRange: ['#44CC66', '#FF3322', '#FFAA33'],
  });

  const pct = fillW.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  const label = phase === 'full' ? 'Full focus capacity' :
                phase === 'drained' ? 'Focus depleted' : 'Restored ✓';

  const labelColor = phase === 'drained' ? '#FF5533' :
                     phase === 'refilled' ? COLORS.amber : '#66DD88';

  return (
    <View style={battery.wrap}>
      <View style={battery.track}>
        <Animated.View style={[battery.fill, { width: pct }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
        </Animated.View>
        {/* Segment lines */}
        {[0.25, 0.5, 0.75].map(p => (
          <View key={p} style={[battery.seg, { left: `${p * 100}%` as any }]} />
        ))}
      </View>
      <View style={battery.cap} />
      <Text style={[battery.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const battery = StyleSheet.create({
  wrap:  { gap: 8 },
  track: {
    height: 22, borderRadius: 6, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row', position: 'relative',
    width: SW - PAD * 2 - 48 - 10, // minus card padding + cap
  },
  fill:  { height: '100%', borderRadius: 5, overflow: 'hidden', minWidth: 6 },
  cap: {
    width: 6, height: 12, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginLeft: 4,
  },
  seg: {
    position: 'absolute', top: 4, bottom: 4,
    width: 1, backgroundColor: 'rgba(0,0,0,0.25)',
  },
  label: {
    fontFamily: FONTS.bold, fontSize: 12,
    letterSpacing: 0.3,
  },
});

// ── Comparison row: passive vs active break ───────────────────────────────────
function BreakComparison({ visible }: { visible: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  const y    = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(y,    { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const PASSIVE = [
    { icon: '📱', text: 'Scroll social media', result: '↑ cortisol, no reset' },
    { icon: '📺', text: 'Watch more video',    result: 'more passive consumption' },
    { icon: '😐', text: 'Stare at nothing',   result: 'mind stays in work mode' },
  ];
  const ACTIVE = [
    { icon: '🎮', text: 'Quick skill game',    result: '↓ stress, pattern interrupt' },
    { icon: '🧩', text: 'Light puzzle',        result: 'different brain network fires' },
    { icon: '⚡', text: 'Reflex challenge',    result: 'full attention reset achieved' },
  ];

  return (
    <Animated.View style={[comp.wrap, { opacity: anim, transform: [{ translateY: y }] }]}>
      {/* Passive */}
      <View style={comp.col}>
        <View style={comp.colHeader}>
          <View style={[comp.colBadge, { borderColor: 'rgba(255,80,50,0.30)', backgroundColor: 'rgba(255,80,50,0.08)' }]}>
            <Text style={[comp.colBadgeTxt, { color: '#FF6644' }]}>Passive break</Text>
          </View>
        </View>
        {PASSIVE.map((r, i) => (
          <View key={i} style={comp.row}>
            <Text style={comp.rowIcon}>{r.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={comp.rowText}>{r.text}</Text>
              <Text style={[comp.rowResult, { color: '#FF6644' }]}>{r.result}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={comp.divider} />

      {/* Active */}
      <View style={comp.col}>
        <View style={comp.colHeader}>
          <View style={[comp.colBadge, { borderColor: 'rgba(255,170,50,0.30)', backgroundColor: 'rgba(255,170,50,0.08)' }]}>
            <Text style={[comp.colBadgeTxt, { color: COLORS.amber }]}>Active reset</Text>
          </View>
        </View>
        {ACTIVE.map((r, i) => (
          <View key={i} style={comp.row}>
            <Text style={comp.rowIcon}>{r.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={comp.rowText}>{r.text}</Text>
              <Text style={[comp.rowResult, { color: COLORS.amber }]}>{r.result}</Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const comp = StyleSheet.create({
  wrap: {
    flexDirection: 'row', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  col:    { flex: 1, gap: 10 },
  colHeader: { marginBottom: 2 },
  colBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  colBadgeTxt: { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 0.5 },
  row:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  rowIcon: { fontSize: 14, marginTop: 1 },
  rowText: {
    fontFamily: FONTS.bold, fontSize: 11,
    color: 'rgba(255,244,230,0.70)', lineHeight: 16,
  },
  rowResult: {
    fontFamily: FONTS.regular, fontSize: 10,
    lineHeight: 15, marginTop: 1,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 4,
  },
});

// ── Science stat pill ─────────────────────────────────────────────────────────
function StatPill({
  stat, desc, delay, parentAnim,
}: {
  stat: string; desc: string; delay: number; parentAnim: Animated.Value;
}) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const a     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
        Animated.timing(a, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[pill.wrap, { opacity: a, transform: [{ scale }] }]}>
      <Text style={pill.stat}>{stat}</Text>
      <Text style={pill.desc}>{desc}</Text>
    </Animated.View>
  );
}

const pill = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', gap: 5,
  },
  stat: {
    fontFamily: FONTS.black, fontSize: 22,
    color: COLORS.amber, letterSpacing: -0.5, textAlign: 'center',
  },
  desc: {
    fontFamily: FONTS.regular, fontSize: 11,
    color: 'rgba(255,244,230,0.40)',
    textAlign: 'center', lineHeight: 15,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
type Phase = 'willpower' | 'breaks' | 'games' | 'done';

export default function ScienceScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  const [phase,       setPhase]       = useState<Phase>('willpower');
  const [batteryMode, setBatteryMode] = useState<'full' | 'drained' | 'refilled'>('full');
  const [showBreaks,  setShowBreaks]  = useState(false);
  const [showGames,   setShowGames]   = useState(false);
  const [showStats,   setShowStats]   = useState(false);
  const [showCTA,     setShowCTA]     = useState(false);

  // Section anims
  const headerA  = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(16)).current;
  const act1A    = useRef(new Animated.Value(0)).current;
  const act1Y    = useRef(new Animated.Value(16)).current;
  const act2A    = useRef(new Animated.Value(0)).current;
  const act2Y    = useRef(new Animated.Value(16)).current;
  const act3A    = useRef(new Animated.Value(0)).current;
  const act3Y    = useRef(new Animated.Value(16)).current;
  const statsA   = useRef(new Animated.Value(0)).current;
  const ctaA     = useRef(new Animated.Value(0)).current;
  const ctaY     = useRef(new Animated.Value(14)).current;

  const fadeIn = (a: Animated.Value, y: Animated.Value, delay = 0, cb?: () => void) => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(a, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start(cb ? ({ finished }) => { if (finished) cb(); } : undefined);
  };

  useEffect(() => {
    // Header
    fadeIn(headerA, headerY, 200);

    // ACT 1: willpower depletion
    fadeIn(act1A, act1Y, 500, () => {
      // Battery drains
      setTimeout(() => setBatteryMode('drained'), 200);

      // ACT 2: breaks matter
      setTimeout(() => {
        setShowBreaks(true);
        setPhase('breaks');
        fadeIn(act2A, act2Y, 0);
      }, 1800);
    });

    // ACT 3: active games > passive rest
    setTimeout(() => {
      setShowGames(true);
      setPhase('games');
      fadeIn(act3A, act3Y, 0, () => {
        // Battery refills after active reset is shown
        setTimeout(() => setBatteryMode('refilled'), 400);
      });
    }, 4200);

    // Stats + CTA
    setTimeout(() => {
      setShowStats(true);
      setPhase('done');
      Animated.timing(statsA, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 5800);

    setTimeout(() => {
      setShowCTA(true);
      Animated.parallel([
        Animated.timing(ctaA, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ctaY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 6600);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#040508', '#080A10', '#060302']}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Cool-to-warm ambient shift */}
      <Animated.View
        pointerEvents="none"
        style={[styles.ambientShift, { opacity: statsA }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 40,
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
            <OnboardingProgress step={9} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
          <Text style={styles.eyebrow}>THE RESEARCH</Text>
          <Text style={styles.headline}>
            Why willpower{'\n'}
            <Text style={styles.headlineAccent}>always loses.</Text>
          </Text>
        </Animated.View>

        {/* ═══ ACT 1: Willpower depletion ═══ */}
        <Animated.View style={[styles.actCard, { opacity: act1A, transform: [{ translateY: act1Y }] }]}>
          <View style={styles.actLabelRow}>
            <View style={[styles.actBadge, styles.actBadge1]}>
              <Text style={[styles.actBadgeTxt, { color: '#8899FF' }]}>Act 1</Text>
            </View>
          </View>
          <Text style={styles.actTitle}>Your brain has a focus battery.</Text>
          <Text style={styles.actBody}>
            Cognitive control — the mental effort of resisting distractions — draws from a finite pool called{' '}
            <Text style={styles.actEmphasis}>executive function.</Text>
            {' '}Every time you resist the urge to check your phone, that pool gets a little shallower.
          </Text>

          {/* Brain battery */}
          <BrainBattery phase={batteryMode} />

          <Text style={styles.actBody}>
            By afternoon, most people have depleted this resource entirely. You're not weak — you're{' '}
            <Text style={styles.actEmphasis}>running on empty.</Text>
          </Text>
        </Animated.View>

        {/* ═══ ACT 2: Breaks matter ═══ */}
        {showBreaks && (
          <Animated.View style={[styles.actCard, { opacity: act2A, transform: [{ translateY: act2Y }] }]}>
            <View style={styles.actLabelRow}>
              <View style={[styles.actBadge, styles.actBadge2]}>
                <Text style={[styles.actBadgeTxt, { color: COLORS.amber }]}>Act 2</Text>
              </View>
            </View>
            <Text style={styles.actTitle}>Breaks aren't a reward. They're a requirement.</Text>
            <Text style={styles.actBody}>
              Research from the University of Illinois found that brief breaks{' '}
              <Text style={styles.actEmphasis}>dramatically improve focus</Text>
              {' '}over sustained tasks. But there's a catch — not all breaks are equal.
            </Text>

            <View style={styles.researchQuote}>
              <LinearGradient
                colors={['rgba(100,130,255,0.08)', 'rgba(100,130,255,0.04)']}
                style={styles.rqGrad}
              >
                <Text style={styles.rqText}>
                  "Deactivating and reactivating your goals allows you to stay focused."
                </Text>
                <Text style={styles.rqSource}>— University of Illinois, Cognition Lab</Text>
              </LinearGradient>
            </View>

            <Text style={[styles.actBody, { marginTop: 4 }]}>
              The key word:{' '}
              <Text style={styles.actEmphasis}>deactivating.</Text>
              {' '}You need to completely switch mental modes — not just pause.
            </Text>
          </Animated.View>
        )}

        {/* ═══ ACT 3: Active games > passive rest ═══ */}
        {showGames && (
          <Animated.View style={[styles.actCard, { opacity: act3A, transform: [{ translateY: act3Y }] }]}>
            <View style={styles.actLabelRow}>
              <View style={[styles.actBadge, styles.actBadge3]}>
                <Text style={[styles.actBadgeTxt, { color: '#55DDAA' }]}>Act 3</Text>
              </View>
            </View>
            <Text style={styles.actTitle}>Active reset beats passive rest — every time.</Text>
            <Text style={styles.actBody}>
              Passive breaks (scrolling, watching video) keep your default mode network partially engaged. You're consuming, not{' '}
              <Text style={styles.actEmphasis}>resetting.</Text>
            </Text>
            <Text style={styles.actBody}>
              A quick skill-based game fires a completely different neural circuit — the{' '}
              <Text style={styles.actEmphasis}>dorsal attention network</Text>
              {' '}— which fully interrupts rumination and returns you to baseline.
            </Text>

            <BreakComparison visible={showGames} />

            <BrainBattery phase={batteryMode} />
          </Animated.View>
        )}

        {/* ═══ Stats ═══ */}
        {showStats && (
          <Animated.View style={[styles.statsSection, { opacity: statsA }]}>
            <Text style={styles.statsHeadline}>
              The numbers back it up.
            </Text>
            <View style={styles.statsRow}>
              <StatPill stat="40%" desc="more productive with structured breaks vs marathon sessions" delay={0} parentAnim={statsA} />
              <StatPill stat="2min" desc="is all the active reset time you need between focus blocks" delay={120} parentAnim={statsA} />
            </View>
            <View style={styles.statsRow}>
              <StatPill stat="52:17" desc="optimal work-to-break ratio identified by DeskTime study" delay={240} parentAnim={statsA} />
              <StatPill stat="23min" desc="average focus recovery time after a single phone notification" delay={360} parentAnim={statsA} />
            </View>

            {/* The bridge to Ember */}
            <View style={styles.bridgeCard}>
              <LinearGradient
                colors={['rgba(255,150,40,0.12)', 'rgba(255,90,10,0.07)']}
                style={styles.bridgeGrad}
              >
                <Text style={styles.bridgeTitle}>This is exactly what Ember does.</Text>
                <Text style={styles.bridgeBody}>
                  Timed focus blocks. Enforced structured breaks. Mini-games that trigger real cognitive reset. Built on the science, not wishful thinking.
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
              onPress={() => router.push('/(onboarding)/reveal')}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#FF9030', '#FF5E0E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaTxt}>Meet the app built on this</Text>
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
  root:   { flex: 1, backgroundColor: '#040508' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAD, gap: 20 },

  ambientShift: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'transparent',
    shadowColor:   '#FF8800',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius:  80,
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

  header: { gap: 8 },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: 'rgba(100,140,255,0.60)', textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FONTS.black, fontSize: 32,
    color: COLORS.cream, lineHeight: 40, letterSpacing: -0.5,
  },
  headlineAccent: { color: '#8899FF' },

  // Act cards
  actCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 20,
    gap: 14,
  },
  actLabelRow: { flexDirection: 'row' },
  actBadge: {
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  actBadge1: { borderColor: 'rgba(100,130,255,0.25)', backgroundColor: 'rgba(100,130,255,0.08)' },
  actBadge2: { borderColor: 'rgba(255,170,50,0.25)',  backgroundColor: 'rgba(255,170,50,0.08)'  },
  actBadge3: { borderColor: 'rgba(50,220,160,0.25)',  backgroundColor: 'rgba(50,220,160,0.08)'  },
  actBadgeTxt: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1 },

  actTitle: {
    fontFamily: FONTS.black, fontSize: 18,
    color: COLORS.cream, lineHeight: 25, letterSpacing: -0.2,
  },
  actBody: {
    fontFamily: FONTS.regular, fontSize: 14,
    color: 'rgba(255,244,230,0.50)', lineHeight: 22,
  },
  actEmphasis: {
    fontFamily: FONTS.bold,
    color: 'rgba(255,244,230,0.85)',
  },

  // Research quote
  researchQuote: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(100,130,255,0.18)',
  },
  rqGrad: { padding: 16, gap: 6 },
  rqText: {
    fontFamily: FONTS.bold, fontSize: 14,
    color: 'rgba(180,200,255,0.80)',
    lineHeight: 22, fontStyle: 'italic',
  },
  rqSource: {
    fontFamily: FONTS.regular, fontSize: 11,
    color: 'rgba(180,200,255,0.40)',
    letterSpacing: 0.3,
  },

  // Stats section
  statsSection: { gap: 14 },
  statsHeadline: {
    fontFamily: FONTS.black, fontSize: 24,
    color: COLORS.cream, letterSpacing: -0.3,
  },
  statsRow: { flexDirection: 'row', gap: 10 },

  // Bridge card
  bridgeCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,150,40,0.22)',
  },
  bridgeGrad:  { padding: 20, gap: 10 },
  bridgeTitle: {
    fontFamily: FONTS.black, fontSize: 18,
    color: COLORS.cream, letterSpacing: -0.2,
  },
  bridgeBody: {
    fontFamily: FONTS.regular, fontSize: 14,
    color: 'rgba(255,244,230,0.50)', lineHeight: 22,
  },

  // CTA
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
