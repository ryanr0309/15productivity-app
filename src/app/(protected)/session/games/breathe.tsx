/**
 * Ember – BreathingOrbGame.tsx
 *
 * WHERE THIS LIVES:
 *   app/(protected)/session/games/breathe.tsx
 *
 * FULL BREATHING CYCLE:
 *   Breathe In  → 4 seconds (orb expands)
 *   Hold        → 4 seconds (orb stays large)
 *   Breathe Out → 4 seconds (orb contracts)
 *   Hold        → 2 seconds (orb stays small)
 *   Repeat — 6 cycles total (~84 seconds), then auto-completes
 *
 * Break countdown bar drains in real time.
 * Session timer still ticking from store.
 * "End break ›" returns to session, calls completeCheckpoint().
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  useSessionStore,
  selectTimeDisplay,
  CHECKPOINT_BREAK_SEC,
} from '../../../../store/sessionStore';
import { COLORS, FONTS } from '../../../../theme';
import { useBreakTimer } from '../../../../hooks/useBreakTimer';
import { BreakStatusBar } from '../../../../components/BreakStatusBar';

const { width } = Dimensions.get('window');

// ─── Breathing pattern ────────────────────────────────────────────────────────
type Phase = 'in' | 'hold-in' | 'out' | 'hold-out';

interface BreathPhase {
  phase:       Phase;
  label:       string;
  instruction: string;
  durationSec: number;
  orbScale:    number; // target scale for orb during this phase
}

const BREATH_PATTERN: BreathPhase[] = [
  { phase: 'in',       label: 'Breathe In',  instruction: 'Expand with the orb · follow its rhythm', durationSec: 4, orbScale: 1.28 },
  { phase: 'hold-in',  label: 'Hold',        instruction: 'Hold gently · stay still',                durationSec: 4, orbScale: 1.28 },
  { phase: 'out',      label: 'Breathe Out', instruction: 'Let it go · release slowly',               durationSec: 4, orbScale: 0.72 },
  { phase: 'hold-out', label: 'Hold',        instruction: 'Pause · feel the stillness',               durationSec: 2, orbScale: 0.72 },
];

const TOTAL_CYCLES   = 6;
const TOTAL_BREAK_SEC = CHECKPOINT_BREAK_SEC; // 120s

// Pre-compute total breathing duration
const CYCLE_DURATION = BREATH_PATTERN.reduce((s, p) => s + p.durationSec, 0); // 14s per cycle

export default function BreathingOrbGame() {
  const insets       = useSafeAreaInsets();
  const sessionTime  = useSessionStore(selectTimeDisplay);
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);
  useBreakTimer()
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  // ── Breathing state ────────────────────────────────────────────────────────
  const [phaseIndex,  setPhaseIndex]  = useState(0);
  const [countdown,   setCountdown]   = useState(BREATH_PATTERN[0].durationSec);
  const [cyclesDone,  setCyclesDone]  = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [finished,    setFinished]    = useState(false);

  const phaseRef    = useRef(phaseIndex);
  const cycleRef    = useRef(cyclesDone);
  phaseRef.current  = phaseIndex;
  cycleRef.current  = cyclesDone;

  // ── Animated values ────────────────────────────────────────────────────────
  const orbScale    = useRef(new Animated.Value(1)).current;
  const orbGlow     = useRef(new Animated.Value(0)).current;   // 0=small glow, 1=large glow
  const ringScale1  = useRef(new Animated.Value(1)).current;
  const ringScale2  = useRef(new Animated.Value(1)).current;
  const ringScale3  = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.12)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const countOpacity = useRef(new Animated.Value(1)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;

  // ── Entry fade ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeIn]);

  // ── Orb animation for each phase ──────────────────────────────────────────
  const animateOrb = useCallback((targetScale: number, dur: number) => {
    const isExpanding = targetScale > 1;

    Animated.parallel([
      Animated.timing(orbScale, {
        toValue:  targetScale,
        duration: dur * 1000,
        easing:   Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(orbGlow, {
        toValue:  isExpanding ? 1 : 0,
        duration: dur * 1000,
        easing:   Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      // Outer rings expand/contract with the orb
      Animated.timing(ringScale1, {
        toValue:  targetScale * 1.22,
        duration: dur * 1000,
        easing:   Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(ringScale2, {
        toValue:  targetScale * 1.48,
        duration: dur * 1000,
        easing:   Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(ringScale3, {
        toValue:  targetScale * 1.74,
        duration: dur * 1000,
        easing:   Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue:  isExpanding ? 0.22 : 0.10,
        duration: dur * 1000,
        easing:   Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]).start();
  }, [orbGlow, orbScale, ringOpacity, ringScale1, ringScale2, ringScale3]);

  // ── Cycle tick: phase countdown + advance ─────────────────────────────────
  useEffect(() => {
    if (finished) return;

    const currentPhase = BREATH_PATTERN[phaseIndex];

    // Start orb animation for this phase
    animateOrb(currentPhase.orbScale, currentPhase.durationSec);

    let remaining = currentPhase.durationSec;
    setCountdown(remaining);

    const tick = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        return;
      }

      clearInterval(tick);

      // Fade phase label out before switching
      Animated.timing(phaseOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        const nextPhaseIndex = (phaseRef.current + 1) % BREATH_PATTERN.length;
        const nextCycles     = nextPhaseIndex === 0 ? cycleRef.current + 1 : cycleRef.current;

        setCyclesDone(nextCycles);
        setPhaseIndex(nextPhaseIndex);

        // Fade label back in
        Animated.timing(phaseOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

        if (nextCycles >= TOTAL_CYCLES) {
          setFinished(true);
        }
      });
    }, 1000);

    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex, finished]);

  // ── Break bar countdown ────────────────────────────────────────────────────

  // ── When breathing finishes early, freeze the counter ────────────────────

  // ── Derived display ────────────────────────────────────────────────────────
  const breakRemaining  = Math.max(TOTAL_BREAK_SEC - breakElapsed, 0);
  const breakBarPct     = breakElapsed / TOTAL_BREAK_SEC;
  const breakMM         = Math.floor(breakRemaining / 60).toString().padStart(2, '0');
  const breakSS         = (breakRemaining % 60).toString().padStart(2, '0');
  const currentPhase    = BREATH_PATTERN[phaseIndex];

  // Glow interpolation
  const glowOpacity = orbGlow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });
  const glowRadius  = orbGlow.interpolate({ inputRange: [0, 1], outputRange: [60, 110] });

  // Completion cycles display (filled dots)
  const totalDots  = TOTAL_CYCLES;
  // A dot fills when a full cycle completes
  const filledDots = cyclesDone;

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background — radial warm bloom */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#0A0603', '#160A04', '#1A0C05', '#0A0603']}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* Warm bloom behind orb */}
      <View style={styles.bgBloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 20 }]}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarIcon}>🔥</Text>
            <Text style={styles.topBarLabel}>BREATHING ORB</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={()=>router.back()} activeOpacity={0.75}>
            <Text style={styles.endBtnText}>← Games</Text>
          </TouchableOpacity>
        </View>

        {/* ── Session running pill ── */}
        <BreakStatusBar />

        {/* ── Orb area ── */}
        <View style={styles.orbArea}>

          {/* Concentric rings */}
          <Animated.View style={[styles.ring, styles.ring3, { transform: [{ scale: ringScale3 }], opacity: ringOpacity }]} />
          <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ringScale2 }], opacity: ringOpacity }]} />
          <Animated.View style={[styles.ring, styles.ring1, { transform: [{ scale: ringScale1 }], opacity: ringOpacity }]} />

          {/* Glow bloom behind orb */}
          <Animated.View style={[styles.orbGlowBloom, { opacity: glowOpacity }]} />

          {/* The orb */}
          <Animated.View style={[styles.orb, { transform: [{ scale: orbScale }] }]}>
            <LinearGradient
              colors={['#FFCC44', '#FF7722', '#EE3300']}
              locations={[0, 0.45, 1]}
              start={{ x: 0.3, y: 0.15 }}
              end={{ x: 0.8, y: 0.9 }}
              style={styles.orbGradient}
            />
          </Animated.View>

        </View>

        {/* ── Phase label + count ── */}
        <Animated.View style={[styles.phaseWrap, { opacity: phaseOpacity }]}>
          <Text style={styles.phaseLabel}>{currentPhase.label}</Text>
          <Text style={styles.phaseCount}>{countdown}</Text>
          <Text style={styles.phaseInstruction}>{currentPhase.instruction}</Text>
        </Animated.View>

        {/* ── Cycle dots ── */}
        <View style={styles.cycleDotsRow}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.cycleDot,
                i < filledDots && styles.cycleDotFilled,
                i === filledDots && styles.cycleDotActive,
              ]}
            />
          ))}
        </View>

        {/* ── Break time bar ── */}
       

      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ORB_BASE = Math.round(width * 0.44); // base orb diameter before scale
const RING_BASE = ORB_BASE;

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0A0603',
  },

  bgBloom: {
    position:        'absolute',
    top:             '15%',
    alignSelf:       'center',
    width:           width * 1.0,
    height:          width * 1.0,
    borderRadius:    width * 0.5,
    backgroundColor: 'transparent',
    shadowColor:     '#FF5500',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.50,
    shadowRadius:    140,
    elevation:       0,
  },

  content: {
    flex:              1,
    alignItems:        'center',
    paddingHorizontal: 24,
  },

  // Top bar
  topBar: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    width:           '100%',
    marginBottom:    18,
    zIndex:          100,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  topBarIcon:  { fontSize: 14 },
  topBarLabel: {
    fontFamily:    FONTS.regular,
    fontSize:      11,
    letterSpacing: 3,
    color:         'rgba(255,244,230,0.38)',
    textTransform: 'uppercase',
  },
  endBtn: {
    backgroundColor:   'rgba(255,255,255,0.07)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.12)',
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:    8,
  },
  endBtnText: {
    fontFamily: FONTS.bold,
    fontSize:   13,
    color:      'rgba(255,244,230,0.60)',
  },

  // Session pill
  sessionPill: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,107,26,0.10)',
    borderWidth:       1,
    borderColor:       'rgba(255,107,26,0.22)',
    borderRadius:      20,
    paddingHorizontal: 14,
    paddingVertical:    7,
    alignSelf:         'flex-start',
    marginBottom:      32,
    gap:               8,
  },
  sessionDot: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: COLORS.orange,
  },
  sessionPillText: {
    fontFamily: FONTS.regular,
    fontSize:   13,
    color:      'rgba(255,244,230,0.60)',
  },
  sessionPillTime: {
    fontFamily:    FONTS.bold,
    fontSize:      14,
    color:         COLORS.orange,
    letterSpacing: 0.5,
  },

  // Orb area
  orbArea: {
    width:           width * 0.82,
    height:          width * 0.82,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    28,
  },

  // Rings
  ring: {
    position:        'absolute',
    borderRadius:    9999,
    borderWidth:     1,
    borderColor:     'rgba(255,107,26,0.60)',
  },
  ring1: { width: RING_BASE * 1.22, height: RING_BASE * 1.22 },
  ring2: { width: RING_BASE * 1.48, height: RING_BASE * 1.48 },
  ring3: { width: RING_BASE * 1.74, height: RING_BASE * 1.74 },

  // Orb
  orbGlowBloom: {
    position:        'absolute',
    width:           ORB_BASE * 1.4,
    height:          ORB_BASE * 1.4,
    borderRadius:    ORB_BASE * 0.7,
    backgroundColor: '#FF6B1A',
    shadowColor:     '#FF6B1A',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    50,
    elevation:       0,
  },
  orb: {
    width:        ORB_BASE,
    height:       ORB_BASE,
    borderRadius: ORB_BASE / 2,
    overflow:     'hidden',
    shadowColor:  '#FF5500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.80,
    shadowRadius:  30,
    elevation:     16,
  },
  orbGradient: {
    width:  '100%',
    height: '100%',
  },

  // Phase text
  phaseWrap: {
    alignItems:   'center',
    marginBottom: 24,
  },
  phaseLabel: {
    fontFamily:    FONTS.black,
    fontSize:      26,
    color:         COLORS.cream,
    letterSpacing: -0.5,
    marginBottom:  6,
  },
  phaseCount: {
    fontFamily:    FONTS.black,
    fontSize:      56,
    color:         COLORS.orange,
    letterSpacing: 2,
    lineHeight:    60,
    marginBottom:  10,
  },
  phaseInstruction: {
    fontFamily:    FONTS.regular,
    fontSize:      14,
    color:         'rgba(255,244,230,0.45)',
    textAlign:     'center',
    letterSpacing: 0.2,
  },

  // Cycle dots
  cycleDotsRow: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  32,
  },
  cycleDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cycleDotFilled: {
    backgroundColor: COLORS.orange,
  },
  cycleDotActive: {
    backgroundColor: 'rgba(255,107,26,0.45)',
    borderWidth:     1.5,
    borderColor:     COLORS.orange,
  },

  // Break bar
  breakBarSection: {
    width:        '100%',
    marginTop:    'auto',
    paddingBottom: 12,
  },
  breakBarRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  breakBarLabel: {
    fontFamily: FONTS.regular,
    fontSize:   12,
    color:      'rgba(255,244,230,0.32)',
  },
  breakBarTime: {
    fontFamily:    FONTS.bold,
    fontSize:      12,
    color:         COLORS.orange,
    letterSpacing: 0.3,
  },
  breakBarTrack: {
    height:          4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius:    2,
    overflow:        'hidden',
  },
  breakBarFill: {
    height:       '100%',
    borderRadius: 2,
    minWidth:     4,
  },
});
