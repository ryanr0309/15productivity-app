/**
 * app/onboarding/index.tsx  — Screen 1: Welcome
 *
 * The first thing a new user sees. Sets the visual tone for the entire onboarding.
 * Dark, warm, ember-lit. Mascot placeholder centred. Single CTA.
 *
 * NAVIGATION: taps "Get Started" → /onboarding/pain (screen 2)
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';


const { width: SW, height: SH } = Dimensions.get('window');

export default function WelcomeScreen() {

    
    
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  // ── Entrance animations ────────────────────────────────────────────────────
  const mascotScale   = useRef(new Animated.Value(0.6)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotY       = useRef(new Animated.Value(30)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(16)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(16)).current;

  const subOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY       = useRef(new Animated.Value(20)).current;

  // Mascot idle float
  const floatY = useRef(new Animated.Value(0)).current;

  // Glow pulse
  const glowScale   = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.45)).current;

  // Particle opacities
  const particles = useRef(
    Array.from({ length: 6 }, () => ({
      opacity: new Animated.Value(0),
      y:       new Animated.Value(0),
      x:       new Animated.Value(0),
    }))
  ).current;

  
  useEffect(() => {
    // Staggered entrance sequence
    Animated.sequence([
      Animated.delay(200),
      // Mascot springs in
      Animated.parallel([
        Animated.spring(mascotScale,   { toValue: 1,  tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(mascotOpacity, { toValue: 1,  duration: 450, useNativeDriver: true }),
        Animated.timing(mascotY,       { toValue: 0,  duration: 450, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]),
    ]).start();

    // Tagline after mascot
    Animated.sequence([
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(taglineY,       { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // Title
    Animated.sequence([
      Animated.delay(720),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // Subtitle + CTA together
    Animated.sequence([
      Animated.delay(950),
      Animated.parallel([
        Animated.timing(subOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(ctaOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(ctaY,       { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // Glow pulse loop
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(glowScale,   { toValue: 1.18, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.75, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(glowScale,   { toValue: 1.0,  duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.45, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ])).start();

    // Idle float loop (starts after entrance)
    Animated.sequence([
      Animated.delay(900),
      Animated.loop(Animated.sequence([
        Animated.timing(floatY, { toValue: -12, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue:   0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
    ]).start();

     
    // Floating particles
    const POSITIONS = [
      { startX: -80, startY: 20  },
      { startX:  70, startY: 30  },
      { startX: -50, startY: -40 },
      { startX:  90, startY: -20 },
      { startX: -30, startY: 60  },
      { startX:  50, startY: 50  },
    ];
    particles.forEach((p, i) => {
      const loop = () => {
        p.opacity.setValue(0);
        p.y.setValue(0);
        p.x.setValue(POSITIONS[i].startX * 0.3);
        Animated.sequence([
          Animated.delay(i * 400 + 1200),
          Animated.parallel([
            Animated.timing(p.opacity, { toValue: 0.8,  duration: 400, useNativeDriver: true }),
            Animated.timing(p.y,       { toValue: POSITIONS[i].startY - 50, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(p.x,       { toValue: POSITIONS[i].startX,      duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.timing(p.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start(() => setTimeout(loop, Math.random() * 800));
      };
      loop();
    });
  }, []);


    const handleContinue = async () => {
      router.push('/(onboarding)/pain');
    };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Background ── */}
      <LinearGradient
        colors={['#080402', '#0F0704', '#160B05', '#0A0502']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Radial warm glow behind mascot */}
      <Animated.View
        style={[
          styles.glowBloom,
          {
            opacity:   glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Subtle noise texture overlay — faint diagonal lines */}
      <View style={styles.noiseOverlay} pointerEvents="none" />

      {/* ── Particle sparks ── */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              opacity:   p.opacity,
              transform: [{ translateX: p.x }, { translateY: p.y }],
              // Vary size per particle
              width:  4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: 3 + (i % 3),
              backgroundColor: i % 2 === 0 ? COLORS.amber : COLORS.gold,
            },
          ]}
        />
      ))}

      {/* ── Content ── */}
      <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>

        {/* Top wordmark */}
        <Animated.View style={[styles.wordmarkWrap, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}>
          <Text style={styles.wordmark}>ember</Text>
          <View style={styles.wordmarkDot} />
        </Animated.View>

        {/* ── MASCOT AREA ── */}
        <Animated.View
          style={[
            styles.mascotArea,
            {
              opacity:   mascotOpacity,
              transform: [
                { scale: mascotScale },
                { translateY: Animated.add(mascotY, floatY) },
              ],
            },
          ]}
        >
          {/*
            ┌─────────────────────────────────────────────┐
            │                                             │
            │         MASCOT PLACEHOLDER                  │
            │                                             │
            │  Replace this entire View with:             │
            │  <EmberMascot width={220} height={260} />   │
            │                                             │
            │  The EmberMascot component should be a      │
            │  react-native-svg component with no         │
            │  background. The float animation above      │
            │  already drives vertical movement —         │
            │  internal animations (flame flicker,        │
            │  blink, arm wave) run inside the component. │
            │                                             │
            └─────────────────────────────────────────────┘
          */}
          <Image
  source={require('../../assets/images/embert.png')}
  style={{ width: 220, height: 260, resizeMode: 'contain', borderRadius: 1000 }}
/>

          {/* Mascot ground shadow */}
          <Animated.View
            style={[
              styles.mascotShadow,
              {
                opacity:   mascotOpacity,
                transform: [
                  { scaleX: floatY.interpolate({ inputRange: [-12, 0], outputRange: [0.78, 1] }) },
                  { scaleY: floatY.interpolate({ inputRange: [-12, 0], outputRange: [0.70, 1] }) },
                ],
              },
            ]}
          />
        </Animated.View>

        {/* ── Text block ── */}
        <View style={styles.textBlock}>
          <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
            Your focus,{'\n'}finally protected.
          </Animated.Text>

          <Animated.Text style={[styles.subtitle, { opacity: subOpacity }]}>
            Break free from distraction. Build deep work habits that actually stick.
          </Animated.Text>
        </View>

        {/* ── CTA ── */}
        <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleContinue}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#FF9030', '#FF5E0E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaTxt}>Get Started</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.ctaFine}>Free 3-day trial · Cancel anytime</Text>
        </Animated.View>

      </View>
    </View>
  );
}

const GLOW_SIZE = SW * 1.1;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080402' },

  // Background glow
  glowBloom: {
    position:  'absolute',
    width:     GLOW_SIZE,
    height:    GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    top:       SH * 0.14,
    left:      (SW - GLOW_SIZE) / 2,
    backgroundColor: 'transparent',
    // Simulated radial glow with shadow
    shadowColor:  '#FF6600',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius:  120,
    elevation: 0,
  },

  // Noise / texture overlay — diagonal dashes
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.025,
    backgroundColor: 'transparent',
    // Actual noise requires a PNG asset; this gives a very subtle warm tint
    // Replace with: <Image source={require('../../assets/noise.png')} style={...} />
  },

  particle: {
    position: 'absolute',
    top:      SH * 0.38,
    left:     SW / 2,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },

  // Wordmark
  wordmarkWrap: {
    flexDirection: 'row',
    alignItems:    'center',
    gap: 6,
    marginTop: 8,
  },
  wordmark: {
    fontFamily:    FONTS.black,
    fontSize:      22,
    color:         COLORS.cream,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  wordmarkDot: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: COLORS.orange,
    marginBottom:    2,
  },

  // Mascot area
  mascotArea: {
    alignItems:      'center',
    justifyContent:  'center',
    marginVertical:  8,
  },

  mascotPlaceholder: {
    width:           220,
    height:          240,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  mascotRingOuter: {
    position:        'absolute',
    width:           220,
    height:          220,
    borderRadius:    110,
    borderWidth:     1.5,
    borderColor:     'rgba(255,120,30,0.12)',
    borderStyle:     'dashed',
  },
  mascotRingInner: {
    position:        'absolute',
    width:           160,
    height:          160,
    borderRadius:    80,
    borderWidth:     1,
    borderColor:     'rgba(255,120,30,0.08)',
  },
  mascotIconWrap: {
    alignItems:   'center',
    gap: 6,
  },
  mascotFlameIcon: {
    fontSize: 72,
  },
  mascotPlaceholderLabel: {
    fontFamily:    FONTS.bold,
    fontSize:      13,
    color:         'rgba(255,180,80,0.50)',
    letterSpacing: 1,
  },
  mascotPlaceholderSub: {
    fontFamily: FONTS.regular,
    fontSize:   10,
    color:      'rgba(255,180,80,0.28)',
    letterSpacing: 0.5,
  },

  mascotShadow: {
    width:           100,
    height:          14,
    borderRadius:    50,
    backgroundColor: '#FF4400',
    opacity:         0.22,
    marginTop:       -8,
    // Blur shadow
    shadowColor:    '#FF4400',
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  1,
    shadowRadius:   12,
  },

  // Text
  textBlock: {
    alignItems:   'center',
    gap: 14,
    paddingHorizontal: 8,
  },
  title: {
    fontFamily:    FONTS.black,
    fontSize:      36,
    color:         COLORS.cream,
    textAlign:     'center',
    lineHeight:    44,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily:  FONTS.regular,
    fontSize:    16,
    color:       'rgba(255,244,230,0.48)',
    textAlign:   'center',
    lineHeight:  24,
    maxWidth:    300,
  },

  // CTA
  ctaWrap: {
    width:      '100%',
    alignItems: 'center',
    gap: 14,
  },
  ctaBtn: {
    width:        '100%',
    borderRadius: 22,
    overflow:     'hidden',
    // Glow shadow
    shadowColor:    '#FF6600',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.45,
    shadowRadius:   18,
    elevation:      8,
  },
  ctaGrad: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    paddingVertical:  20,
    paddingHorizontal: 32,
    gap: 10,
  },
  ctaTxt: {
    fontFamily:    FONTS.black,
    fontSize:      19,
    color:         '#1A0602',
    letterSpacing: 0.3,
  },
  ctaArrow: {
    fontFamily: FONTS.black,
    fontSize:   20,
    color:      '#1A0602',
  },
  ctaFine: {
    fontFamily:    FONTS.regular,
    fontSize:      12,
    color:         'rgba(255,244,230,0.28)',
    letterSpacing: 0.3,
  },
});
