/**
 * Ember – CleanPhoneGame.tsx
 *
 * WHERE THIS LIVES:
 *   app/(protected)/session/games/clean.tsx
 *
 * MECHANIC:
 *   - Screen is covered in a dark "fog" layer
 *   - Player swipes finger across to reveal what's underneath
 *   - Underneath: the Ember mascot + a motivational quote
 *   - Progress % shown as you clean
 *   - At 85%+ cleaned → celebration, auto-completes
 *   - No timer pressure — just satisfying reveal
 *
 * IMPLEMENTATION:
 *   - Canvas divided into a grid of cells (30×40)
 *   - Each cell starts "dirty" (opaque dark overlay)
 *   - Touch moves mark nearby cells as "clean"
 *   - React re-renders the remaining dirty cells
 *   - Brush radius covers ~3 cells around finger
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
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
import * as Haptics from 'expo-haptics';
import { useSessionStore, selectTimeDisplay } from '../../../../store/sessionStore';
import { COLORS, FONTS } from '../../../../theme';
import { useBreakTimer } from '../../../../hooks/useBreakTimer';
import { BreakStatusBar } from '../../../../components/BreakStatusBar';

const { width: SW } = Dimensions.get('window');

// ─── Grid constants ────────────────────────────────────────────────────────────
const CANVAS_W  = SW - 40;
const CANVAS_H  = Math.round(CANVAS_W * 1.15);
const COLS      = 28;
const ROWS      = Math.round(COLS * (CANVAS_H / CANVAS_W));
const CELL_W    = CANVAS_W / COLS;
const CELL_H    = CANVAS_H / ROWS;
const TOTAL     = COLS * ROWS;
const BRUSH_R   = 2.4;        // cells radius cleaned per swipe point
const COMPLETE_THRESHOLD = 1;

const QUOTES = [
  "The focused mind can pierce through stone.",
  "Every session builds the version you're becoming.",
  "Rest is not giving up. It's fueling up.",
  "Clarity comes after stillness.",
  "You showed up. That's already winning.",
  "Small steps, compounded, change everything.",
  "The fire inside is brighter than the noise outside.",
];

export default function CleanPhoneGame() {
    useBreakTimer(); // auto-ejects to /session after break time expires
  const insets      = useSafeAreaInsets();
  const sessionTime = useSessionStore(selectTimeDisplay);
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);

  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  // ── Dirty grid: Set of dirty cell indices ─────────────────────────────────
  const [dirtySet,   setDirtySet]   = useState<Set<number>>(() => new Set(Array.from({ length: TOTAL }, (_, i) => i)));
  const dirtyRef     = useRef<Set<number>>(new Set(Array.from({ length: TOTAL }, (_, i) => i)));
  const [cleanedPct, setCleanedPct] = useState(0);
  const [completed,  setCompleted]  = useState(false);
  const lastHaptic   = useRef(0);
  const quote        = useRef(QUOTES[Math.floor(Math.random() * QUOTES.length)]).current;

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeIn       = useRef(new Animated.Value(0)).current;
  const completeAnim = useRef(new Animated.Value(0)).current;
  const mascotScale  = useRef(new Animated.Value(0.85)).current;
  const mascotFloat  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(mascotFloat, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(mascotFloat, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, [fadeIn, mascotFloat]);

  const mascotY = mascotFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  // ── Completion celebration ─────────────────────────────────────────────────
  const triggerComplete = useCallback(() => {
    setCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(mascotScale, { toValue: 1.10, tension: 80, friction: 5, useNativeDriver: true }),
      Animated.timing(completeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    setTimeout(() => handleEnd(), 2000);
  }, [completeAnim, mascotScale]);

  const handleEnd = (async () => {
    router.replace('/session/gameSelect');
  });

  // ── Canvas layout offset ───────────────────────────────────────────────────
  const canvasOffset = useRef({ x: 0, y: 0 });

  // ── Erase cells near touch point ──────────────────────────────────────────
  const eraseAt = useCallback((pageX: number, pageY: number) => {
    if (completed) return;

    const lx = pageX - canvasOffset.current.x;
    const ly = pageY - canvasOffset.current.y;

    const centerCol = lx / CELL_W;
    const centerRow = ly / CELL_H;

    let changed = false;
    const updated = new Set(dirtyRef.current);

    for (let dc = Math.floor(-BRUSH_R - 1); dc <= Math.ceil(BRUSH_R + 1); dc++) {
      for (let dr = Math.floor(-BRUSH_R - 1); dr <= Math.ceil(BRUSH_R + 1); dr++) {
        const dist = Math.sqrt(dc * dc + dr * dr);
        if (dist > BRUSH_R) continue;

        const col = Math.round(centerCol + dc);
        const row = Math.round(centerRow + dr);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;

        const idx = row * COLS + col;
        if (updated.has(idx)) {
          updated.delete(idx);
          changed = true;
        }
      }
    }

    if (!changed) return;

    dirtyRef.current = updated;
    const pct = Math.round(((TOTAL - updated.size) / TOTAL) * 100);
    setCleanedPct(pct);

    // Throttled haptic every ~5% progress
    const now = Date.now();
    if (pct % 5 === 0 && now - lastHaptic.current > 200) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastHaptic.current = now;
    }

    setDirtySet(new Set(updated));

    if (updated.size / TOTAL <= (1 - COMPLETE_THRESHOLD)) {
      triggerComplete();
    }
  }, [completed, triggerComplete]);

  // ── Pan responder ──────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onMoveShouldSetPanResponder:         () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture:  () => true,
      onPanResponderGrant: (e) => eraseAt(e.nativeEvent.pageX, e.nativeEvent.pageY),
      onPanResponderMove:  (e) => {
        // Use touches array for smoother multi-point tracking
        const { touches } = e.nativeEvent;
        touches.forEach(t => eraseAt(t.pageX, t.pageY));
      },
    })
  ).current;

  // ── Render dirty cells as a grid of small View patches ────────────────────
  // We render dirty cells as opaque patches — revealed area is the canvas bg
  const completeBg = completeAnim.interpolate({ inputRange: [0,1], outputRange: ['rgba(255,200,100,0.00)', 'rgba(255,200,100,0.10)'] });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#0A0603', '#160A04', '#1A0C05', '#0A0603']}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgBloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 20 }]}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarIcon}>✨</Text>
            <Text style={styles.topBarLabel}>CLEAN THE SCREEN</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={()=>router.back()} activeOpacity={0.75}>
            <Text style={styles.endBtnText}>← Games</Text>
          </TouchableOpacity>
        </View>

        {/* ── Progress + session row ── */}
        <BreakStatusBar />
        <View style={styles.statsRow}>
          
          <View style={styles.progressPill}>
            <Text style={styles.progressPct}>{cleanedPct}%</Text>
            <Text style={styles.progressLabel}> cleaned</Text>
          </View>
        </View>

        {/* ── Canvas ── */}
        <View
          style={styles.canvas}
          onLayout={e => {
            e.target.measure((_x, _y, _w, _h, px, py) => {
              canvasOffset.current = { x: px, y: py };
            });
          }}
          {...panResponder.panHandlers}
        >
          {/* What's revealed underneath — mascot + quote */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.revealContent, { backgroundColor: completeBg as any }]}>
            <LinearGradient
              colors={['#140C05', '#1E1008', '#140C05']}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Mascot */}
            <Animated.View style={[
              styles.mascotWrap,
              { transform: [{ translateY: mascotY }, { scale: mascotScale }] },
            ]}>
              {/* Glow behind mascot */}
              <View style={styles.mascotGlow} />
              <Image
                source={require('../../../../assets/images/mascot.png')}
                style={styles.mascotImg}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Quote */}
            <View style={styles.quoteWrap}>
              <Text style={styles.quoteText}>"{quote}"</Text>
              <View style={styles.quoteLine} />
              <Text style={styles.quoteCredit}>ember · focus app</Text>
            </View>

            {/* Completion sparkles */}
            {completed && (
              <View style={styles.sparklesWrap}>
                {['✦','✧','✦','✧','✦'].map((s, i) => (
                  <Animated.Text
                    key={i}
                    style={[
                      styles.sparkle,
                      {
                        left: `${10 + i * 20}%` as any,
                        top:  `${8 + (i % 2) * 6}%` as any,
                        opacity: completeAnim,
                      },
                    ]}
                  >
                    {s}
                  </Animated.Text>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Dirty fog cells — render only dirty ones */}
          {Array.from(dirtySet).map(idx => {
            const col = idx % COLS;
            const row = Math.floor(idx / COLS);
            // Slight variation in fog color for organic feel
            const variance = ((col * 3 + row * 7) % 12);
            return (
              <View
                key={idx}
                style={{
                  position:        'absolute',
                  left:            col * CELL_W,
                  top:             row * CELL_H,
                  width:           CELL_W + 0.5,  // slight overlap to avoid grid lines
                  height:          CELL_H + 0.5,
                  backgroundColor: `rgba(${8 + variance},${5 + variance / 2},${2},0.94)`,
                }}
              />
            );
          })}

          {/* Finger trail hint if nothing cleaned yet */}
          {cleanedPct === 0 && (
            <View style={styles.fingerHint}>
              <Text style={styles.fingerHintText}>Swipe to reveal</Text>
              <Text style={styles.fingerHintEmoji}>👆</Text>
            </View>
          )}

          {/* Completed overlay */}
          {completed && (
            <Animated.View style={[styles.completedOverlay, { opacity: completeAnim }]}>
              <Text style={styles.completedText}>✦ Revealed ✦</Text>
            </Animated.View>
          )}
        </View>

        {/* ── Progress bar ── */}
        <View style={styles.progressBarWrap}>
          <View style={styles.progressBarTrack}>
            <LinearGradient
              colors={['#FF6B1A', '#FFD166']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${cleanedPct}%` as `${number}%` }]}
            />
          </View>
          <Text style={styles.progressBarPct}>{cleanedPct}%</Text>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0603' },

  bgBloom: {
    position: 'absolute', top: '10%', alignSelf: 'center',
    width: SW * 0.9, height: SW * 0.9, borderRadius: SW * 0.45,
    backgroundColor: 'transparent',
    shadowColor: '#FF6B1A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 120, elevation: 0,
  },

  content: { flex: 1, paddingHorizontal: 20 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon: { fontSize: 14 },
  topBarLabel: { fontFamily: FONTS.regular, fontSize: 11, letterSpacing: 3, color: 'rgba(255,244,230,0.38)', textTransform: 'uppercase' },
  endBtn: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  endBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: 'rgba(255,244,230,0.60)' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sessionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,107,26,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.20)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  sessionDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange },
  sessionTime: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.orange },
  progressPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  progressPct:   { fontFamily: FONTS.black, fontSize: 15, color: COLORS.cream },
  progressLabel: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.40)' },

  // Canvas
  canvas: {
    width:           CANVAS_W,
    height:          CANVAS_H,
    borderRadius:    20,
    overflow:        'hidden',
    marginBottom:    14,
    position:        'relative',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
  },

  // Reveal content (behind fog)
  revealContent: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },

  // Mascot
  mascotWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative', flex: 1 },
  mascotGlow: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#FF6B1A', opacity: 0.20,
    shadowColor: '#FF6B1A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.80, shadowRadius: 40, elevation: 0,
  },
  mascotImg: { width: 130, height: 169 },

  // Quote
  quoteWrap: { alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  quoteText: {
    fontFamily: FONTS.bold, fontSize: 15,
    color: 'rgba(255,244,230,0.80)', textAlign: 'center',
    lineHeight: 22, letterSpacing: 0.2, marginBottom: 14,
    fontStyle: 'italic',
  },
  quoteLine:   { width: 30, height: 2, backgroundColor: COLORS.orange, borderRadius: 1, marginBottom: 8, opacity: 0.60 },
  quoteCredit: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.30)', letterSpacing: 2, textTransform: 'uppercase' },

  // Sparkles
  sparklesWrap: { position: 'absolute', inset: 0, pointerEvents: 'none' } as any,
  sparkle: { position: 'absolute', fontSize: 18, color: COLORS.gold },

  // Finger hint
  fingerHint: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  fingerHintText: { fontFamily: FONTS.bold, fontSize: 16, color: 'rgba(255,244,230,0.45)', marginBottom: 6 },
  fingerHintEmoji: { fontSize: 28 },

  // Completed overlay
  completedOverlay: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    alignItems: 'center', zIndex: 20,
  },
  completedText: {
    fontFamily: FONTS.black, fontSize: 20,
    color: COLORS.gold, letterSpacing: 3,
    textShadowColor: 'rgba(255,209,102,0.60)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // Progress bar
  progressBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8 },
  progressBarTrack: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill:  { height: '100%', borderRadius: 3, minWidth: 4 },
  progressBarPct:   { fontFamily: FONTS.bold, fontSize: 12, color: 'rgba(255,244,230,0.40)', width: 36, textAlign: 'right' },
});
