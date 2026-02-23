import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
  ScrollView, NativeSyntheticEvent, NativeScrollEvent,
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

const { width: SW } = Dimensions.get('window');

const AGES        = Array.from({ length: 83 }, (_, i) => i + 13);
const ITEM_H      = 56;
const VISIBLE     = 5;
const WHEEL_H     = ITEM_H * VISIBLE;
const DEFAULT_AGE = 22;
const DEFAULT_IDX = AGES.indexOf(DEFAULT_AGE);
const INSET       = ITEM_H * 2;

function ageCopy(age: number): { line: string; emoji: string } {
  if (age < 18) return { emoji: '📚', line: 'Building focus now sets you up for life.' };
  if (age < 25) return { emoji: '🚀', line: 'The habits you build now compound for decades.' };
  if (age < 35) return { emoji: '💼', line: 'Peak years. Protect them fiercely.' };
  if (age < 50) return { emoji: '⚡', line: 'Your attention is your most valuable asset.' };
  return              { emoji: '🧠', line: 'Deep work matters at every stage.' };
}

export default function AgeScreen() {
  const insets    = useSafeAreaInsets();
  const setAnswer = useOnboardingStore(s => s.setAnswer);
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  const [selectedAge, setSelectedAge] = useState(DEFAULT_AGE);
  const scrollRef    = useRef<ScrollView>(null);
  const committedIdx = useRef(DEFAULT_IDX);
  // Track whether momentum is still in flight — only commit after it fully settles
  const isMomentumScrolling = useRef(false);

  const headerA = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(16)).current;
  const wheelA  = useRef(new Animated.Value(0)).current;
  const wheelS  = useRef(new Animated.Value(0.94)).current;
  const ctaA    = useRef(new Animated.Value(0)).current;
  const ctaY    = useRef(new Animated.Value(14)).current;
  const copyA   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(headerA, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(wheelA, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(wheelS, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(ctaA, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(ctaY, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: DEFAULT_IDX * ITEM_H, animated: false });
    }, 80);
  }, []);

  const commitIdx = (offsetY: number) => {
    const idx     = Math.max(0, Math.min(AGES.length - 1, Math.round(offsetY / ITEM_H)));
    if (idx !== committedIdx.current) {
      committedIdx.current = idx;
      setSelectedAge(AGES[idx]);
      copyA.setValue(0.2);
      Animated.timing(copyA, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  // Only update state — never call scrollTo here.
  // Calling scrollTo inside a scroll callback interrupts the native gesture
  // and is what caused the lock. snapToInterval handles alignment natively.
  const handleMomentumBegin = () => {
    isMomentumScrolling.current = true;
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isMomentumScrolling.current = false;
    commitIdx(e.nativeEvent.contentOffset.y);
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Only commit when the user drags and releases with no momentum —
    // if momentum is about to start, handleMomentumEnd will take over.
    if (!isMomentumScrolling.current) {
      commitIdx(e.nativeEvent.contentOffset.y);
    }
  };

  const handleContinue = () => {
    setAnswer('age', selectedAge);
    router.push('/(onboarding)/phone');
  };

  if (!fontsLoaded) return null;
  const copy = ageCopy(selectedAge);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060302', '#0E0604', '#150806']}
        start={{ x: 0.4, y: 0 }} end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <OnboardingProgress step={3} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View style={[styles.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
        <Text style={styles.eyebrow}>QUICK ONE</Text>
        <Text style={styles.question}>How old are you?</Text>
        <Text style={styles.sub}>Helps us tailor your focus plan.</Text>
      </Animated.View>

      <Animated.View style={[styles.wheelOuter, { opacity: wheelA, transform: [{ scale: wheelS }] }]}>
        <View style={styles.selectionBand} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255,144,48,0.11)', 'rgba(255,94,14,0.06)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.selectionBorderTop} />
          <View style={styles.selectionBorderBot} />
        </View>

        <View style={styles.fadeMaskTop} pointerEvents="none">
          <LinearGradient colors={['#0E0604', 'transparent']} style={StyleSheet.absoluteFill} />
        </View>
        <View style={styles.fadeMaskBot} pointerEvents="none">
          <LinearGradient colors={['transparent', '#0E0604']} style={StyleSheet.absoluteFill} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.wheelScroll}
          contentContainerStyle={[styles.wheelContent, { paddingVertical: INSET }]}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          // ✂️ snapToAlignment REMOVED — conflicts with paddingVertical on iOS
          //    and causes the scroll to lock after the first snap.
          //    snapToInterval alone is sufficient; padding handles centering.
          onMomentumScrollBegin={handleMomentumBegin}
          onMomentumScrollEnd={handleMomentumEnd}
          onScrollEndDrag={handleScrollEndDrag}
        >
          {AGES.map((age) => (
            <View key={age} style={styles.wheelItem}>
              <Text style={[
                styles.wheelNumber,
                age === selectedAge && styles.wheelNumberSelected,
              ]}>
                {age}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.copyWrap, { opacity: copyA }]}>
        <Text style={styles.copyEmoji}>{copy.emoji}</Text>
        <Text style={styles.copyLine}>{copy.line}</Text>
      </Animated.View>

      <Animated.View style={[
        styles.ctaWrap,
        { opacity: ctaA, transform: [{ translateY: ctaY }], paddingBottom: insets.bottom + 28 },
      ]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleContinue} activeOpacity={0.88}>
          <LinearGradient
            colors={['#FF9030', '#FF5E0E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            <Text style={styles.ctaTxt}>Continue</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.privacyNote}>Your age is never shared or sold.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060302' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },

  header: { paddingHorizontal: 28, paddingBottom: 32, gap: 8 },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: 'rgba(255,100,30,0.55)', textTransform: 'uppercase',
  },
  question: {
    fontFamily: FONTS.black, fontSize: 34,
    color: COLORS.cream, letterSpacing: -0.6, lineHeight: 40,
  },
  sub: {
    fontFamily: FONTS.regular, fontSize: 15,
    color: 'rgba(255,244,230,0.38)', lineHeight: 22,
  },

  wheelOuter: {
    height: WHEEL_H,
    marginHorizontal: 28,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  wheelScroll:  { flex: 1 },
  wheelContent: { alignItems: 'center' },
  wheelItem: {
    height: ITEM_H,
    width: SW - 56 - 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelNumber: {
    fontFamily: FONTS.bold, fontSize: 26,
    color: 'rgba(255,244,230,0.20)', letterSpacing: -0.5,
  },
  wheelNumberSelected: {
    fontFamily: FONTS.black, fontSize: 44,
    color: COLORS.cream, letterSpacing: -1,
  },

  selectionBand: {
    position: 'absolute',
    top: ITEM_H * 2, left: 0, right: 0, height: ITEM_H,
    zIndex: 2,
  },
  selectionBorderTop: {
    position: 'absolute', top: 0, left: 20, right: 20,
    height: 1, backgroundColor: 'rgba(255,144,48,0.40)',
  },
  selectionBorderBot: {
    position: 'absolute', bottom: 0, left: 20, right: 20,
    height: 1, backgroundColor: 'rgba(255,144,48,0.40)',
  },

  fadeMaskTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: ITEM_H * 2, zIndex: 3,
  },
  fadeMaskBot: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: ITEM_H * 2, zIndex: 3,
  },

  copyWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 28, paddingTop: 24,
  },
  copyEmoji: { fontSize: 22 },
  copyLine: {
    fontFamily: FONTS.bold, fontSize: 14,
    color: 'rgba(255,244,230,0.50)', lineHeight: 20, flex: 1,
  },

  ctaWrap: {
    paddingHorizontal: 28, paddingTop: 24,
    gap: 12, marginTop: 'auto',
  },
  ctaBtn: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#FF6600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 16, elevation: 8,
  },
  ctaGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 19, paddingHorizontal: 28, gap: 10,
  },
  ctaTxt:   { fontFamily: FONTS.black, fontSize: 17, color: '#1A0602', letterSpacing: 0.2 },
  ctaArrow: { fontFamily: FONTS.black, fontSize: 18, color: '#1A0602' },
  privacyNote: {
    fontFamily: FONTS.regular, fontSize: 12,
    color: 'rgba(255,244,230,0.22)', textAlign: 'center', letterSpacing: 0.2,
  },
});
