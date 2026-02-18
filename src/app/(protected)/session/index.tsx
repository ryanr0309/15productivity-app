/**
 * Ember – SessionScreen.tsx  (Screen 02 · Session Active)
 *
 * Timer now lives in sessionStore — not here — so it survives
 * navigation to the checkpoint screen and back.
 *
 * Checkpoint button springs in when store.checkpointReady === true.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, Image, Keyboard,
  KeyboardAvoidingView, Platform, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular } from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  useSessionStore,
  selectTimeDisplay,
  selectCpProgress,
  selectCpRemaining,
} from '../../../store/sessionStore'

import { COLORS, FONTS } from '../../../theme';

const { width } = Dimensions.get('window');
const RING_SIZE   = Math.round(width * 0.74);
const RING_R      = RING_SIZE / 2 - 16;
const RING_STROKE = 7;
const RING_CIRCUM = 2 * Math.PI * RING_R;
const MASCOT_W    = 78;
const MASCOT_H    = MASCOT_W * 1.3;

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  // ── Store ──────────────────────────────────────────────────────────────────
  const goal            = useSessionStore(s => s.goal);
  const elapsed         = useSessionStore(s => s.elapsed);
  const durationSec     = useSessionStore(s => s.durationSec);
  const checkpointReady = useSessionStore(s => s.checkpointReady);
  const takeCheckpoint  = useSessionStore(s => s.takeCheckpoint);
  const stopSession     = useSessionStore(s => s.stopSession);
  const resetSession    = useSessionStore(s => s.resetSession);
  const timeDisplay     = useSessionStore(selectTimeDisplay);
  const cpProgress      = useSessionStore(selectCpProgress);
  const cpRemaining     = useSessionStore(selectCpRemaining);

  const ringOffset = RING_CIRCUM * (1 - elapsed / durationSec);

  // ── Checkpoint button: springs in/out based on checkpointReady ─────────────
  const cpScale   = useRef(new Animated.Value(0)).current;
  const cpOpacity = useRef(new Animated.Value(0)).current;
  const cpPulse   = useRef(new Animated.Value(1)).current;
  const cpPulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (checkpointReady) {
      // Spring the button in
      Animated.parallel([
        Animated.spring(cpScale,   { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.timing(cpOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      // Gentle pulse to draw attention
      cpPulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(cpPulse, { toValue: 1.04, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(cpPulse, { toValue: 1.00, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      cpPulseLoop.current.start();
    } else {
      cpPulseLoop.current?.stop();
      Animated.parallel([
        Animated.spring(cpScale,   { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(cpOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
    return () => cpPulseLoop.current?.stop();
  }, [checkpointReady, cpOpacity, cpPulse, cpScale]);

  const handleCheckpointPress = () => {
    takeCheckpoint(); // clears ready flag, timer keeps running in store
    router.push('/session/checkpoint');
  };

  // ── Exit hatch ─────────────────────────────────────────────────────────────
  const [inputVal, setInputVal] = useState('');
  const [isReady,  setIsReady]  = useState(false);
  const shakeX      = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue:  9, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -9, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  7, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -7, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeX]);

  const handleChange = (text: string) => { setInputVal(text); setIsReady(text === goal); };
  const handleExit   = useCallback(() => {
    if (inputVal !== goal) { shake(); return; }
    Keyboard.dismiss();
    stopSession();
    resetSession();
    router.replace('/(protected)/(tabs)');
  }, [inputVal, goal, shake, stopSession, resetSession]);

  // ── Visual animations ──────────────────────────────────────────────────────
  const floatY  = useRef(new Animated.Value(0)).current;
  const glowPls = useRef(new Animated.Value(0)).current;
  const ringPls = useRef(new Animated.Value(0)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    const loop = (a: Animated.Value, dur: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    loop(floatY,  2500);
    loop(glowPls, 1700);
    loop(ringPls, 2100);
    const t = setTimeout(() =>
      Animated.timing(exitOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start()
    , 2000);
    return () => clearTimeout(t);
  }, [exitOpacity, fadeIn, floatY, glowPls, ringPls]);

  const mascotY      = floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const glowScale    = glowPls.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.06] });
  const glowOp       = glowPls.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.52] });
  const ringGlowOp   = ringPls.interpolate({ inputRange: [0, 1], outputRange: [0.40, 0.80] });
  const mascotTop    = RING_SIZE / 2 - RING_R - MASCOT_H + 20;

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#090602', '#180B05', '#1E1007', '#180B05', '#090602']}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bgBloom} />

        <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 20 }]}>
          <Text style={styles.screenLabel}>02  ·  SESSION ACTIVE</Text>

          {/* ── Ring + mascot ── */}
          <View style={[styles.ringWrap, { width: RING_SIZE, height: RING_SIZE }]}>
            <Animated.View style={[styles.ringGlow, { opacity: ringGlowOp }]} />
            <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgGrad id="arc" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%"   stopColor="#FF5500" />
                  <Stop offset="55%"  stopColor="#FF8C00" />
                  <Stop offset="100%" stopColor="#FFD166" />
                </SvgGrad>
              </Defs>
              <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R} fill="none"
                stroke="rgba(255,255,255,0.08)" strokeWidth={RING_STROKE} />
              <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R} fill="none"
                stroke="url(#arc)" strokeWidth={RING_STROKE} strokeLinecap="round"
                strokeDasharray={RING_CIRCUM} strokeDashoffset={ringOffset}
                rotation="-90" origin={`${RING_SIZE/2}, ${RING_SIZE/2}`} />
            </Svg>

            
          </View>

          {/* ── Timer ── */}
          <Text style={styles.timer}>{timeDisplay}</Text>

          {/* ── Goal ── */}
          <Text style={styles.goalLine}>
            {'Goal: '}<Text style={styles.goalValue}>{goal}</Text>
          </Text>

          {/* ── Checkpoint section ── */}
          <View style={styles.cpSection}>
            {/* Progress bar row — always visible */}
            <View style={styles.cpRow}>
              <Text style={styles.cpLabel}>next checkpoint</Text>
              <Text style={styles.cpTime}>{cpRemaining}</Text>
            </View>
            <View style={styles.cpTrack}>
              <LinearGradient
                colors={['#FF6B1A', '#FFD166']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.cpFill, { width: `${Math.round(cpProgress * 100)}%` as `${number}%` }]}
              />
            </View>

            {/* ── Checkpoint ready button — springs in when timer hits 0 ── */}
            <Animated.View style={{ opacity: cpOpacity, transform: [{ scale: cpScale }, { scale: cpPulse }] }}>
              <TouchableOpacity
                style={styles.cpBtn}
                activeOpacity={0.85}
                onPress={handleCheckpointPress}
              >
                <LinearGradient
                  colors={['#FFD166', '#FF8C00']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.cpBtnInner}
                >
                  <Text style={styles.cpBtnEmoji}>🎉</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cpBtnTitle}>Checkpoint reached!</Text>
                    <Text style={styles.cpBtnSub}>Take a 2-min break</Text>
                  </View>
                  <Text style={styles.cpBtnArrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ── Exit hatch ── */}
          <Animated.View style={[styles.exitSection, { opacity: exitOpacity }]}>
            <Animated.View style={[styles.inputBox, isReady && styles.inputBoxReady, { transform: [{ translateX: shakeX }] }]}>
              <TextInput
                style={styles.exitInput}
                placeholder={`type: ${goal}`}
                placeholderTextColor="rgba(255,160,60,0.28)"
                value={inputVal}
                onChangeText={handleChange}
                onSubmitEditing={handleExit}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              {isReady && (
                <TouchableOpacity style={styles.exitBtn} onPress={handleExit} activeOpacity={0.8}>
                  <Text style={styles.exitBtnText}>Exit</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
            <Text style={styles.exitHint}>CASE SENSITIVE  ·  BE SURE</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#090602', alignItems: 'center' },
  bgBloom:        {
    position: 'absolute', top: '8%', alignSelf: 'center',
    width: width * 0.95, height: width * 0.95, borderRadius: width * 0.475,
    backgroundColor: 'transparent',
    shadowColor: '#FF5500', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42, shadowRadius: 130, elevation: 0,
  },
  content:        { flex: 1, alignItems: 'center', width: '100%', paddingHorizontal: 28 },
  screenLabel:    { fontFamily: FONTS.regular, fontSize: 11, letterSpacing: 3.5, color: 'rgba(255,180,100,0.38)', textTransform: 'uppercase', marginBottom: 24 },
  ringWrap:       { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ringGlow:       { position: 'absolute', width: '88%', height: '88%', borderRadius: 9999, backgroundColor: 'transparent', shadowColor: '#FF6B1A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 38, elevation: 0 },
  mascotWrap:     { position: 'absolute', alignSelf: 'center', alignItems: 'center' },
  mascotGlow:     { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: '#FF6B1A' },
  timer:          { fontFamily: FONTS.black, fontSize: 68, color: COLORS.cream, letterSpacing: 3, marginBottom: 6 },
  goalLine:       { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,244,230,0.50)', letterSpacing: 0.3, marginBottom: 28 },
  goalValue:      { fontFamily: FONTS.bold, color: COLORS.orange },

  // Checkpoint
  cpSection:      { width: '100%', marginBottom: 24, gap: 14 },
  cpRow:          { flexDirection: 'row', justifyContent: 'space-between' },
  cpLabel:        { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.32)', letterSpacing: 0.2 },
  cpTime:         { fontFamily: FONTS.bold, fontSize: 12, color: 'rgba(255,244,230,0.50)' },
  cpTrack:        { height: 5, backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 3, overflow: 'hidden' },
  cpFill:         { height: '100%', borderRadius: 3, minWidth: 6, shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 5 },
  cpBtn:          { borderRadius: 16, overflow: 'hidden', shadowColor: '#FFD166', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.40, shadowRadius: 14, elevation: 10 },
  cpBtnInner:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 14 },
  cpBtnEmoji:     { fontSize: 26 },
  cpBtnTitle:     { fontFamily: FONTS.bold,    fontSize: 15, color: '#1A0800' },
  cpBtnSub:       { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(26,8,0,0.60)', marginTop: 1 },
  cpBtnArrow:     { fontFamily: FONTS.bold, fontSize: 22, color: 'rgba(26,8,0,0.45)' },

  // Exit hatch
  exitSection:    { width: '100%', alignItems: 'center', marginTop: 'auto', paddingBottom: 12 },
  inputBox:       { width: '100%', flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(180,80,20,0.35)', backgroundColor: 'rgba(22,10,4,0.55)', paddingHorizontal: 16, marginBottom: 10 },
  inputBoxReady:  { borderColor: 'rgba(80,200,120,0.45)', backgroundColor: 'rgba(12,28,14,0.45)' },
  exitInput:      { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,200,100,0.72)', letterSpacing: 0.5, paddingVertical: 17, textAlign: 'center' },
  exitBtn:        { backgroundColor: COLORS.red, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, marginLeft: 8 },
  exitBtnText:    { fontFamily: FONTS.bold, fontSize: 13, color: '#fff' },
  exitHint:       { fontFamily: FONTS.regular, fontSize: 10, color: 'rgba(255,244,230,0.20)', letterSpacing: 2.8, textAlign: 'center' },
});
