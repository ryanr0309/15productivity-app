/**
 * app/onboarding/waste.tsx  — Screen 7: The Life Grid
 *
 * Shows a grid where each block = 1 year of life.
 * Grey = years already lived. Dim = years remaining.
 * Red = years that will be lost to phone use, animated flooding in.
 *
 * Reads age + dailyPhoneHours from onboardingStore.
 * Navigates → /onboarding/reframe
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

const { width: SW } = Dimensions.get('window');

const LIFE_EXPECTANCY = 80;
const COLS            = 10;
const GRID_PAD        = 28;
const CELL_GAP        = 5;
const CELL_SIZE       = Math.floor((SW - GRID_PAD * 2 - CELL_GAP * (COLS - 1)) / COLS);
const ROWS            = Math.ceil(LIFE_EXPECTANCY / COLS);
const TOTAL_CELLS     = LIFE_EXPECTANCY;

// ── Calculations ──────────────────────────────────────────────────────────────
function calcStats(age: number, dailyHours: number) {
  const yearsLeft        = Math.max(LIFE_EXPECTANCY - age, 0);
  // Hours phone / day → hours/year → years
  const yearsOnPhone     = (dailyHours * 365) / 8760; // 8760h in a year
  const yearsWasted      = Math.round(yearsOnPhone * yearsLeft * 10) / 10;
  const wastedDays       = Math.round(dailyHours * 365);
  const wastedHours      = Math.round(dailyHours * 365 * yearsLeft);

  // Which cells are which
  const livedCells  = Math.min(age, TOTAL_CELLS);
  // How many remaining cells will be "wasted" — highlight proportionally
  const wastedCells = Math.min(Math.round(yearsWasted), yearsLeft);

  return { yearsLeft, yearsWasted, wastedDays, wastedHours, livedCells, wastedCells };
}

// ── Individual cell ───────────────────────────────────────────────────────────
type CellState = 'lived' | 'wasted' | 'remaining';

function GridCell({
  state,
  delay,
  isAnimating,
  index,
}: {
  state:       CellState;
  delay:       number;
  isAnimating: boolean;
  index:       number;
}) {
  const scale   = useRef(new Animated.Value(state === 'wasted' ? 0.4 : 1)).current;
  const opacity = useRef(new Animated.Value(
    state === 'lived' ? 0 : state === 'remaining' ? 0 : 0
  )).current;

  // Grid entrance — all cells fade in first
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, {
        toValue:  state === 'lived' ? 0.38 : state === 'remaining' ? 0.14 : 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Wasted cells pulse in after entrance
  useEffect(() => {
    if (!isAnimating || state !== 'wasted') return;
    Animated.sequence([
      Animated.delay(delay + 800),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1, tension: 120, friction: 5, useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1, duration: 180, useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [isAnimating]);

  const bgColor = state === 'lived'
    ? 'rgba(255,244,230,0.38)'
    : state === 'wasted'
    ? '#FF2D00'
    : 'rgba(255,244,230,0.14)';

  const shadowProps = state === 'wasted' ? {
    shadowColor:   '#FF2D00',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius:  4,
    elevation:     4,
  } : {};

  return (
    <Animated.View
      style={[
        styles.cell,
        { backgroundColor: bgColor, opacity, transform: [{ scale }] },
        shadowProps,
      ]}
    />
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function WasteScreen() {
  const insets    = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  const age             = useOnboardingStore(s => (s as any).age as number)             ?? 28;
  const dailyPhoneHours = useOnboardingStore(s => (s as any).dailyPhoneHours as number) ?? 4;

  const { yearsLeft, yearsWasted, wastedDays, wastedHours, livedCells, wastedCells } =
    calcStats(age, dailyPhoneHours);

  // Animation phases
  const [phase, setPhase] = useState<'grid' | 'flood' | 'reveal'>('grid');

  // Header
  const headerA = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(14)).current;

  // Counter that counts up the wasted years number
  const counterVal = useRef(new Animated.Value(0)).current;
  const [displayYears, setDisplayYears] = useState(0);

  // Stats fade in
  const statsA = useRef(new Animated.Value(0)).current;
  const statsY = useRef(new Animated.Value(16)).current;
  const ctaA   = useRef(new Animated.Value(0)).current;
  const ctaY   = useRef(new Animated.Value(14)).current;

  // Pulse on the wasted number once revealed
  const numberPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Header fades in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(headerA, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // 2. After grid entrance completes, start flooding red
    const floodDelay = TOTAL_CELLS * 8 + 1000; // grid entrance duration + buffer
    setTimeout(() => setPhase('flood'), floodDelay);

    // 3. Counter ticks up
    setTimeout(() => {
      counterVal.addListener(({ value }) => setDisplayYears(Math.round(value * 10) / 10));
      Animated.timing(counterVal, {
        toValue:  yearsWasted,
        duration: Math.max(wastedCells * 90, 800),
        easing:   Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }, floodDelay + 600);

    // 4. Stats + CTA appear after flood
    const revealDelay = floodDelay + Math.max(wastedCells * 90, 800) + 400;
    setTimeout(() => {
      setPhase('reveal');
      Animated.parallel([
        Animated.timing(statsA, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(statsY, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, revealDelay);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ctaA, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(ctaY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();

      // Heartbeat pulse on wasted number
      Animated.loop(Animated.sequence([
        Animated.timing(numberPulse, { toValue: 1.06, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(numberPulse, { toValue: 1.00, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    }, revealDelay + 400);

    return () => counterVal.removeAllListeners();
  }, []);

  if (!fontsLoaded) return null;

  // Build cell states
  const cells: CellState[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (i < livedCells)                              cells.push('lived');
    else if (i < livedCells + wastedCells)           cells.push('wasted');
    else                                              cells.push('remaining');
  }

  const yearsDisplay = displayYears.toFixed(1);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060200', '#0C0400', '#120500']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle red ambient glow at bottom — only appears after flood, sits behind content */}
      {phase !== 'grid' && (
        <Animated.View
          pointerEvents="none"
          style={[styles.redGlow, { opacity: statsA }]}
        />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={phase === 'reveal'}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <OnboardingProgress step={7} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
          <Text style={styles.eyebrow}>YOUR LIFE IN YEARS</Text>
          <Text style={styles.headline}>
            Each block is{'\n'}
            <Text style={styles.headlineAccent}>one year</Text>
            {' '}of your life.
          </Text>
        </Animated.View>

        {/* Legend */}
        <Animated.View style={[styles.legend, { opacity: headerA }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(255,244,230,0.38)' }]} />
            <Text style={styles.legendLabel}>Lived ({age}y)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF2D00', shadowColor: '#FF2D00', shadowOpacity: 1, shadowRadius: 4 }]} />
            <Text style={styles.legendLabel}>Lost to phone</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(255,244,230,0.14)' }]} />
            <Text style={styles.legendLabel}>Remaining</Text>
          </View>
        </Animated.View>

        {/* THE GRID */}
        <View style={styles.grid}>
          {cells.map((state, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            // Stagger: top-left first for lived, then left-to-right flood for wasted
            const entranceDelay = state === 'lived'
              ? (row * COLS + col) * 8
              : state === 'remaining'
              ? (row * COLS + col) * 8
              : (i - livedCells) * 90; // flood wasted left-to-right

            return (
              <GridCell
                key={i}
                index={i}
                state={state}
                delay={state === 'wasted' ? (i - livedCells) * 90 : (row * COLS + col) * 8}
                isAnimating={phase === 'flood' || phase === 'reveal'}
              />
            );
          })}
        </View>

        {/* Wasted counter — appears during flood */}
        {phase !== 'grid' && (
          <Animated.View style={[styles.counterWrap, { opacity: statsA }]}>
            <Animated.Text style={[styles.counterNum, { transform: [{ scale: numberPulse }] }]}>
              {yearsDisplay}
            </Animated.Text>
            <Text style={styles.counterLabel}>years lost to your phone</Text>
          </Animated.View>
        )}

        {/* Stats breakdown */}
        {phase === 'reveal' && (
          <Animated.View style={[styles.statsWrap, { opacity: statsA, transform: [{ translateY: statsY }] }]}>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{wastedDays.toLocaleString()}</Text>
                <Text style={styles.statLbl}>days per year{'\n'}on your phone</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{wastedHours.toLocaleString()}</Text>
                <Text style={styles.statLbl}>hours left{'\n'}that will be wasted</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{yearsLeft}</Text>
                <Text style={styles.statLbl}>years you{'\n'}have remaining</Text>
              </View>
            </View>

            {/* The gut-punch */}
            <View style={styles.punchCard}>
              <LinearGradient
                colors={['rgba(255,45,0,0.12)', 'rgba(255,45,0,0.06)']}
                style={styles.punchGrad}
              >
                <Text style={styles.punchText}>
                  That's{' '}
                  <Text style={styles.punchAccent}>{yearsDisplay} years</Text>
                  {' '}you'll never get back — spent watching other people live their lives.
                </Text>
              </LinearGradient>
            </View>

            {/* Reframe hook */}
            <Text style={styles.hook}>
              But here's the thing —
            </Text>
          </Animated.View>
        )}

        {/* CTA */}
        {phase === 'reveal' && (
          <Animated.View style={[styles.ctaWrap, { opacity: ctaA, transform: [{ translateY: ctaY }] }]}>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/(onboarding)/reframe')}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#FF9030', '#FF5E0E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaTxt}>It doesn't have to be this way</Text>
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
  root:  { flex: 1, backgroundColor: '#060200' },
  scroll: { flex: 1, zIndex: 1 },
  scrollContent: { paddingHorizontal: GRID_PAD, gap: 20 },

  redGlow: {
    position:  'absolute',
    bottom:    0,
    left:      0,
    right:     0,
    height:    320,
    // Transparent to dark-red gradient rising from bottom edge only
    // No backgroundColor — the gradient does all the work
    shadowColor:   '#FF1500',
    shadowOffset:  { width: 0, height: -20 },
    shadowOpacity: 0.18,
    shadowRadius:  60,
    // Must be behind ScrollView
    zIndex: 0,
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

  header:   { gap: 8 },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: 'rgba(255,100,30,0.55)', textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FONTS.black, fontSize: 30,
    color: COLORS.cream, lineHeight: 38, letterSpacing: -0.4,
  },
  headlineAccent: { color: COLORS.amber },

  legend: {
    flexDirection: 'row', gap: 18, flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: {
    width: 10, height: 10, borderRadius: 3,
  },
  legendLabel: {
    fontFamily: FONTS.regular, fontSize: 11,
    color: 'rgba(255,244,230,0.40)',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           CELL_GAP,
  },
  cell: {
    width:        CELL_SIZE,
    height:       CELL_SIZE,
    borderRadius: 3,
  },

  // Counter
  counterWrap: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  counterNum: {
    fontFamily:    FONTS.black,
    fontSize:      72,
    color:         '#FF2D00',
    letterSpacing: -2,
    lineHeight:    80,
    // Text glow via shadow
    textShadowColor:  '#FF2D00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  counterLabel: {
    fontFamily: FONTS.bold, fontSize: 16,
    color: 'rgba(255,180,160,0.75)',
    letterSpacing: 0.3,
  },

  // Stats
  statsWrap: { gap: 18 },
  statRow: {
    flexDirection:   'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
    padding:         18,
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 5 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
  statNum: {
    fontFamily: FONTS.black, fontSize: 22,
    color: '#FF6644', letterSpacing: -0.5,
  },
  statLbl: {
    fontFamily: FONTS.regular, fontSize: 10,
    color: 'rgba(255,244,230,0.35)',
    textAlign: 'center', lineHeight: 15,
  },

  punchCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,45,0,0.20)',
  },
  punchGrad:  { padding: 20 },
  punchText: {
    fontFamily: FONTS.regular, fontSize: 16,
    color: 'rgba(255,244,230,0.65)',
    lineHeight: 24, fontStyle: 'italic',
  },
  punchAccent: {
    fontFamily: FONTS.black, color: '#FF4422', fontStyle: 'normal',
  },

  hook: {
    fontFamily:    FONTS.black,
    fontSize:      22,
    color:         COLORS.cream,
    letterSpacing: -0.3,
    textAlign:     'center',
    paddingVertical: 4,
  },

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
  ctaTxt: {
    fontFamily: FONTS.black, fontSize: 17,
    color: '#1A0602', letterSpacing: 0.2,
  },
  ctaArrow: { fontFamily: FONTS.black, fontSize: 18, color: '#1A0602' },
});
