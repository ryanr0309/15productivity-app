/**
 * Ember – HomeScreen.tsx  (Screen 01 · Home / Idle)
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import EmberMascot from '../components/EmberMascot';
import { COLORS, FONTS, SHADOWS, RADII, NavigationProp } from '../theme';

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {
  navigation?: NavigationProp;
}

// ─── Floating spark particle ─────────────────────────────────────────────────
interface SparkProps { x: number; y: number; delay: number; size?: number; }

function Spark({ x, y, delay, size = 6 }: SparkProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.25, 0.75, 1], outputRange: [0, 0.85, 0.85, 0] });

  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: COLORS.amber, opacity, transform: [{ translateY }],
    }} />
  );
}

// ─── Glow ring ───────────────────────────────────────────────────────────────
function GlowRing({ pulseAnim }: { pulseAnim: Animated.Value }) {
  const scale   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.08] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.28] });
  return (
    <Animated.View style={[styles.glowRing, { transform: [{ scale }], opacity }]} />
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  const floatAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(0)).current;
  const fadeTop     = useRef(new Animated.Value(0)).current;
  const fadeBottom  = useRef(new Animated.Value(0)).current;
  const slideBottom = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.sequence([
      Animated.timing(fadeTop,    { toValue: 1, duration: 600, delay: 150, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeBottom,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideBottom, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeBottom, fadeTop, floatAnim, pulseAnim, slideBottom]);

  const mascotY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#0C0A0E', '#120E0A', '#1A1410']} style={StyleSheet.absoluteFill} />
      <View style={styles.radialBloom} />

      {/* Sparks */}
      <Spark x={width * 0.18} y={height * 0.25} delay={0}    size={5} />
      <Spark x={width * 0.78} y={height * 0.20} delay={600}  size={4} />
      <Spark x={width * 0.12} y={height * 0.42} delay={1200} size={6} />
      <Spark x={width * 0.85} y={height * 0.38} delay={300}  size={4} />
      <Spark x={width * 0.25} y={height * 0.15} delay={900}  size={3} />
      <Spark x={width * 0.72} y={height * 0.14} delay={1500} size={3} />
      <Spark x={width * 0.50} y={height * 0.09} delay={750}  size={4} />

      {/* Streak badge */}
      <Animated.View style={[styles.topArea, { opacity: fadeTop }]}>
        <View style={styles.streakBadge}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakText}>7 day streak</Text>
        </View>
      </Animated.View>

      {/* Mascot */}
      <Animated.View style={[styles.mascotArea, { opacity: fadeTop }]}>
        <GlowRing pulseAnim={pulseAnim} />
        <Animated.View style={{ transform: [{ translateY: mascotY }] }}>
          <EmberMascot state="idle" size={230} />
        </Animated.View>
      </Animated.View>

      {/* Bottom */}
      <Animated.View style={[styles.bottomArea, { opacity: fadeBottom, transform: [{ translateY: slideBottom }] }]}>
        <Text style={styles.appName}>ember.</Text>
        <Text style={styles.tagline}>Focus burns brighter</Text>

        <View style={styles.statsRow}>
          {[['12', 'sessions'], ['4.2h', 'this week'], ['7', 'streak']].map(([val, lbl], i) => (
            <React.Fragment key={lbl}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{val}</Text>
                <Text style={styles.statLabel}>{lbl}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity style={[styles.ctaBtn, SHADOWS.orange]} activeOpacity={0.85}
          onPress={() => navigation?.navigate('SessionSetup')}>
          <LinearGradient colors={['#FF7A2A', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
            <Text style={styles.ctaText}>Begin Focus</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.7}
          onPress={() => navigation?.navigate('History')}>
          <Text style={styles.ghostText}>view history</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center' },
  radialBloom: {
    position: 'absolute', top: height * 0.22, alignSelf: 'center',
    width: 340, height: 340, borderRadius: 170, backgroundColor: 'transparent',
    shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28, shadowRadius: 90, elevation: 0,
  },
  topArea:     { marginTop: 64, alignItems: 'center' },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,170,51,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,170,51,0.25)',
    borderRadius: RADII.pill, paddingHorizontal: 16, paddingVertical: 7,
  },
  streakFire:  { fontSize: 14 },
  streakText:  { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.amber, letterSpacing: 0.3 },
  mascotArea:  { marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  glowRing:    {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: COLORS.orange,
  },
  bottomArea:  {
    flex: 1, alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 52, paddingHorizontal: 32, width: '100%',
  },
  appName:     { fontFamily: FONTS.black, fontSize: 42, color: COLORS.cream, letterSpacing: -1 },
  tagline:     { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 4, letterSpacing: 0.8, marginBottom: 28 },
  statsRow:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADII.xl,
    paddingVertical: 14, paddingHorizontal: 24, marginBottom: 32,
    borderWidth: 1, borderColor: COLORS.border, gap: 20,
  },
  statPill:    { alignItems: 'center', minWidth: 44 },
  statValue:   { fontFamily: FONTS.black, fontSize: 20, color: COLORS.amber, lineHeight: 22 },
  statLabel:   { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.07)' },
  ctaBtn:      { width: '100%', borderRadius: RADII.pill, overflow: 'hidden', marginBottom: 14 },
  ctaGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: RADII.pill },
  ctaText:     { fontFamily: FONTS.black, fontSize: 18, color: '#fff', letterSpacing: 0.5 },
  ghostBtn:    { paddingVertical: 10 },
  ghostText:   { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, letterSpacing: 0.5, textDecorationLine: 'underline' },
});
