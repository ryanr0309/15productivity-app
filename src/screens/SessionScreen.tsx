/**
 * Ember – SessionScreen.tsx  (Screen 02 · Session Active)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGrad, Stop, Circle } from 'react-native-svg';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import EmberMascot from '../components/EmberMascot';
import { COLORS, FONTS, RADII, NavigationProp } from '../theme';

const { width } = Dimensions.get('window');

const RING_SIZE       = 220;
const RING_RADIUS     = 95;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 596.9

interface SessionScreenProps {
  navigation?: NavigationProp;
  /** Session duration in seconds, default 25 min */
  durationSec?: number;
  /** User's stated goal */
  goal?: string;
  /** Seconds between checkpoints, default 15 min */
  checkpointIntervalSec?: number;
}

export default function SessionScreen({
  navigation,
  durationSec            = 25 * 60,
  goal                   = 'finish chapter 4',
  checkpointIntervalSec  = 15 * 60,
}: SessionScreenProps) {
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  // ── Timer state ────────────────────────────────────────────────────────────
  const [elapsed, setElapsed]   = useState(0);
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= durationSec) {
          clearInterval(timerRef.current!);
          navigation?.navigate('SessionComplete');
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [durationSec, navigation]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const remaining          = durationSec - elapsed;
  const mins               = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs               = (remaining % 60).toString().padStart(2, '0');
  const sessionProgress    = elapsed / durationSec;                          // 0→1
  const strokeDashoffset   = RING_CIRCUMFERENCE * (1 - sessionProgress);

  const checkpointElapsed  = elapsed % checkpointIntervalSec;
  const checkpointProgress = checkpointElapsed / checkpointIntervalSec;      // 0→1
  const checkpointRemSec   = checkpointIntervalSec - checkpointElapsed;
  const cpMins             = Math.floor(checkpointRemSec / 60);
  const cpSecs             = (checkpointRemSec % 60).toString().padStart(2, '0');

  // Navigate to checkpoint when bar fills
  useEffect(() => {
    if (elapsed > 0 && elapsed % checkpointIntervalSec === 0) {
      navigation?.navigate('Checkpoint');
    }
  }, [elapsed, checkpointIntervalSec, navigation]);

  // ── Animations ─────────────────────────────────────────────────────────────
  const pulseAnim   = useRef(new Animated.Value(0)).current;
  const floatAnim   = useRef(new Animated.Value(0)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;
  const ringGlow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(ringGlow, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(ringGlow, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, [fadeIn, floatAnim, pulseAnim, ringGlow]);

  const mascotY     = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const glowOpacity = ringGlow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  const glowScale   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.05] });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#0C0A0E', '#120E0A', '#1C1208']} style={StyleSheet.absoluteFill} />
      {/* Radial bloom */}
      <View style={styles.bloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>GOAL</Text>
            <Text style={styles.headerGoal} numberOfLines={1}>{goal}</Text>
          </View>
          <TouchableOpacity style={styles.pauseBtn} activeOpacity={0.7}
            onPress={() => navigation?.navigate('PauseMenu')}>
            <Text style={styles.pauseIcon}>⏸</Text>
          </TouchableOpacity>
        </View>

        {/* ── Progress ring + mascot ── */}
        <View style={styles.ringWrap}>
          {/* Outer glow ring */}
          <Animated.View style={[styles.ringGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

          {/* SVG ring */}
          <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            style={{ transform: [{ rotate: '-90deg' }] }}>
            <Defs>
              <SvgGrad id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%"   stopColor="#FF6B1A" />
                <Stop offset="100%" stopColor="#FFD166" />
              </SvgGrad>
            </Defs>
            {/* Track */}
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
            {/* Fill */}
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke="url(#ringGrad)" strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>

          {/* Mascot centered in ring */}
          <Animated.View style={[styles.mascotWrap, { transform: [{ translateY: mascotY }] }]}>
            <EmberMascot state="focused" size={148} />
          </Animated.View>
        </View>

        {/* ── Timer ── */}
        <Text style={styles.timer}>{mins}:{secs}</Text>
        <Text style={styles.timerLabel}>remaining</Text>

        {/* ── Checkpoint bar ── */}
        <View style={styles.checkpointCard}>
          <View style={styles.checkpointHeader}>
            <Text style={styles.checkpointLabel}>next checkpoint</Text>
            <Text style={styles.checkpointTime}>{cpMins}:{cpSecs}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${checkpointProgress * 100}%` as `${number}%` }]} />
          </View>
        </View>

        {/* ── Blocked apps pill ── */}
        <View style={styles.appsRow}>
          <Text style={styles.appsLabel}>🛡 3 apps blocked</Text>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  bloom:   {
    position: 'absolute', top: '15%', alignSelf: 'center',
    width: 380, height: 380, borderRadius: 190,
    backgroundColor: 'transparent',
    shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22, shadowRadius: 100, elevation: 0,
  },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 64, marginBottom: 20 },
  headerLeft:  { flex: 1 },
  headerLabel: { fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 10, color: COLORS.muted, letterSpacing: 0.3, marginBottom: 3 },
  headerGoal:  { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.amber, letterSpacing: 0.2 },
  pauseBtn:    {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border,
  },
  pauseIcon:   { fontSize: 18 },

  // Ring
  ringWrap:   { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  ringGlow:   {
    position: 'absolute', width: RING_SIZE + 40, height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2, backgroundColor: COLORS.orange,
  },
  mascotWrap: { position: 'absolute' },

  // Timer
  timer:      { fontFamily: FONTS.mono ?? FONTS.bold, fontSize: 48, color: COLORS.cream, letterSpacing: 3, marginTop: 12 },
  timerLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, letterSpacing: 0.8, marginTop: 4, marginBottom: 28 },

  // Checkpoint bar
  checkpointCard:   { width: '100%', backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  checkpointHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  checkpointLabel:  { fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 11, color: COLORS.muted, letterSpacing: 0.3 },
  checkpointTime:   { fontFamily: FONTS.mono ?? FONTS.bold, fontSize: 11, color: COLORS.amber },
  barTrack:         { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  barFill:          {
    height: '100%', borderRadius: 3,
    backgroundColor: COLORS.orange,
    shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
  },

  // Apps row
  appsRow:  {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,107,26,0.08)',
    borderRadius: RADII.pill, borderWidth: 1, borderColor: 'rgba(255,107,26,0.2)',
  },
  appsLabel: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.orange, letterSpacing: 0.3 },
});
