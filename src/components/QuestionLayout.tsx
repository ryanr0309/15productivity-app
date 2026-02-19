import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
  PanResponder, GestureResponderEvent, PanResponderGestureState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../theme';
import { OnboardingProgress } from './OnboardingProgress';
import { useOnboardingStore } from '../store/onboardingStore';

const { width: SW } = Dimensions.get('window');

export function QuestionLayout({
  step,
  eyebrow,
  question,
  children,
  ctaLabel = 'Continue',
  onContinue,
  canContinue,
}: {
  step:       number;
  eyebrow:    string;
  question:   string;
  children:   React.ReactNode;
  ctaLabel?:  string;
  onContinue: () => void;
  canContinue:boolean;
}) {
  const insets = useSafeAreaInsets();

  // Staggered entrance
  const headerA = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(18)).current;
  const bodyA   = useRef(new Animated.Value(0)).current;
  const bodyY   = useRef(new Animated.Value(18)).current;
  const ctaA    = useRef(new Animated.Value(0)).current;
  const ctaY    = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(headerA, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(280),
      Animated.parallel([
        Animated.timing(bodyA, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bodyY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(440),
      Animated.parallel([
        Animated.timing(ctaA, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ctaY, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={ql.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060302', '#0E0604', '#150806']}
        start={{ x: 0.4, y: 0 }} end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[ql.topBar, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={ql.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={ql.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={ql.progressWrap}>
          <OnboardingProgress step={step} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Header */}
      <Animated.View style={[ql.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
        <Text style={ql.eyebrow}>{eyebrow}</Text>
        <Text style={ql.question}>{question}</Text>
      </Animated.View>

      {/* Choices / body */}
      <Animated.View style={[ql.body, { opacity: bodyA, transform: [{ translateY: bodyY }] }]}>
        {children}
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[ql.ctaWrap, { opacity: ctaA, transform: [{ translateY: ctaY }], paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[ql.ctaBtn, !canContinue && ql.ctaBtnOff]}
          onPress={canContinue ? onContinue : undefined}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={canContinue ? ['#FF9030', '#FF5E0E'] : ['#2A1A0E', '#2A1A0E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={ql.ctaGrad}
          >
            <Text style={[ql.ctaTxt, !canContinue && ql.ctaTxtOff]}>{ctaLabel}</Text>
            <Text style={[ql.ctaArrow, !canContinue && ql.ctaTxtOff]}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}


const ql = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#060302' },

  topBar: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 20,
    paddingBottom:  16,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },
  progressWrap: { flex: 1 },

  header: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    gap: 10,
  },
  eyebrow: {
    fontFamily:    FONTS.bold,
    fontSize:      11,
    letterSpacing: 3,
    color:         'rgba(255,100,30,0.55)',
    textTransform: 'uppercase',
  },
  question: {
    fontFamily:    FONTS.black,
    fontSize:      30,
    color:         COLORS.cream,
    lineHeight:    38,
    letterSpacing: -0.5,
  },

  body: {
    flex: 1,
    paddingHorizontal: 28,
    gap: 10,
  },

  ctaWrap: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  ctaBtn: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#FF6600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 16, elevation: 8,
  },
  ctaBtnOff: { shadowOpacity: 0 },
  ctaGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 19, paddingHorizontal: 28, gap: 10,
  },
  ctaTxt: { fontFamily: FONTS.black, fontSize: 17, color: '#1A0602', letterSpacing: 0.2 },
  ctaTxtOff: { color: 'rgba(255,255,255,0.22)' },
  ctaArrow: { fontFamily: FONTS.black, fontSize: 18, color: '#1A0602' },
});

// ChoiceButton styles
const cb = StyleSheet.create({
  btn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius:    18,
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.07)',
    padding:         16,
    overflow:        'hidden',
  },
  btnSelected: {
    borderColor: 'rgba(255,144,48,0.55)',
    backgroundColor: 'rgba(255,107,26,0.08)',
  },
  icon:  { fontSize: 26, width: 34, textAlign: 'center' },
  textWrap:  { flex: 1, gap: 2 },
  label:     { fontFamily: FONTS.bold, fontSize: 15, color: 'rgba(255,244,230,0.65)' },
  labelSelected: { color: COLORS.cream },
  sublabel:  { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.30)', lineHeight: 16 },
  check: {
    width: 26, height: 26, borderRadius: 13, overflow: 'hidden',
  },
  checkGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontFamily: FONTS.bold, fontSize: 13, color: '#1A0602' },
  checkEmpty: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
});

// Choice list/grid styles
const choices = StyleSheet.create({
  list: { gap: 10 },
  grid: { gap: 10 },
  hint: {
    fontFamily:  FONTS.regular,
    fontSize:    12,
    color:       'rgba(255,244,230,0.28)',
    textAlign:   'center',
    letterSpacing: 0.3,
    marginTop:   4,
  },
});

// Slider screen styles
const sl = StyleSheet.create({
  wrap: { gap: 28 },

  bigTimeWrap: { alignItems: 'center', gap: 2 },
  bigTime: {
    fontFamily: FONTS.black, fontSize: 64,
    letterSpacing: -2, lineHeight: 72,
  },
  bigTimeSub: {
    fontFamily: FONTS.regular, fontSize: 14,
    color: 'rgba(255,244,230,0.35)', letterSpacing: 1,
    textTransform: 'uppercase',
  },

  copyWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  copyEmoji: { fontSize: 22 },
  copyLine: { fontFamily: FONTS.bold, fontSize: 14, flex: 1, lineHeight: 20 },

  // Slider
  trackWrap: {
    height:         44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  track: {
    height:          6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius:    3,
    overflow:        'visible',
  },
  fill: {
    height:       6,
    borderRadius: 3,
    overflow:     'hidden',
    minWidth:     6,
  },
  thumb: {
    position:  'absolute',
    width:     28,
    height:    28,
    borderRadius: 14,
    marginLeft: 16 - 14,   // align centre to track edge
    top:        44 / 2 - 14,
    overflow:  'hidden',
  },
  thumbGrad: { flex: 1, borderRadius: 14 },
  thumbGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius:  10,
  },

  labelsRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: -14,
  },
  scaleLabel: {
    fontFamily: FONTS.regular, fontSize: 11,
    color: 'rgba(255,244,230,0.22)',
  },
  scaleLabelActive: {
    color: COLORS.amber,
    fontFamily: FONTS.bold,
  },

  // Projection card
  projCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
    padding:         20,
    gap:             10,
  },
  projLabel:  { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.35)', textTransform: 'uppercase', letterSpacing: 1 },
  projNumber: { fontFamily: FONTS.black, fontSize: 22, color: COLORS.cream, lineHeight: 28 },
  projBar: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3, overflow: 'hidden',
  },
  projFill:   { height: 5, borderRadius: 3 },
  projSub:    { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.28)' },
});
