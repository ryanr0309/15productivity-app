/**
 * Ember – SimonSaysGame.tsx
 *
 * WHERE THIS LIVES:
 *   app/(protected)/session/games/simon.tsx
 *
 * MECHANICS:
 *   - 4 pads in Ember's warm palette (amber, orange, deep red, gold)
 *   - Game shows a sequence by lighting up pads one at a time
 *   - Player must tap the same sequence back
 *   - Each correct round adds one more step
 *   - Wrong tap → brief error flash, sequence replays from same length
 *   - After 10 rounds → game complete, return to session
 *   - Sequence playback slows on early rounds, speeds up as level rises
 *
 * FEEL:
 *   - Each pad lights up with a bloom glow + scale bounce
 *   - Haptic on each pad during playback AND on player tap
 *   - Wrong tap shakes the whole board
 *   - "WATCH" / "YOUR TURN" state label so it's always clear
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSessionStore, selectTimeDisplay } from '../../../../store/sessionStore';
import { COLORS, FONTS } from '../../../../theme';
import { BreakStatusBar } from '../../../../components/BreakStatusBar';

const { width: SW } = Dimensions.get('window');

// ─── Pad definitions ──────────────────────────────────────────────────────────
interface Pad {
  id:       number;
  label:    string;
  color:    string;      // base color (dim state)
  lit:      string;      // bright color when active
  glow:     string;      // shadow color
  haptic:   'light' | 'medium' | 'heavy';
}

const PADS: Pad[] = [
  { id: 0, label: '◆', color: '#3A1E08', lit: '#FF8833', glow: '#FF6B1A', haptic: 'medium'  },
  { id: 1, label: '●', color: '#3A0E0E', lit: '#FF4444', glow: '#DD2222', haptic: 'heavy'   },
  { id: 2, label: '▲', color: '#3A2E00', lit: '#FFD166', glow: '#FFAA33', haptic: 'light'   },
  { id: 3, label: '■', color: '#2A1A00', lit: '#FFAA33', glow: '#FF8800', haptic: 'medium'  },
];

const TOTAL_ROUNDS   = 10;
const BASE_STEP_MS   = 700;   // flash duration per step at level 1
const BASE_GAP_MS    = 250;   // gap between steps
const SPEED_FACTOR   = 0.88;  // multiplied per round (gets faster)

type Phase = 'watching' | 'input' | 'error' | 'complete' | 'starting';

export default function SimonSaysGame() {
  const insets      = useSafeAreaInsets();
  const sessionTime = useSessionStore(selectTimeDisplay);
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);

  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  // ── Game state ─────────────────────────────────────────────────────────────
  const [phase,       setPhase]       = useState<Phase>('starting');
  const [level,       setLevel]       = useState(1);
  const [sequence,    setSequence]    = useState<number[]>([]);
  const [inputIdx,    setInputIdx]    = useState(0);
  const [litPad,      setLitPad]      = useState<number | null>(null);
  const [score,       setScore]       = useState(0);
  const [bestScore,   setBestScore]   = useState(0);
  const [errorPadId,  setErrorPadId]  = useState<number | null>(null);

  const sequenceRef = useRef<number[]>([]);
  const inputRef    = useRef(0);
  const phaseRef    = useRef<Phase>('starting');
  phaseRef.current  = phase;

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const boardShake = useRef(new Animated.Value(0)).current;
  const levelBump  = useRef(new Animated.Value(1)).current;
  // Per-pad scale and glow animations
  const padScales  = useRef(PADS.map(() => new Animated.Value(1))).current;
  const padGlows   = useRef(PADS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeIn]);

  // ── Light up a pad ─────────────────────────────────────────────────────────
  const lightPad = useCallback((padId: number, durationMs: number): Promise<void> => {
    return new Promise(resolve => {
      setLitPad(padId);

      const p = PADS[padId];
      Haptics.impactAsync(
        p.haptic === 'heavy'  ? Haptics.ImpactFeedbackStyle.Heavy  :
        p.haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
                                Haptics.ImpactFeedbackStyle.Light
      );

      Animated.parallel([
        Animated.sequence([
          Animated.spring(padScales[padId], { toValue: 0.93, tension: 300, friction: 6, useNativeDriver: true }),
          Animated.spring(padScales[padId], { toValue: 1.00, tension: 200, friction: 5, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(padGlows[padId], { toValue: 1, duration: 80,          useNativeDriver: true }),
          Animated.timing(padGlows[padId], { toValue: 0, duration: durationMs, useNativeDriver: true }),
        ]),
      ]).start();

      setTimeout(() => {
        setLitPad(null);
        resolve();
      }, durationMs + 60);
    });
  }, [padGlows, padScales]);

  // ── Play sequence ──────────────────────────────────────────────────────────
  const playSequence = useCallback(async (seq: number[], lvl: number) => {
    setPhase('watching');
    setInputIdx(0);
    inputRef.current = 0;

    const stepMs = Math.round(BASE_STEP_MS * Math.pow(SPEED_FACTOR, lvl - 1));
    const gapMs  = Math.round(BASE_GAP_MS  * Math.pow(SPEED_FACTOR, lvl - 1));

    // Small delay before starting
    await new Promise(r => setTimeout(r, 600));

    for (const padId of seq) {
      await lightPad(padId, stepMs);
      await new Promise(r => setTimeout(r, gapMs));
    }

    setPhase('input');
  }, [lightPad]);

  // ── Start / advance ────────────────────────────────────────────────────────
  const startRound = useCallback((lvl: number, existingSeq: number[]) => {
    const newPad = Math.floor(Math.random() * 4);
    const newSeq = [...existingSeq, newPad];
    sequenceRef.current = newSeq;
    setSequence(newSeq);
    setLevel(lvl);

    // Level bump animation
    Animated.sequence([
      Animated.spring(levelBump, { toValue: 1.30, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(levelBump, { toValue: 1.00, tension: 180, friction: 6, useNativeDriver: true }),
    ]).start();

    playSequence(newSeq, lvl);
  }, [levelBump, playSequence]);

  // Begin game
  useEffect(() => {
    const t = setTimeout(() => startRound(1, []), 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle player tap ──────────────────────────────────────────────────────
  const handlePadTap = useCallback((padId: number) => {
    if (phaseRef.current !== 'input') return;

    const idx      = inputRef.current;
    const expected = sequenceRef.current[idx];
    const isCorrect = padId === expected;

    // Light up regardless
    lightPad(padId, 280);

    if (isCorrect) {
      const nextIdx = idx + 1;
      inputRef.current = nextIdx;
      setInputIdx(nextIdx);

      if (nextIdx === sequenceRef.current.length) {
        // Completed this round
        const newScore = sequenceRef.current.length;
        setScore(newScore);
        setBestScore(prev => Math.max(prev, newScore));

        if (sequenceRef.current.length >= TOTAL_ROUNDS) {
          setPhase('complete');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => router.back(), 2000);
        } else {
          setPhase('watching');
          setTimeout(() => startRound(sequenceRef.current.length + 1, sequenceRef.current), 700);
        }
      }
    } else {
      // Wrong — shake board, replay sequence
      setPhase('error');
      setErrorPadId(padId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Animated.sequence([
        Animated.timing(boardShake, { toValue:  10, duration: 60, useNativeDriver: true }),
        Animated.timing(boardShake, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(boardShake, { toValue:   8, duration: 60, useNativeDriver: true }),
        Animated.timing(boardShake, { toValue:  -8, duration: 60, useNativeDriver: true }),
        Animated.timing(boardShake, { toValue:   0, duration: 60, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        setErrorPadId(null);
        // Replay same sequence (no length penalty — just try again)
        playSequence(sequenceRef.current, sequenceRef.current.length);
      }, 900);
    }
  }, [boardShake, lightPad, playSequence, startRound]);

  

  if (!fontsLoaded) return null;

  // ── Phase label ────────────────────────────────────────────────────────────
  const phaseLabel =
    phase === 'watching' ? 'WATCH'     :
    phase === 'input'    ? 'YOUR TURN' :
    phase === 'error'    ? 'TRY AGAIN' :
    phase === 'complete' ? 'PERFECT 🎯':
    '...';

  const phaseColor =
    phase === 'input'    ? COLORS.amber  :
    phase === 'error'    ? '#FF5555'     :
    phase === 'complete' ? '#66DD99'     :
    'rgba(255,244,230,0.38)';

  const PAD_SIZE = Math.round((SW - 40 - 12) / 2); // 2 cols, 12px gap

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0603' }]} />
      <View style={styles.bgBloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 20 }]}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarIcon}>🎵</Text>
            <Text style={styles.topBarLabel}>SIMON SAYS</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={()=>router.back()} activeOpacity={0.75}>
            <Text style={styles.endBtnText}>← Games</Text>
          </TouchableOpacity>
        </View>

<BreakStatusBar />
        {/* ── Score + session row ── */}
        <View style={styles.statsRow}>
          <View style={styles.sessionPill}>
            <View style={styles.sessionDot} />
            <Text style={styles.sessionTime}>{sessionTime}</Text>
          </View>

          <Animated.View style={[styles.levelBadge, { transform: [{ scale: levelBump }] }]}>
            <Text style={styles.levelNum}>{level}</Text>
            <Text style={styles.levelLabel}>/ {TOTAL_ROUNDS}</Text>
          </Animated.View>

          <View style={styles.scorePill}>
            <Text style={styles.scoreVal}>{score}</Text>
            <Text style={styles.scoreLabel}> best {bestScore}</Text>
          </View>
        </View>

        {/* ── Phase label ── */}
        <View style={styles.phaseLabelWrap}>
          <Text style={[styles.phaseLabel, { color: phaseColor }]}>{phaseLabel}</Text>
          {phase === 'input' && (
            <Text style={styles.phaseProgress}>
              {inputIdx}/{sequence.length}
            </Text>
          )}
        </View>

        {/* ── Board ── */}
        <Animated.View style={[
          styles.board,
          { transform: [{ translateX: boardShake }] },
        ]}>
          {PADS.map((pad, i) => {
            const isLit   = litPad === pad.id;
            const isError = errorPadId === pad.id;
            const glowOp  = padGlows[i].interpolate({ inputRange: [0,1], outputRange: [0, 1] });
            const isDisabled = phase !== 'input';

            return (
              <TouchableOpacity
                key={pad.id}
                activeOpacity={0.80}
                disabled={isDisabled}
                onPress={() => handlePadTap(pad.id)}
                style={{ width: PAD_SIZE, height: PAD_SIZE }}
              >
                <Animated.View style={[
                  styles.pad,
                  {
                    width:           PAD_SIZE,
                    height:          PAD_SIZE,
                    backgroundColor: isError ? '#4A0E0E' : (isLit ? pad.lit + '33' : pad.color),
                    borderColor:     isError ? '#FF3333' : (isLit ? pad.lit : 'rgba(255,255,255,0.07)'),
                    transform:       [{ scale: padScales[i] }],
                  },
                ]}>
                  {/* Glow bloom */}
                  <Animated.View style={[
                    styles.padGlow,
                    {
                      backgroundColor: pad.glow,
                      opacity: glowOp,
                    },
                  ]} />

                  {/* Lit fill overlay */}
                  {isLit && (
                    <View style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: pad.lit + '22', borderRadius: 24 },
                    ]} />
                  )}

                  {/* Icon */}
                  <Text style={[
                    styles.padIcon,
                    { color: isLit ? pad.lit : pad.lit + '55' },
                  ]}>
                    {pad.label}
                  </Text>

                  {/* Disabled overlay when watching */}
                  {isDisabled && phase === 'watching' && (
                    <View style={[StyleSheet.absoluteFill, styles.padDisabledOverlay]} />
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ── Sequence progress dots ── */}
        <View style={styles.seqDotsRow}>
          {sequence.map((padId, i) => (
            <View
              key={i}
              style={[
                styles.seqDot,
                { backgroundColor: i < inputIdx ? PADS[padId].lit : 'rgba(255,255,255,0.12)' },
              ]}
            />
          ))}
        </View>

        {/* ── Instruction ── */}
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            {phase === 'watching'
              ? 'Watch the sequence carefully…'
              : phase === 'input'
              ? 'Repeat the sequence in order'
              : phase === 'error'
              ? 'Not quite — watch again'
              : phase === 'complete'
              ? '10 rounds complete! Well done 🎯'
              : 'Get ready…'}
          </Text>
        </View>

      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0603' },

  bgBloom: {
    position: 'absolute', top: '15%', alignSelf: 'center',
    width: SW * 0.9, height: SW * 0.9, borderRadius: SW * 0.45,
    backgroundColor: 'transparent',
    shadowColor: '#FF8833', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22, shadowRadius: 120, elevation: 0,
  },

  content: { flex: 1, paddingHorizontal: 20 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon: { fontSize: 15 },
  topBarLabel: { fontFamily: FONTS.regular, fontSize: 11, letterSpacing: 3, color: 'rgba(255,244,230,0.38)', textTransform: 'uppercase' },
  endBtn: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  endBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: 'rgba(255,244,230,0.60)' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sessionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,107,26,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.20)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  sessionDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange },
  sessionTime: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.orange },
  levelBadge:  { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', flexDirection: 'row', gap: 2 },
  levelNum:    { fontFamily: FONTS.black, fontSize: 22, color: COLORS.cream },
  levelLabel:  { fontFamily: FONTS.regular, fontSize: 16, color: 'rgba(255,244,230,0.35)', marginTop: 3 },
  scorePill:   { flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  scoreVal:    { fontFamily: FONTS.black, fontSize: 18, color: COLORS.amber },
  scoreLabel:  { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.35)' },

  // Phase label
  phaseLabelWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  phaseLabel:     { fontFamily: FONTS.black, fontSize: 16, letterSpacing: 3, textTransform: 'uppercase' },
  phaseProgress:  { fontFamily: FONTS.bold, fontSize: 14, color: 'rgba(255,244,230,0.35)' },

  // Board
  board: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            12,
    marginBottom:   20,
    alignSelf:      'center',
  },
  pad: {
    borderRadius:   24,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    position:       'relative',
  },
  padGlow: {
    position:        'absolute',
    inset:           -10,
    borderRadius:    34,
    shadowColor:     '#FF6B1A',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    24,
    elevation:       8,
  },
  padIcon: { fontSize: 32, zIndex: 2 },
  padDisabledOverlay: { borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.18)' },

  // Sequence dots
  seqDotsRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 20, minHeight: 14 },
  seqDot:     { width: 10, height: 10, borderRadius: 5 },

  // Hint
  hint: { backgroundColor: 'rgba(255,107,26,0.07)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.14)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  hintText: { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,244,230,0.45)', textAlign: 'center', lineHeight: 20 },
});
