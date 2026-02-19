import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing, ScrollView,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { useOnboardingStore } from '../../store/onboardingStore';
import { QuestionLayout } from '../../components/QuestionLayout';
import { ChoiceButton } from '../../components/ChoiceButton';

const { width: SW, height: SH } = Dimensions.get('window');

const SLIDER_MIN   = 0.5;   // hours
const SLIDER_MAX   = 12;
const SLIDER_TRACK = SW - 56 - 32;   // full width minus padding

// Labels shown below the slider
const SLIDER_LABELS = [
  { value: 0.5, label: '30m' },
  { value: 3,   label: '3h'  },
  { value: 6,   label: '6h'  },
  { value: 9,   label: '9h'  },
  { value: 12,  label: '12h+'},
];

// What we say at different levels
function sliderCopy(hours: number): { emoji: string; line: string; color: string } {
  if (hours < 2)  return { emoji: '😇', line: "That's impressive self-control.",               color: '#66DD88' };
  if (hours < 4)  return { emoji: '🙂', line: "About average — there's still room to reclaim.", color: COLORS.amber };
  if (hours < 6)  return { emoji: '😬', line: "That's 60 days a year staring at a screen.",     color: COLORS.orange };
  if (hours < 9)  return { emoji: '😰', line: "Over 90 days of your year. Let's change that.",  color: '#FF6644' };
  return               { emoji: '🔥', line: "That's 4+ months a year. Ember was built for this.", color: '#FF3333' };
}

// Convert 0–1 position to hours value
function posToHours(pos: number): number {
  const raw = SLIDER_MIN + pos * (SLIDER_MAX - SLIDER_MIN);
  // Snap to nearest 0.5
  return Math.round(raw * 2) / 2;
}

function hoursToPos(hours: number): number {
  return (hours - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
}

function fmtHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function QPhoneScreen() {
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });
  const setAnswer = useOnboardingStore(s => s.setAnswer);

  const [hours, setHours]           = useState(4);
  const thumbX  = useRef(new Animated.Value(hoursToPos(4) * SLIDER_TRACK)).current;
  const thumbScale = useRef(new Animated.Value(1)).current;
  const fillW      = useRef(new Animated.Value(hoursToPos(4) * SLIDER_TRACK)).current;
  const copyA      = useRef(new Animated.Value(1)).current;

  // Sync fillW to thumbX
  const currentX = useRef(hoursToPos(4) * SLIDER_TRACK);

  const updateSlider = useCallback((rawX: number) => {
    const clamped = Math.max(0, Math.min(SLIDER_TRACK, rawX));
    currentX.current = clamped;
    thumbX.setValue(clamped);
    fillW.setValue(clamped);

    const pos   = clamped / SLIDER_TRACK;
    const newH  = posToHours(pos);
    setHours(prev => {
      if (prev !== newH) {
        // Flash copy on change
        Animated.sequence([
          Animated.timing(copyA, { toValue: 0.3, duration: 80, useNativeDriver: true }),
          Animated.timing(copyA, { toValue: 1.0, duration: 180, useNativeDriver: true }),
        ]).start();
      }
      return newH;
    });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        Animated.spring(thumbScale, { toValue: 1.35, tension: 100, friction: 5, useNativeDriver: true }).start();
        updateSlider(e.nativeEvent.locationX);
      },
      onPanResponderMove: (_, g: PanResponderGestureState) => {
        updateSlider(currentX.current + g.dx);
      },
      onPanResponderRelease: () => {
        Animated.spring(thumbScale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }).start();
      },
    })
  ).current;

  const handleContinue = () => {
    setAnswer('dailyPhoneHours', hours);
    router.push('/(onboarding)/waste');
  };

  

  const copy = sliderCopy(hours);

  // Entrance animation for the big number
  const numA = useRef(new Animated.Value(0)).current;
  const numY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(numA, { toValue: 1, duration: 450, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(numY, { toValue: 0, duration: 450, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <QuestionLayout
      step={6}
      eyebrow="QUESTION 5 OF 5"
      question={"How much time do you spend\non your phone each day?"}
      onContinue={handleContinue}
      canContinue={true}
      ctaLabel="Build my plan →"
    >
      <View style={sl.wrap}>

        {/* Big time display */}
        <Animated.View style={[sl.bigTimeWrap, { opacity: numA, transform: [{ translateY: numY }] }]}>
          <Text style={[sl.bigTime, { color: copy.color }]}>{fmtHours(hours)}</Text>
          <Text style={sl.bigTimeSub}>per day</Text>
        </Animated.View>

        {/* Reaction copy */}
        <Animated.View style={[sl.copyWrap, { opacity: copyA }]}>
          <Text style={sl.copyEmoji}>{copy.emoji}</Text>
          <Text style={[sl.copyLine, { color: copy.color }]}>{copy.line}</Text>
        </Animated.View>

        {/* Slider track */}
        <View style={sl.trackWrap} {...panResponder.panHandlers}>
          {/* Track background */}
          <View style={sl.track}>
            {/* Filled portion */}
            <Animated.View style={[sl.fill, { width: fillW }]}>
              <LinearGradient
                colors={['#FF9030', copy.color as string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          {/* Thumb */}
          <Animated.View
            style={[
              sl.thumb,
              {
                transform: [
                  { translateX: thumbX },
                  { scale: thumbScale },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#FF9030', '#FF5E0E']}
              style={sl.thumbGrad}
            />
            {/* Thumb shadow glow */}
            <View style={[sl.thumbGlow, { shadowColor: copy.color }]} />
          </Animated.View>
        </View>

        {/* Scale labels */}
        <View style={sl.labelsRow}>
          {SLIDER_LABELS.map(l => (
            <Text key={l.value} style={[
              sl.scaleLabel,
              Math.abs(hours - l.value) < 0.5 && sl.scaleLabelActive,
            ]}>
              {l.label}
            </Text>
          ))}
        </View>

        {/* Year projection card */}
        <View style={sl.projCard}>
          <Text style={sl.projLabel}>That's roughly</Text>
          <Text style={sl.projNumber} numberOfLines={1}>
            <Text style={{ color: copy.color }}>
              {Math.round(hours * 365 / 24)} days
            </Text>
            {' '}a year on your phone
          </Text>
          <View style={sl.projBar}>
            <View style={[sl.projFill, {
              width: `${Math.min(Math.round((hours / 12) * 100), 100)}%`,
              backgroundColor: copy.color,
            }]} />
          </View>
          <Text style={sl.projSub}>
            {Math.round(hours * 365)} hours · {Math.round(hours * 365 * 60 / 1440)} days · out of 365
          </Text>
        </View>

      </View>
    </QuestionLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

// QuestionLayout styles
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
