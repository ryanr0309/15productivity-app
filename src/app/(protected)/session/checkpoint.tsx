/**
 * app/(protected)/session/checkpoint.tsx
 *
 * FLOW:
 *   SessionScreen detects checkpointReady → pushes here
 *   On mount: calls takeCheckpoint() which records breakStartedAt in store + AsyncStorage
 *   User taps "Play a game" → /session/game-select → /session/games/[game]
 *   After 2 min: useBreakTimer in each game auto-ejects to /session
 *   "Skip" → completeCheckpoint() → /session immediately
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Pressable,

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
import {
  useSessionStore,
  selectTimeDisplay,
  CHECKPOINT_BREAK_SEC,
} from '../../../store/sessionStore';
import { COLORS, FONTS } from '../../../theme';

const RING_R = 80;

export default function CheckpointScreen() {
  const insets      = useSafeAreaInsets();
  const sessionTime = useSessionStore(selectTimeDisplay);
  const takeCheckpoint     = useSessionStore(s => s.takeCheckpoint);
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);
  const breakStartedAt     = useSessionStore(s => s.breakStartedAt);

  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  // Record break start on mount (idempotent)
  useEffect(() => {
    if (!breakStartedAt) takeCheckpoint();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live countdown display
  const [displayRem, setDisplayRem] = useState(CHECKPOINT_BREAK_SEC);

  useEffect(() => {
    const tick = setInterval(() => {
      const bsa = useSessionStore.getState().breakStartedAt;
      if (!bsa) return;
      const elapsed = Math.floor((Date.now() - bsa) / 1000);
      const rem     = Math.max(CHECKPOINT_BREAK_SEC - elapsed, 0);
      setDisplayRem(rem);
      if (rem <= 0) {
        clearInterval(tick);
        handleEnd();
      }
    }, 500);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = useCallback(async () => {
    await completeCheckpoint();
    router.replace('/session');
  }, [completeCheckpoint]);

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const burstAnims = useRef(Array.from({ length: 8 }, () => ({
    scale: new Animated.Value(0), opacity: new Animated.Value(0),
    x: new Animated.Value(0),     y: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    burstAnims.forEach((p, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const dist  = 55 + Math.random() * 25;
      Animated.sequence([
        Animated.delay(i * 55),
        Animated.parallel([
          Animated.spring(p.scale,   { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0.7, duration: 280, useNativeDriver: true }),
          Animated.timing(p.x,       { toValue: Math.cos(angle) * dist, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.y,       { toValue: Math.sin(angle) * dist, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start();
    });
  }, [burstAnims, fadeIn]);

  // Ring arc — rotate based on elapsed
  const ringProgress = 1 - (displayRem / CHECKPOINT_BREAK_SEC);  // 0 → 1
  const mm = Math.floor(displayRem / 60).toString().padStart(2, '0');
  const ss = (displayRem % 60).toString().padStart(2, '0');

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#0A0603', '#160A04', '#1A0C05']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 32 }]}>

        {/* Header */}
        <Text style={styles.eyebrow}>CHECKPOINT BREAK</Text>
        <Text style={styles.title}>Nice work! 🔥</Text>
        <Text style={styles.sub}>Take 2 minutes to reset your brain</Text>

        {/* Session pill */}
        <View style={styles.sessionPill}>
          <View style={styles.sessionDot} />
          <Text style={styles.sessionPillText}>Session still running</Text>
          <Text style={styles.sessionPillTime}>{sessionTime}</Text>
        </View>

        {/* Break countdown ring */}
        <View style={styles.ringArea}>
          {burstAnims.map((p, i) => (
            <Animated.View key={i} style={[styles.burstDot, {
              opacity: p.opacity,
              transform: [{ scale: p.scale }, { translateX: p.x }, { translateY: p.y }],
            }]} />
          ))}
          <View style={styles.ringWrap}>
            <View style={styles.ringTrack} />
            <View style={[
              styles.ringFill,
              { transform: [{ rotate: `${ringProgress * 360}deg` }] },
            ]} />
            <View style={styles.ringCenter}>
              <Text style={styles.ringTime}>{mm}:{ss}</Text>
              <Text style={styles.ringLabel}>break left</Text>
            </View>
          </View>
        </View>

        {/* Play CTA */}
        <Pressable
          style={styles.playBtn}
          onPress={() => router.push('/session/gameSelect')}
        >
          <LinearGradient
            colors={['#FF8C22', '#FF6B1A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.playBtnGrad}
          >
            <Text style={styles.playBtnText}>Play a game 🎮</Text>
            <Text style={styles.playBtnSub}>7 brain-reset games to choose from</Text>
          </LinearGradient>
        </Pressable>

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleEnd} activeOpacity={0.65}>
          <Text style={styles.skipText}>Skip and keep going →</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0A0603' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },

  eyebrow: { fontFamily: FONTS.regular, fontSize: 11, letterSpacing: 3, color: 'rgba(255,244,230,0.35)', textTransform: 'uppercase', marginBottom: 10 },
  title:   { fontFamily: FONTS.black,   fontSize: 34, color: COLORS.cream, letterSpacing: -0.5, marginBottom: 6 },
  sub:     { fontFamily: FONTS.regular, fontSize: 15, color: 'rgba(255,244,230,0.45)', marginBottom: 28, textAlign: 'center' },

  sessionPill:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,26,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.22)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 40, gap: 8, width: '100%' },
  sessionDot:      { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.orange },
  sessionPillText: { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,244,230,0.65)', flex: 1 },
  sessionPillTime: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.orange, letterSpacing: 0.5 },

  ringArea:  { alignItems: 'center', justifyContent: 'center', marginBottom: 44, position: 'relative' },
  burstDot:  { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber },
  ringWrap:  { width: (RING_R + 20) * 2, height: (RING_R + 20) * 2, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringTrack: { position: 'absolute', width: RING_R * 2, height: RING_R * 2, borderRadius: RING_R, borderWidth: 5, borderColor: 'rgba(255,255,255,0.08)' },
  ringFill:  { position: 'absolute', width: RING_R * 2, height: RING_R * 2, borderRadius: RING_R, borderWidth: 5, borderTopColor: COLORS.orange, borderRightColor: COLORS.amber, borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
  ringCenter: { alignItems: 'center' },
  ringTime:   { fontFamily: FONTS.black, fontSize: 42, color: COLORS.cream, letterSpacing: 1 },
  ringLabel:  { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.40)', letterSpacing: 1, textTransform: 'uppercase' },

  playBtn:     { width: '100%', borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  playBtnGrad: { paddingVertical: 22, paddingHorizontal: 24, alignItems: 'center' },
  playBtnText: { fontFamily: FONTS.black, fontSize: 20, color: '#1A0603', letterSpacing: 0.5, marginBottom: 3 },
  playBtnSub:  { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(26,6,3,0.65)' },

  skipBtn:  { paddingVertical: 14 },
  skipText: { fontFamily: FONTS.bold, fontSize: 14, color: 'rgba(255,244,230,0.35)', letterSpacing: 0.3 },
});
