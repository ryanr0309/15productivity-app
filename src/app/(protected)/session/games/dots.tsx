/**
 * Ember – PopTheDotsGame.tsx
 *
 * WHERE THIS LIVES:
 *   app/(protected)/session/games/dots.tsx
 *
 * GAME RULES:
 *   - Dots spawn randomly inside the arena at random intervals
 *   - Each dot has a lifetime (shrinks a ring around it as time runs out)
 *   - Tap a dot before it fades → score points
 *   - Miss a dot (it fades) → combo resets to 0
 *   - Combo multiplier: ×1 → ×2 → ×3 → ×4 → ×5 (every 3 consecutive hits)
 *   - Points per tap = 10 × combo multiplier
 *   - Game runs for 60 seconds then auto-ends
 *   - "End break ›" exits early at any time
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  useSessionStore,
  selectTimeDisplay,
} from '../../../../store/sessionStore';
import { COLORS, FONTS } from '../../../../theme';

const { width } = Dimensions.get('window');

// ─── Game constants ───────────────────────────────────────────────────────────
const GAME_DURATION_SEC  = 60;
const ARENA_PADDING      = 20;      // min distance from arena edge
const DOT_SPAWN_MIN_MS   = 300;     // fastest spawn interval
const DOT_SPAWN_MAX_MS   = 900;    // slowest spawn interval
const DOT_LIFETIME_MS    = 500;    // how long a dot lives
const DOT_SIZE_MIN       = 38;
const DOT_SIZE_MAX       = 62;
const MAX_DOTS_AT_ONCE   = 7;
const COMBO_STEP         = 3;       // hits needed to increment combo

// Dot color variants (orange/red/yellow spectrum from the reference)
const DOT_VARIANTS = [
  { grad: ['#FF9944', '#FF4400'] as [string,string], glow: 'rgba(255,107,26,0.70)' },
  { grad: ['#FFDD66', '#FFAA22'] as [string,string], glow: 'rgba(255,209,102,0.65)' },
  { grad: ['#FF5522', '#CC2200'] as [string,string], glow: 'rgba(200,60,0,0.65)'    },
  { grad: ['#FFBB33', '#FF7700'] as [string,string], glow: 'rgba(255,150,30,0.65)'  },
  { grad: ['#FFE87A', '#FFCC33'] as [string,string], glow: 'rgba(255,220,80,0.60)'  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dot {
  id:       number;
  x:        number;   // left offset (center)
  y:        number;   // top offset (center)
  size:     number;
  variant:  number;
  // Animated values
  opacity:  Animated.Value;
  scale:    Animated.Value;
  ring:     Animated.Value; // 1 → 0 over lifetime (ring shrinks)
  // Burst on pop
  burstScale:   Animated.Value;
  burstOpacity: Animated.Value;
}

let _dotId = 0;

// ─── Score flash component ─────────────────────────────────────────────────────
function ScoreFlash({ value, x, y, onDone }: { value: number; x: number; y: number; onDone: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(280),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(onDone);
  }, [anim, onDone]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -28] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.Text style={[
      flashStyles.text,
      { left: x - 20, top: y - 20, opacity, transform: [{ translateY }] },
    ]}>
      +{value}
    </Animated.Text>
  );
}

const flashStyles = StyleSheet.create({
  text: {
    position:   'absolute',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize:   20,
    color:      '#FFD166',
    zIndex:     99,
    textShadowColor:  'rgba(255,200,0,0.60)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

// ─── Main game component ───────────────────────────────────────────────────────
export default function PopTheDotsGame() {
  const insets      = useSafeAreaInsets();
  const sessionTime = useSessionStore(selectTimeDisplay);
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);

  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  // ── Game state ─────────────────────────────────────────────────────────────
  const [dots,       setDots]       = useState<Dot[]>([]);
  const [score,      setScore]      = useState(0);
  const [combo,      setCombo]      = useState(1);
  const [hits,       setHits]       = useState(0);  // consecutive hits for combo calc
  const [timeLeft,   setTimeLeft]   = useState(GAME_DURATION_SEC);
  const [flashes,    setFlashes]    = useState<{ id: number; value: number; x: number; y: number }[]>([]);

  const dotsRef  = useRef<Dot[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(1);
  const hitsRef  = useRef(0);

  // Arena measured dimensions
  const [arenaLayout, setArenaLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

  // ── Entry fade ─────────────────────────────────────────────────────────────
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  // ── Combo label animation ──────────────────────────────────────────────────
  const comboScale  = useRef(new Animated.Value(1)).current;
  const bumpCombo   = useCallback(() => {
    Animated.sequence([
      Animated.spring(comboScale, { toValue: 1.35, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(comboScale, { toValue: 1.00, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [comboScale]);

  // ── Spawn a dot ────────────────────────────────────────────────────────────
  const spawnDot = useCallback(() => {
    if (!arenaLayout.width || dotsRef.current.length >= MAX_DOTS_AT_ONCE) return;

    const size    = Math.round(DOT_SIZE_MIN + Math.random() * (DOT_SIZE_MAX - DOT_SIZE_MIN));
    const halfSz  = size / 2;
    const x       = ARENA_PADDING + halfSz + Math.random() * (arenaLayout.width  - ARENA_PADDING * 2 - size);
    const y       = ARENA_PADDING + halfSz + Math.random() * (arenaLayout.height - ARENA_PADDING * 2 - size);
    const variant = Math.floor(Math.random() * DOT_VARIANTS.length);

    const dot: Dot = {
      id:           ++_dotId,
      x, y, size, variant,
      opacity:      new Animated.Value(0),
      scale:        new Animated.Value(0),
      ring:         new Animated.Value(1),
      burstScale:   new Animated.Value(1),
      burstOpacity: new Animated.Value(0),
    };

    // Appear animation
    Animated.parallel([
      Animated.spring(dot.scale,   { toValue: 1, tension: 180, friction: 7, useNativeDriver: true }),
      Animated.timing(dot.opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    // Ring shrinks over lifetime
    Animated.timing(dot.ring, {
      toValue:  0,
      duration: DOT_LIFETIME_MS,
      easing:   Easing.linear,
      useNativeDriver: true,  // we use scaleX/scaleY on ring
    }).start();

    // Auto-expire: fade out dot when ring reaches 0
    const expiryTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(dot.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dot.scale,   { toValue: 0.6, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        // Missed dot → reset combo
        comboRef.current = 1;
        hitsRef.current  = 0;
        setCombo(1);
        setHits(0);
        removeDot(dot.id);
      });
    }, DOT_LIFETIME_MS);

    // Attach timer id so we can cancel on tap
    (dot as any)._expiryTimer = expiryTimer;

    dotsRef.current = [...dotsRef.current, dot];
    setDots([...dotsRef.current]);
  }, [arenaLayout]);

  // ── Remove a dot by id ─────────────────────────────────────────────────────
  const removeDot = useCallback((id: number) => {
    dotsRef.current = dotsRef.current.filter(d => d.id !== id);
    setDots([...dotsRef.current]);
  }, []);

  // ── Handle tap on a dot ────────────────────────────────────────────────────
  const handleTap = useCallback((dot: Dot) => {
    // Cancel expiry
    clearTimeout((dot as any)._expiryTimer);

    // Combo logic
    const newHits  = hitsRef.current + 1;
    const newCombo = Math.min(Math.floor(newHits / COMBO_STEP) + 1, 5);
    hitsRef.current  = newHits;
    comboRef.current = newCombo;
    setHits(newHits);

    if (newCombo > comboRef.current - 1) bumpCombo();
    setCombo(newCombo);

    // Score
    const points  = 10 * newCombo;
    scoreRef.current += points;
    setScore(scoreRef.current);

    // Bump score display
    Animated.sequence([
      Animated.spring(scoreAnim, { toValue: 1.15, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(scoreAnim, { toValue: 1.00, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();

    // Haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Pop burst animation
    Animated.parallel([
      Animated.timing(dot.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.spring(dot.scale,   { toValue: 1.6, tension: 300, friction: 5, useNativeDriver: true }),
      Animated.timing(dot.burstOpacity, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.spring(dot.burstScale,   { toValue: 2.0, tension: 150, friction: 4, useNativeDriver: true }),
    ]).start(() => removeDot(dot.id));

    // Score flash
    const flashId = Date.now();
    setFlashes(prev => [...prev, { id: flashId, value: points, x: dot.x, y: dot.y }]);
  }, [bumpCombo, removeDot, scoreAnim]);

  // ── Spawn loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!arenaLayout.width) return;

    let spawnTimer: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = DOT_SPAWN_MIN_MS + Math.random() * (DOT_SPAWN_MAX_MS - DOT_SPAWN_MIN_MS);
      spawnTimer = setTimeout(() => {
        spawnDot();
        scheduleNext();
      }, delay);
    };

    // Spawn immediately then schedule
    spawnDot();
    scheduleNext();

    return () => clearTimeout(spawnTimer);
  }, [arenaLayout, spawnDot]);

  // ── Game timer countdown ───────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          handleEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = useCallback(async () => {
    await completeCheckpoint();
    router.replace('/session');
  }, [completeCheckpoint]);

  // ── Derived display ────────────────────────────────────────────────────────
  const timeMM  = Math.floor(timeLeft / 60).toString().padStart(1, '0');
  const timeSS  = (timeLeft % 60).toString().padStart(2, '0');
  const timePct = timeLeft / GAME_DURATION_SEC;

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#0A0603', '#160A04', '#1A0C05', '#0A0603']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 20 }]}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.dotIndicator} />
            <Text style={styles.topBarLabel}>POP THE DOTS</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.75}>
            <Text style={styles.endBtnText}>End break ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Score + combo row ── */}
        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Animated.Text style={[styles.scoreValue, { transform: [{ scale: scoreAnim }] }]}>
              {score}
            </Animated.Text>
          </View>
          <View style={styles.comboWrap}>
            <Text style={styles.comboLabel}>COMBO</Text>
            <Animated.View style={[styles.comboValueRow, { transform: [{ scale: comboScale }] }]}>
              <Text style={styles.comboEmoji}>🔥</Text>
              <Text style={styles.comboValue}>×{combo}</Text>
            </Animated.View>
          </View>
        </View>

        {/* ── Arena ── */}
        <View
          style={styles.arena}
          onLayout={e => {
            const { width: w, height: h, x, y } = e.nativeEvent.layout;
            setArenaLayout({ width: w, height: h, x, y });
          }}
        >
          {/* Subtle inner glow */}
          <View style={styles.arenaGlow} />

          {/* Dots */}
          {dots.map(dot => {
            const v = DOT_VARIANTS[dot.variant];
            const ringScale = dot.ring; // 1 → 0, we use this for the ring's scaleX/scaleY

            return (
              <TouchableOpacity
                key={dot.id}
                activeOpacity={1}
                onPress={() => handleTap(dot)}
                style={[
                  styles.dotTouchable,
                  {
                    left:   dot.x - dot.size / 2,
                    top:    dot.y - dot.size / 2,
                    width:  dot.size,
                    height: dot.size,
                  },
                ]}
              >
                <Animated.View style={[
                  styles.dotOuter,
                  {
                    width:   dot.size,
                    height:  dot.size,
                    opacity: dot.opacity,
                    transform: [{ scale: dot.scale }],
                  },
                ]}>
                  {/* Shrinking ring (lifetime indicator) */}
                  <Animated.View style={[
                    styles.dotRing,
                    {
                      width:        dot.size + 10,
                      height:       dot.size + 10,
                      borderRadius: (dot.size + 10) / 2,
                      borderColor:  v.grad[0],
                      transform:    [{ scale: ringScale }],
                    },
                  ]} />

                  {/* Glow bloom */}
                  <View style={[
                    styles.dotGlow,
                    {
                      width:           dot.size * 1.5,
                      height:          dot.size * 1.5,
                      borderRadius:    dot.size * 0.75,
                      backgroundColor: v.glow,
                    },
                  ]} />

                  {/* Dot body */}
                  <LinearGradient
                    colors={v.grad}
                    start={{ x: 0.25, y: 0.15 }}
                    end={{ x: 0.75, y: 0.9 }}
                    style={[
                      styles.dotBody,
                      {
                        width:        dot.size,
                        height:       dot.size,
                        borderRadius: dot.size / 2,
                      },
                    ]}
                  />
                </Animated.View>

                {/* Burst ring on pop */}
                <Animated.View style={[
                  styles.burstRing,
                  {
                    width:        dot.size,
                    height:       dot.size,
                    borderRadius: dot.size / 2,
                    borderColor:  v.grad[0],
                    opacity:      dot.burstOpacity,
                    transform:    [{ scale: dot.burstScale }],
                  },
                ]} />

              </TouchableOpacity>
            );
          })}

          {/* Score flashes */}
          {flashes.map(f => (
            <ScoreFlash
              key={f.id}
              value={f.value}
              x={f.x}
              y={f.y}
              onDone={() => setFlashes(prev => prev.filter(fl => fl.id !== f.id))}
            />
          ))}
        </View>

        {/* ── Timer row ── */}
        <View style={styles.timerSection}>
          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>time</Text>
            <View style={styles.timerBarWrap}>
              <LinearGradient
                colors={['#FF6B1A', '#FFD166']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.timerBarFill, { width: `${Math.round(timePct * 100)}%` as `${number}%` }]}
              />
            </View>
            <Text style={styles.timerValue}>{timeMM}:{timeSS}</Text>
          </View>
        </View>

      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0A0603',
  },

  content: {
    flex:              1,
    paddingHorizontal: 20,
  },

  // Top bar
  topBar: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   20,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotIndicator: {
    width:           9,
    height:          9,
    borderRadius:    4.5,
    backgroundColor: COLORS.orange,
    shadowColor:     COLORS.orange,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.8,
    shadowRadius:    6,
  },
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

  // Score
  scoreRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    marginBottom:   16,
  },
  scoreLabel: {
    fontFamily:    FONTS.regular,
    fontSize:      11,
    letterSpacing: 2,
    color:         'rgba(255,244,230,0.35)',
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  scoreValue: {
    fontFamily:    FONTS.black,
    fontSize:      48,
    color:         COLORS.cream,
    letterSpacing: -1,
    lineHeight:    52,
  },
  comboWrap:     { alignItems: 'flex-end' },
  comboLabel:    {
    fontFamily:    FONTS.regular,
    fontSize:      11,
    letterSpacing: 2,
    color:         'rgba(255,244,230,0.35)',
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  comboValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  comboEmoji:    { fontSize: 18 },
  comboValue:    {
    fontFamily:    FONTS.black,
    fontSize:      26,
    color:         COLORS.amber,
    letterSpacing: 0,
  },

  // Arena
  arena: {
    flex:            1,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.06)',
    overflow:        'hidden',
    marginBottom:    18,
    position:        'relative',
  },
  arenaGlow: {
    position:        'absolute',
    top:             '40%',
    left:            '30%',
    width:           200,
    height:          200,
    borderRadius:    100,
    backgroundColor: 'transparent',
    shadowColor:     '#FF5500',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.15,
    shadowRadius:    80,
    elevation:       0,
  },

  // Dots
  dotTouchable: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOuter: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
  },
  dotRing: {
    position:   'absolute',
    borderWidth: 2,
    opacity:    0.50,
  },
  dotGlow: {
    position:   'absolute',
    opacity:    0.35,
  },
  dotBody: {
    shadowColor:   '#FF5500',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.70,
    shadowRadius:  12,
    elevation:     8,
  },
  burstRing: {
    position:   'absolute',
    borderWidth: 2.5,
  },

  // Timer
  timerSection: { paddingBottom: 12 },
  timerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  timerLabel: {
    fontFamily: FONTS.regular,
    fontSize:   12,
    color:      'rgba(255,244,230,0.32)',
    width:      32,
  },
  timerBarWrap: {
    flex:            1,
    height:          5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius:    3,
    overflow:        'hidden',
  },
  timerBarFill: {
    height:       '100%',
    borderRadius: 3,
    minWidth:     4,
  },
  timerValue: {
    fontFamily:    FONTS.bold,
    fontSize:      14,
    color:         COLORS.orange,
    letterSpacing: 0.5,
    width:         36,
    textAlign:     'right',
  },
});
