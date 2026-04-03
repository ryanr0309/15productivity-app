/**
 * Ember – HomeScreen.tsx  (Screen 01 · Home)
 *
 * "Begin Focus" opens StartSessionModal bottom sheet.
 * Modal collects goal + duration → starts sessionStore → pushes to /session.
 *
 * Only change from original: animated SVG flame above the ember. wordmark.
 */

import React, { useEffect, useRef, useState } from 'react';
import AppBlockerSheet from '../../../components/AppBlockerSheet';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated, Dimensions, StatusBar, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path, Ellipse, Circle, Defs,
  RadialGradient as SvgRadial, LinearGradient as SvgLinear,
  Stop,
} from 'react-native-svg';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StartSessionModal from '../../../components/StartSessionModal';
import ScreenTimeButton from '../../../components/ScreenTime';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { COLORS, FONTS } from '../../../theme';

const { width, height } = Dimensions.get('window');
const MASCOT_SIZE = Math.round(width * 0.44);

// ─── Flame dimensions ─────────────────────────────────────────────────────────
// Pure-SVG, scales to ~38% of screen width. No image asset needed.
const FL_W = Math.round(width * 0.38);
const FL_H = Math.round(FL_W * 1.55);

// ─── AnimatedFlame ────────────────────────────────────────────────────────────
// A detailed, multi-layer flame that floats and flickers in sync with the
// outer glow pulse. Matches the app's #FF6B1A / #FF4400 / amber palette.
function AnimatedFlame({
  floatAnim,
  glowAnim,
}: {
  floatAnim: Animated.Value;
  glowAnim:  Animated.Value;
}) {
  // Fast flicker — runs independently inside the component
  const flicker = useRef(new Animated.Value(0)).current;

  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 155, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.55, duration: 90,  easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(420),
      ])
    ).start();
  }, [flicker]);

  // Crown tip sways left/right on flicker
  const tipX = flicker.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -2, 2] });

  // Floating Y (shared with outer glow)
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -13] });

  // Glow ring breathes
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.08] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.55] });

  // Shadow under flame shrinks as it rises
  const shadowSX = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.68] });
  const shadowOp = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.10] });

  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      {/* ── Soft ambient glow ring behind flame ── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: FL_H * 0.18,
          width:  FL_W * 1.55,
          height: FL_W * 1.55,
          borderRadius: FL_W * 0.775,
          backgroundColor: '#FF5500',
          shadowColor:   '#FF5500',
          shadowOffset:  { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius:  FL_W * 0.5,
          transform:     [{ scale: glowScale }],
          opacity:       glowOpacity,
        }}
      />

      {/* ── Floating flame SVG ── */}
      <Animated.View style={{ transform: [{ translateY: floatY }], zIndex: 2 }}>
        <Svg width={FL_W} height={FL_H} viewBox="0 0 120 186">
          <Defs>
            {/* ── Main body radial: bright yellow core → deep crimson rim ── */}
            <SvgRadial id="fBody" cx="50%" cy="55%" rx="44%" ry="42%">
              <Stop offset="0%"   stopColor="#FFF5A0" />
              <Stop offset="18%"  stopColor="#FFD020" />
              <Stop offset="40%"  stopColor="#FF8800" />
              <Stop offset="68%"  stopColor="#FF3A00" />
              <Stop offset="100%" stopColor="#991000" />
            </SvgRadial>

            {/* ── Belly inner glow (subsurface scatter) ── */}
            <SvgRadial id="fBelly" cx="50%" cy="65%" rx="30%" ry="24%">
              <Stop offset="0%"   stopColor="#FFFDE0" stopOpacity="0.72" />
              <Stop offset="50%"  stopColor="#FFE055" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#FFA020" stopOpacity="0"    />
            </SvgRadial>

            {/* ── Side wing gradient ── */}
            <SvgLinear id="fWingL" x1="0%" y1="10%" x2="100%" y2="90%">
              <Stop offset="0%"   stopColor="#BB1E00" />
              <Stop offset="50%"  stopColor="#FF4E00" />
              <Stop offset="100%" stopColor="#FF9900" />
            </SvgLinear>
            <SvgLinear id="fWingR" x1="100%" y1="10%" x2="0%" y2="90%">
              <Stop offset="0%"   stopColor="#BB1E00" />
              <Stop offset="50%"  stopColor="#FF4E00" />
              <Stop offset="100%" stopColor="#FF9900" />
            </SvgLinear>

            {/* ── Crown tip gradient ── */}
            <SvgLinear id="fTip" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%"   stopColor="#BB1800" />
              <Stop offset="38%"  stopColor="#FF4400" />
              <Stop offset="75%"  stopColor="#FF9000" />
              <Stop offset="100%" stopColor="#FFDD00" />
            </SvgLinear>

            {/* ── Ground shadow ── */}
            <SvgRadial id="fShadow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%"   stopColor="#FF4400" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#FF4400" stopOpacity="0"    />
            </SvgRadial>
          </Defs>

          {/* ── Ground shadow ellipse ── */}
          <Ellipse cx="60" cy="182" rx="32" ry="6" fill="url(#fShadow)" />

          {/* ── Left wing (behind body) ── */}
          <Path
            d="M60 148 C40 136 14 118 8 88 C2 60 12 32 22 14 C30 0 32 -8 28 -14 C40 4 44 26 40 48 C36 66 26 80 26 98 C26 118 38 136 60 148Z"
            fill="url(#fWingL)"
            opacity={0.88}
          />
          {/* Left wing inner feather */}
          <Path
            d="M60 146 C46 132 30 116 26 96 C22 76 26 56 34 40 C30 52 30 68 34 84 C38 100 50 116 60 146Z"
            fill="#FF7200"
            opacity={0.55}
          />

          {/* ── Right wing (behind body) ── */}
          <Path
            d="M60 148 C80 136 106 118 112 88 C118 60 108 32 98 14 C90 0 88 -8 92 -14 C80 4 76 26 80 48 C84 66 94 80 94 98 C94 118 82 136 60 148Z"
            fill="url(#fWingR)"
            opacity={0.88}
          />
          {/* Right wing inner feather */}
          <Path
            d="M60 146 C74 132 90 116 94 96 C98 76 94 56 86 40 C90 52 90 68 86 84 C82 100 70 116 60 146Z"
            fill="#FF7200"
            opacity={0.55}
          />

          {/* ── Flame crown — multiple tongues, tip sways on flicker ── */}
          {/* Outer left tip */}
          <Path
            d="M48 52 C44 38 40 24 42 10 C44 22 46 38 50 52Z"
            fill="#FF3800"
            opacity={0.58}
          />
          {/* Outer right tip */}
          <Path
            d="M72 52 C76 38 80 24 78 10 C76 22 74 38 70 52Z"
            fill="#FF3800"
            opacity={0.58}
          />
          {/* Centre tip — sways */}
          <Animated.View style={{ transform: [{ translateX: tipX }] }}>
            <Svg width={FL_W} height={FL_H * 0.38} viewBox="0 0 120 72" style={{ position: 'absolute', top: 0, left: 0 }}>
              <Path
                d="M60 4 C57 18 50 30 50 46 C50 36 54 24 60 10 C66 24 70 36 70 46 C70 30 63 18 60 4Z"
                fill="url(#fTip)"
                opacity={0.88}
              />
            </Svg>
          </Animated.View>
          {/* Extra wisp left */}
          <Path d="M52 44 C48 32 46 18 50 6 C50 18 52 32 54 44Z" fill="#FF5500" opacity={0.42} />
          {/* Extra wisp right */}
          <Path d="M68 44 C72 32 74 18 70 6 C70 18 68 32 66 44Z" fill="#FF5500" opacity={0.42} />

          {/* ── Main body ── */}
          <Path
            d="M60 36 C76 34 92 42 100 58 C110 76 112 102 108 122 C104 140 94 152 82 158 C74 162 68 164 60 164 C52 164 46 162 38 158 C26 152 16 140 12 122 C8 102 10 76 20 58 C28 42 44 34 60 36Z"
            fill="url(#fBody)"
          />
          {/* Subsurface scatter overlay */}
          <Path
            d="M60 36 C76 34 92 42 100 58 C110 76 112 102 108 122 C104 140 94 152 82 158 C74 162 68 164 60 164 C52 164 46 162 38 158 C26 152 16 140 12 122 C8 102 10 76 20 58 C28 42 44 34 60 36Z"
            fill="url(#fBelly)"
          />
          {/* Left highlight streak */}
          <Path
            d="M22 58 C16 72 12 92 14 112 C16 100 18 84 24 70 C22 66 22 58 22 58Z"
            fill="#FFE090"
            opacity={0.22}
          />

          {/* ── Internal flame texture strokes ── */}
          <Path d="M50 66 C46 80 44 98 48 114 C42 100 40 80 46 68Z"  fill="#FF9800" opacity={0.24} />
          <Path d="M70 66 C74 80 76 98 72 114 C78 100 80 80 74 68Z"  fill="#FF9800" opacity={0.24} />
          <Path d="M60 60 C58 76 56 96 58 112 C56 96 54 76 58 64Z"   fill="#FFD050" opacity={0.18} />

          {/* ── Floating sparks ── */}
          {/* Large teardrops */}
          <Ellipse cx="100" cy="56"  rx="3.8" ry="5"   fill="#FFD030" opacity={0.88} transform="rotate(-20 100 56)"  />
          <Ellipse cx="18"  cy="68"  rx="3.4" ry="4.8" fill="#FF9900" opacity={0.82} transform="rotate(18 18 68)"    />
          <Ellipse cx="106" cy="30"  rx="2.8" ry="4"   fill="#FFEE55" opacity={0.78} transform="rotate(-30 106 30)"  />
          {/* Small embers */}
          <Circle cx="14"  cy="36"  r="2.4" fill="#FF8800" opacity={0.72} />
          <Circle cx="92"  cy="18"  r="2.2" fill="#FFD040" opacity={0.80} />
          <Circle cx="36"  cy="14"  r="2.0" fill="#FF9900" opacity={0.74} />
          <Circle cx="112" cy="88"  r="1.8" fill="#FFB020" opacity={0.66} />
          <Circle cx="6"   cy="96"  r="1.8" fill="#FF7700" opacity={0.62} />
          <Circle cx="76"  cy="8"   r="1.6" fill="#FFE060" opacity={0.70} />
          <Circle cx="44"  cy="8"   r="1.4" fill="#FF8800" opacity={0.65} />
        </Svg>
      </Animated.View>

      {/* ── Ground shadow shrinks on float ── */}
      <Animated.View
        pointerEvents="none"
        style={{
          width:        FL_W * 0.48,
          height:       8,
          borderRadius: 4,
          backgroundColor: '#FF5500',
          marginTop:    -10,
          shadowColor:  '#FF5500',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.80,
          shadowRadius: 12,
          transform:    [{ scaleX: shadowSX }],
          opacity:      shadowOp,
          zIndex:       1,
        }}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [blockerOpen, setBlockerOpen] = useState(false);
  const screenTimeSelectionId = useOnboardingStore(s=> s.screenTimeSelectionId);

  // ── Animations ──────────────────────────────────────────────────────────────
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const scaleIn   = useRef(new Animated.Value(0.9)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, [fadeIn, floatAnim, glowAnim, scaleIn]);

  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  const mascotScale   = useRef(new Animated.Value(0.6)).current;
    const mascotOpacity = useRef(new Animated.Value(0)).current;
    const mascotY       = useRef(new Animated.Value(30)).current;
   const floatY = useRef(new Animated.Value(0)).current;
useEffect(() => {
  // Mascot entrance
  Animated.sequence([
    Animated.delay(400),
    Animated.parallel([
      Animated.timing(mascotOpacity, {
        toValue: 1, duration: 600,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.spring(mascotScale, {
        toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
      }),
      Animated.timing(mascotY, {
        toValue: 0, duration: 500,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
    ]),
  ]).start();

  // Float loop
  Animated.loop(
    Animated.sequence([
      Animated.timing(floatY, {
        toValue: -12, duration: 2000,
        easing: Easing.inOut(Easing.sin), useNativeDriver: true,
      }),
      Animated.timing(floatY, {
        toValue: 0, duration: 2000,
        easing: Easing.inOut(Easing.sin), useNativeDriver: true,
      }),
    ])
  ).start();
}, []);
  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#0A0603', '#190C05', '#2C1608', '#190C05', '#0A0603']}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bloom} />

      {/* Main content — identical to original, flame inserted above title */}
      <Animated.View style={[
        styles.content,
        { opacity: fadeIn, transform: [{ scale: scaleIn }] },
      ]}>

        {/* ── Animated flame — sits above ember. wordmark ── */}
     
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
                 
                  <Image
          source={require('../../../../assets/images/embert.png')}
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
        {/* ember. */}
        <Text style={styles.appName}>ember.</Text>
        <Text style={styles.tagline}>Focus burns brighter</Text>

        {/* CTA — opens modal */}
        <Animated.View style={[styles.ctaWrap, { transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={['#FF7830', '#EE4800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Begin Focus</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Streak pill */}
        {/* Streak pill */}


{/* Blocked apps card */}
<TouchableOpacity
  style={styles.blockerCard}
  activeOpacity={0.75}
  onPress={() => setBlockerOpen(true)}
>
  <Text style={styles.blockerIcon}>🚫</Text>
  <View style={{ flex: 1 }}>
    <Text style={styles.blockerLabel}>Blocked Apps</Text>
    <Text style={styles.blockerSub}>
      {screenTimeSelectionId ? 'Tap to manage' : 'Tap to set up'}
    </Text>
  </View>
  <Text style={styles.blockerChevron}>›</Text>
</TouchableOpacity>

      </Animated.View>

      {/* ── Start Session Modal ── */}
      <StartSessionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      <AppBlockerSheet
  visible={blockerOpen}
  onClose={() => setBlockerOpen(false)}
/>
    </View>
  );
}

// ─── Styles — identical to original ──────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0603', alignItems: 'center' },

  bloom: {
    position: 'absolute', top: height * 0.10, alignSelf: 'center',
    width: width * 1.1, height: width * 1.1, borderRadius: width * 0.55,
    backgroundColor: 'transparent',
    shadowColor: '#FF5500', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.60, shadowRadius: 160, elevation: 0,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    width: '100%',
    paddingBottom: 40,
  },

  appName: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 48,
    color: '#FF6B1A',
    letterSpacing: -1.5,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: 'rgba(255,244,230,0.50)',
    letterSpacing: 0.3,
    marginBottom: 44,
  },

  ctaWrap: {
    width: '100%',
    marginBottom: 18,
    borderRadius: 50,
    shadowColor: '#FF4400',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 14,
  },
  ctaGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  ctaText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: 0.4,
  },

  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.20)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  streakEmoji: { fontSize: 16 },
  streakText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: '#FFF4E6',
    letterSpacing: 0.2,
  },
  blockerCard: {
  flexDirection:   'row',
  alignItems:      'center',
  gap:             12,
  width:           '100%',
  marginTop:       10,
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius:    16,
  borderWidth:     1,
  borderColor:     'rgba(255,107,26,0.18)',
  backgroundColor: 'rgba(255,255,255,0.04)',
},
blockerIcon:    { fontSize: 20 },
blockerLabel:   { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF4E6' },
blockerSub:     { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,244,230,0.40)', marginTop: 2 },
blockerChevron: { fontFamily: 'Nunito_700Bold', fontSize: 22, color: 'rgba(255,244,230,0.25)' },
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

});
