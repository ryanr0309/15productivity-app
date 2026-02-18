/**
 * Ember – CheckpointScreen.tsx  (Screen 03 · Checkpoint)
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import EmberMascot from '../components/EmberMascot';
import { COLORS, FONTS, RADII, SHADOWS, NavigationProp } from '../theme';

const { width, height } = Dimensions.get('window');

interface CheckpointScreenProps {
  navigation?: NavigationProp;
  /** Total seconds the reward window lasts */
  rewardDurationSec?: number;
}

// ─── Burst particle for the celebration entrance ──────────────────────────────
function BurstParticle({ angle, delay }: { angle: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ])).start();
  }, [anim, delay]);

  const dist = 110;
  const tx = Math.cos(angle) * dist;
  const ty = Math.sin(angle) * dist;
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, tx] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, ty] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const scale      = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1.2, 0.4] });

  return (
    <Animated.View style={{
      position: 'absolute', width: 8, height: 8, borderRadius: 4,
      backgroundColor: COLORS.gold,
      opacity, transform: [{ translateX }, { translateY }, { scale }],
    }} />
  );
}

export default function CheckpointScreen({
  navigation,
  rewardDurationSec = 60,
}: CheckpointScreenProps) {
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  // ── Countdown timer ────────────────────────────────────────────────────────
  const [countdown, setCountdown] = React.useState(rewardDurationSec);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Animations ─────────────────────────────────────────────────────────────
  const bounceAnim  = useRef(new Animated.Value(0)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;
  const slideCards  = useRef(new Animated.Value(40)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;
  const scaleIn     = useRef(new Animated.Value(0.7)).current;
  const cardScale1  = useRef(new Animated.Value(1)).current;
  const cardScale2  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry sequence
    Animated.parallel([
      Animated.spring(scaleIn,    { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeIn,     { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideCards, { toValue: 0, duration: 500, delay: 200, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
    ]).start();

    // Mascot bounce loop
    Animated.loop(Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -16, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0,   duration: 300, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
      Animated.delay(200),
    ])).start();

    // Glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    // Countdown
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          navigation?.navigate('Session');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [bounceAnim, fadeIn, glowAnim, navigation, scaleIn, slideCards]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.38] });
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1]  });

  const handleCardPress = (card: Animated.Value, route: string) => {
    Animated.sequence([
      Animated.timing(card, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(card, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start(() => navigation?.navigate(route));
  };

  if (!fontsLoaded) return null;

  // Burst particles in a circle
  const BURST_COUNT = 10;
  const burstAngles = Array.from({ length: BURST_COUNT }, (_, i) => (i / BURST_COUNT) * 2 * Math.PI);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#100D07', '#1A1208', '#201608']} style={StyleSheet.absoluteFill} />
      {/* Gold bloom */}
      <View style={styles.goldBloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>

        {/* ── Mascot with burst ── */}
        <View style={styles.mascotArea}>
          {/* Burst particles */}
          <View style={styles.burstOrigin}>
            {burstAngles.map((angle, i) => (
              <BurstParticle key={i} angle={angle} delay={i * 80} />
            ))}
          </View>

          {/* Glow ring */}
          <Animated.View style={[styles.mascotGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

          {/* Mascot */}
          <Animated.View style={[{ transform: [{ translateY: bounceAnim }, { scale: scaleIn }] }]}>
            <EmberMascot state="excited" size={200} />
          </Animated.View>
        </View>

        {/* ── Copy ── */}
        <Animated.View style={{ transform: [{ translateY: slideCards }] }}>
          <Text style={styles.title}>Checkpoint! 🔥</Text>
          <Text style={styles.subtitle}>You earned a break</Text>

          {/* Countdown pill */}
          <View style={styles.countdownPill}>
            <Text style={styles.countdownText}>
              {countdown}s left
            </Text>
          </View>

          {/* ── Reward cards ── */}
          <View style={styles.cards}>

            {/* Mini game card */}
            <Animated.View style={{ transform: [{ scale: cardScale1 }] }}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={1}
                onPress={() => handleCardPress(cardScale1, 'MiniGame')}
              >
                <LinearGradient
                  colors={['rgba(255,107,26,0.14)', 'rgba(255,107,26,0.04)']}
                  style={styles.cardGradient}
                >
                  <View style={[styles.cardIcon, styles.cardIconGame]}>
                    <Text style={styles.cardIconEmoji}>🎮</Text>
                  </View>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: COLORS.orange }]}>Mini Game</Text>
                    <Text style={styles.cardSub}>60 sec · quick blast</Text>
                  </View>
                  <Text style={styles.cardArrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Motivation clip card */}
            <Animated.View style={{ transform: [{ scale: cardScale2 }] }}>
              <TouchableOpacity
                style={[styles.card, styles.cardClip]}
                activeOpacity={1}
                onPress={() => handleCardPress(cardScale2, 'MotivationClip')}
              >
                <LinearGradient
                  colors={['rgba(255,209,102,0.14)', 'rgba(255,209,102,0.04)']}
                  style={styles.cardGradient}
                >
                  <View style={[styles.cardIcon, styles.cardIconClip]}>
                    <Text style={styles.cardIconEmoji}>⚡</Text>
                  </View>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: COLORS.gold }]}>Motivation Clip</Text>
                    <Text style={styles.cardSub}>60 sec · recharge</Text>
                  </View>
                  <Text style={styles.cardArrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Skip */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation?.navigate('Session')}>
            <Text style={styles.skipText}>skip and keep going →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  goldBloom: {
    position: 'absolute', top: '8%', alignSelf: 'center',
    width: 360, height: 360, borderRadius: 180,
    backgroundColor: 'transparent',
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22, shadowRadius: 100, elevation: 0,
  },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },

  // Mascot
  mascotArea:  { marginTop: 52, alignItems: 'center', justifyContent: 'center', height: 240 },
  burstOrigin: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  mascotGlow:  {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: COLORS.gold,
  },

  // Copy
  title:    { fontFamily: FONTS.black, fontSize: 30, color: COLORS.cream, textAlign: 'center', letterSpacing: -0.5, marginTop: 4 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 4, letterSpacing: 0.5 },

  countdownPill: {
    alignSelf: 'center', marginTop: 12, marginBottom: 24,
    backgroundColor: 'rgba(255,209,102,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,209,102,0.25)',
    borderRadius: RADII.pill, paddingHorizontal: 18, paddingVertical: 6,
  },
  countdownText: { fontFamily: FONTS.mono ?? FONTS.bold, fontSize: 13, color: COLORS.gold, letterSpacing: 1 },

  // Cards
  cards:        { gap: 12, width: '100%' },
  card:         {
    borderRadius: RADII.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,107,26,0.28)',
    ...SHADOWS.orange,
  },
  cardClip:     { borderColor: 'rgba(255,209,102,0.28)', ...SHADOWS.amber },
  cardGradient: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  cardIcon:     { width: 48, height: 48, borderRadius: RADII.md, alignItems: 'center', justifyContent: 'center' },
  cardIconGame: { backgroundColor: 'rgba(255,107,26,0.2)' },
  cardIconClip: { backgroundColor: 'rgba(255,209,102,0.2)' },
  cardIconEmoji:{ fontSize: 22 },
  cardText:     { flex: 1 },
  cardTitle:    { fontFamily: FONTS.bold, fontSize: 16 },
  cardSub:      { fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 11, color: COLORS.muted, marginTop: 2, letterSpacing: 0.3 },
  cardArrow:    { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.muted },

  // Skip
  skipBtn:  { alignItems: 'center', paddingVertical: 20 },
  skipText: { fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 12, color: COLORS.muted, letterSpacing: 0.3, textDecorationLine: 'underline' },
});
