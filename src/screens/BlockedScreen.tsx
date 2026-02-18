/**
 * Ember – BlockedScreen.tsx  (Screen 04 · Blocked State)
 * Shown when user tries to open a blocked app during a session.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing, Keyboard,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import EmberMascot from '../components/EmberMascot';
import { COLORS, FONTS, RADII, NavigationProp } from '../theme';

interface BlockedScreenProps {
  navigation?: NavigationProp;
  /** The goal the user typed at session start — they must retype it exactly to exit */
  sessionGoal?: string;
  /** Which app was blocked */
  blockedAppName?: string;
}

export default function BlockedScreen({
  navigation,
  sessionGoal    = 'finish chapter 4',
  blockedAppName = 'Instagram',
}: BlockedScreenProps) {
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  const [inputValue,    setInputValue]    = useState('');
  const [shakeActive,   setShakeActive]   = useState(false);
  const [unlockReady,   setUnlockReady]   = useState(false);
  const [confirmStage,  setConfirmStage]  = useState(false);

  // ── Animations ─────────────────────────────────────────────────────────────
  const droopAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;
  const slideUp     = useRef(new Animated.Value(30)).current;
  const tearAnim    = useRef(new Animated.Value(0)).current;
  const confirmScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // Sad droop
    Animated.loop(Animated.sequence([
      Animated.timing(droopAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(droopAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    // Red glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    // Tear drip loop
    Animated.loop(Animated.sequence([
      Animated.delay(2000),
      Animated.timing(tearAnim, { toValue: 1, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(tearAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ])).start();
  }, [droopAnim, fadeIn, glowAnim, slideUp, tearAnim]);

  const droopY      = droopAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  const droopRotate = droopAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-3deg'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] });
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.05]  });
  const tearY       = tearAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 22]      });
  const tearOpacity = tearAnim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.8, 0.8, 0] });

  // ── Input logic ────────────────────────────────────────────────────────────
  const handleInputChange = (text: string) => {
    setInputValue(text);
    setUnlockReady(text === sessionGoal);
  };

  const triggerShake = () => {
    setShakeActive(true);
    Keyboard.dismiss();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start(() => setShakeActive(false));
  };

  const handleUnlockAttempt = () => {
    if (inputValue !== sessionGoal) {
      triggerShake();
      return;
    }
    if (!confirmStage) {
      setConfirmStage(true);
      Animated.spring(confirmScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
      return;
    }
    navigation?.navigate('Home');
  };

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />

        <LinearGradient colors={['#0E0808', '#120A0A', '#1A0E0E']} style={StyleSheet.absoluteFill} />
        {/* Red bloom */}
        <Animated.View style={[styles.redBloom, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

        <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

          {/* ── App name pill ── */}
          <View style={styles.appNamePill}>
            <Text style={styles.appNameText}>{blockedAppName}</Text>
            <View style={styles.blockDot} />
          </View>

          {/* ── Mascot + tear ── */}
          <View style={styles.mascotArea}>
            {/* Animated tear drop */}
            <Animated.View style={[styles.tear, { transform: [{ translateY: tearY }], opacity: tearOpacity }]} />

            <Animated.View style={{ transform: [{ translateY: droopY }, { rotate: droopRotate }] }}>
              <EmberMascot state="sad" size={200} />
            </Animated.View>
          </View>

          {/* ── Message ── */}
          <Text style={styles.blockedTitle}>This app is blocked</Text>
          <Text style={styles.blockedSub}>
            You're in a focus session.{'\n'}Come back when you're done. 🔥
          </Text>

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>want to end early?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Goal re-entry ── */}
          <Text style={styles.inputLabel}>Type your goal to exit the session</Text>

          <Animated.View style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
            <TextInput
              style={[
                styles.input,
                unlockReady && styles.inputReady,
                shakeActive && styles.inputError,
              ]}
              placeholder={`type: ${sessionGoal}`}
              placeholderTextColor="rgba(122,101,85,0.5)"
              value={inputValue}
              onChangeText={handleInputChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleUnlockAttempt}
            />
            {unlockReady && (
              <Text style={styles.inputCheck}>✓</Text>
            )}
          </Animated.View>

          <Text style={styles.inputHint}>CASE SENSITIVE · NO SHORTCUTS</Text>

          {/* ── Confirm stage warning ── */}
          {confirmStage && (
            <Animated.View style={[styles.confirmBox, { transform: [{ scale: confirmScale }] }]}>
              <Text style={styles.confirmTitle}>⚠️ Are you sure?</Text>
              <Text style={styles.confirmSub}>Your streak and session data will be saved, but the session will end.</Text>
            </Animated.View>
          )}

          {/* ── Action buttons ── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.exitBtn, !unlockReady && styles.exitBtnDisabled]}
              activeOpacity={unlockReady ? 0.8 : 1}
              onPress={handleUnlockAttempt}
            >
              <LinearGradient
                colors={unlockReady ? ['#C03030', '#E84545'] : ['#2A1A1A', '#2A1A1A']}
                style={styles.exitGradient}
              >
                <Text style={[styles.exitText, !unlockReady && styles.exitTextDisabled]}>
                  {confirmStage ? 'Confirm Exit' : 'End Session'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.stayBtn} activeOpacity={0.7}
              onPress={() => navigation?.goBack()}>
              <Text style={styles.stayText}>Stay focused 💪</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#120A0A' },
  redBloom: {
    position: 'absolute', top: '10%', alignSelf: 'center',
    width: 380, height: 380, borderRadius: 190,
    backgroundColor: COLORS.red,
  },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 60 },

  // App name pill
  appNamePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(232,69,69,0.1)',
    borderWidth: 1, borderColor: 'rgba(232,69,69,0.25)',
    borderRadius: RADII.pill, paddingHorizontal: 16, paddingVertical: 7,
    marginBottom: 20,
  },
  appNameText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.red },
  blockDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red },

  // Mascot
  mascotArea: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tear:       {
    position: 'absolute', top: 145, left: '42%',
    width: 10, height: 16, borderRadius: 5,
    backgroundColor: '#4488CC',
  },

  // Message
  blockedTitle: { fontFamily: FONTS.black, fontSize: 24, color: COLORS.red, textAlign: 'center', letterSpacing: -0.3 },
  blockedSub:   { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 24 },

  // Divider
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dividerText: { fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 10, color: COLORS.muted, letterSpacing: 0.3 },

  // Input
  inputLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, alignSelf: 'flex-start', marginBottom: 8, letterSpacing: 0.3 },
  inputWrap:  { width: '100%', position: 'relative' },
  input:      {
    width: '100%',
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: 'rgba(232,69,69,0.2)',
    borderRadius: RADII.md, padding: 14,
    fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 13,
    color: COLORS.cream, letterSpacing: 0.5, textAlign: 'center',
  },
  inputReady: { borderColor: 'rgba(74,200,120,0.5)', backgroundColor: 'rgba(74,200,120,0.05)' },
  inputError: { borderColor: COLORS.red },
  inputCheck: { position: 'absolute', right: 14, top: 14, fontSize: 18, color: '#4AC878' },
  inputHint:  { fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 9, color: COLORS.faint, letterSpacing: 0.5, marginTop: 6, marginBottom: 16 },

  // Confirm box
  confirmBox:  {
    width: '100%', backgroundColor: 'rgba(232,69,69,0.08)',
    borderWidth: 1, borderColor: 'rgba(232,69,69,0.2)',
    borderRadius: RADII.lg, padding: 16, marginBottom: 16,
  },
  confirmTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.red, marginBottom: 4 },
  confirmSub:   { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, lineHeight: 18 },

  // Buttons
  actions:          { width: '100%', gap: 12, marginTop: 4 },
  exitBtn:          { width: '100%', borderRadius: RADII.pill, overflow: 'hidden' },
  exitBtnDisabled:  { opacity: 0.4 },
  exitGradient:     { paddingVertical: 16, alignItems: 'center' },
  exitText:         { fontFamily: FONTS.black, fontSize: 16, color: '#fff' },
  exitTextDisabled: { color: COLORS.muted },
  stayBtn:          { alignItems: 'center', paddingVertical: 12 },
  stayText:         { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.amber, letterSpacing: 0.3 },
});
