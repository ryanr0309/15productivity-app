/**
 * app/session/checkpoint.tsx
 *
 * 2-minute break screen.
 * - Timer counts down from 120s
 * - On expire → calls completeCheckpoint() (schedules next in 30 min) → back to session
 * - "Back to Focus" button skips the break early
 * - The main session timer keeps running in sessionStore the whole time
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular } from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSessionStore, CHECKPOINT_BREAK_SEC, selectTimeDisplay } from '../../../store/sessionStore';
import { COLORS, FONTS } from  '../../../theme';

const { width } = Dimensions.get('window');
const RING_SIZE   = Math.round(width * 0.62);
const RING_R      = RING_SIZE / 2 - 14;
const RING_STROKE = 6;
const RING_CIRCUM = 2 * Math.PI * RING_R;

export default function CheckpointScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);
  const sessionTime        = useSessionStore(selectTimeDisplay); // session clock still ticking

  // ── Break countdown ────────────────────────────────────────────────────────
  const [breakElapsed, setBreakElapsed] = useState(0);
  const remaining    = Math.max(CHECKPOINT_BREAK_SEC - breakElapsed, 0);
  const breakMM      = Math.floor(remaining / 60).toString().padStart(2, '0');
  const breakSS      = (remaining % 60).toString().padStart(2, '0');
  const ringProgress = breakElapsed / CHECKPOINT_BREAK_SEC; // 0 → 1
  const ringOffset   = RING_CIRCUM * (1 - ringProgress);

  const returnToSession = () => {
    completeCheckpoint(); // schedules next checkpoint 30 min from now
    router.replace('/session');
  };

  useEffect(() => {
    const id = setInterval(() => {
      setBreakElapsed(prev => {
        const next = prev + 1;
        if (next >= CHECKPOINT_BREAK_SEC) {
          clearInterval(id);
          returnToSession();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const bounce   = useRef(new Animated.Value(0)).current;
  const glowPls  = useRef(new Animated.Value(0)).current;

  // Burst particles
  const particles = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * 2 * Math.PI,
      anim:  new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    // Mascot bounce
    Animated.sequence([
      Animated.spring(bounce, { toValue: -18, tension: 60, friction: 5, useNativeDriver: true }),
      Animated.spring(bounce, { toValue:   0, tension: 50, friction: 6, useNativeDriver: true }),
    ]).start();

    // Glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(glowPls, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowPls, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    // Burst
    Animated.parallel(
      particles.map(p =>
        Animated.timing(p.anim, { toValue: 1, duration: 900, delay: Math.random() * 200, easing: Easing.out(Easing.quad), useNativeDriver: true })
      )
    ).start();
  }, [bounce, fadeIn, glowPls, particles]);

  const glowScale = glowPls.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.08] });
  const glowOp    = glowPls.interpolate({ inputRange: [0, 1], outputRange: [0.30, 0.65] });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#090602', '#160A04', '#1C0E07', '#160A04', '#090602']}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bgBloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 24 }]}>

        <Text style={styles.screenLabel}>🎉  CHECKPOINT</Text>

        {/* ── Session timer (still running) ── */}
        <View style={styles.sessionPill}>
          <View style={styles.sessionPillDot} />
          <Text style={styles.sessionPillText}>session {sessionTime}</Text>
        </View>

        {/* ── Break countdown ring ── */}
        <View style={[styles.ringWrap, { width: RING_SIZE, height: RING_SIZE }]}>
          {/* Burst particles */}
          {particles.map((p, i) => {
            const tx = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * 80] });
            const ty = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * 80] });
            const op = p.anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.8, 0] });
            return (
              <Animated.View key={i} style={[styles.particle, { opacity: op, transform: [{ translateX: tx }, { translateY: ty }] }]} />
            );
          })}

          {/* Glow */}
          <Animated.View style={[styles.ringGlow, { transform: [{ scale: glowScale }], opacity: glowOp }]} />

          {/* Ring */}
          <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgGrad id="breakArc" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%"   stopColor="#FFD166" />
                <Stop offset="100%" stopColor="#FFAA33" />
              </SvgGrad>
            </Defs>
            <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={RING_STROKE} />
            <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R}
              fill="none" stroke="url(#breakArc)" strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUM}
              strokeDashoffset={ringOffset}
              rotation="-90"
              origin={`${RING_SIZE/2}, ${RING_SIZE/2}`}
            />
          </Svg>

          {/* Countdown in center */}
          <View style={styles.ringCenter}>
            <Text style={styles.breakTimer}>{breakMM}:{breakSS}</Text>
            <Text style={styles.breakTimerLabel}>break</Text>
          </View>
        </View>

        {/* ── Heading ── */}
        <Text style={styles.heading}>You earned a break 🔥</Text>
        <Text style={styles.sub}>
          Play a game or recharge — session resumes automatically.
        </Text>

        {/* ── Game / activity buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => router.push('/session/gameSelect')}>
            <LinearGradient colors={['#FF7830', '#EE4800']} style={styles.actionGrad}>
              <Text style={styles.actionEmoji}>🎮</Text>
              <Text style={styles.actionTitle}>Mini Game</Text>
              <Text style={styles.actionSub}>60 sec</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <LinearGradient colors={['#FFCC44', '#FF8C00']} style={styles.actionGrad}>
              <Text style={styles.actionEmoji}>⚡</Text>
              <Text style={styles.actionTitle}>Motivation</Text>
              <Text style={styles.actionSub}>60 sec</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Skip break ── */}
        <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={returnToSession}>
          <Text style={styles.skipText}>skip and keep going  ›</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#090602', alignItems: 'center' },
  bgBloom:       {
    position: 'absolute', top: '5%', alignSelf: 'center',
    width: width * 0.90, height: width * 0.90, borderRadius: width * 0.45,
    backgroundColor: 'transparent',
    shadowColor: '#FFAA33', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38, shadowRadius: 110, elevation: 0,
  },
  content:       { flex: 1, alignItems: 'center', width: '100%', paddingHorizontal: 28 },
  screenLabel:   { fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 3, color: 'rgba(255,210,100,0.55)', textTransform: 'uppercase', marginBottom: 14 },

  // Session still-running pill
  sessionPill:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sessionPillDot:{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange },
  sessionPillText: { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.55)', letterSpacing: 0.3 },

  // Ring
  ringWrap:      { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  ringGlow:      { position: 'absolute', width: '90%', height: '90%', borderRadius: 9999, backgroundColor: 'transparent', shadowColor: '#FFD166', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 36, elevation: 0 },
  ringCenter:    { position: 'absolute', alignItems: 'center' },
  breakTimer:    { fontFamily: FONTS.black, fontSize: 44, color: COLORS.cream, letterSpacing: 2 },
  breakTimerLabel: { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.40)', letterSpacing: 1, marginTop: -2 },

  // Burst
  particle:      { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber },

  heading:       { fontFamily: FONTS.black, fontSize: 24, color: COLORS.cream, textAlign: 'center', marginBottom: 8 },
  sub:           { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,244,230,0.45)', textAlign: 'center', lineHeight: 21, marginBottom: 28 },

  // Action cards
  actionsRow:    { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 24 },
  actionCard:    { flex: 1, borderRadius: 16, overflow: 'hidden', shadowColor: '#FF6B1A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  actionGrad:    { paddingVertical: 20, alignItems: 'center', gap: 4 },
  actionEmoji:   { fontSize: 28 },
  actionTitle:   { fontFamily: FONTS.bold,    fontSize: 14, color: '#1A0800' },
  actionSub:     { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(26,8,0,0.60)' },

  // Skip
  skipBtn:       { paddingVertical: 12, paddingHorizontal: 24 },
  skipText:      { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.35)', letterSpacing: 0.3 },
});
