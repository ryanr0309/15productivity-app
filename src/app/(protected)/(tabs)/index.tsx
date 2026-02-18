/**
 * Ember – HomeScreen.tsx  (Screen 01 · Home)
 *
 * "Begin Focus" opens StartSessionModal bottom sheet.
 * Modal collects goal + duration → starts sessionStore → pushes to /session.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated, Dimensions, StatusBar, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StartSessionModal from '../../../components/StartSessionModal';

const { width, height } = Dimensions.get('window');
const MASCOT_SIZE = Math.round(width * 0.44);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  const [modalVisible, setModalVisible] = useState(false);

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

  const mascotY     = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -13] });
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.06] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.30, 0.65] });

  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

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

      {/* "01 · HOME" */}
      <Animated.View style={[styles.topLabel, { opacity: fadeIn, paddingTop: insets.top + 12 }]}>
        <Text style={styles.topLabelText}>01  ·  HOME</Text>
      </Animated.View>

      {/* Main content */}
      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ scale: scaleIn }] }]}>

        {/* Mascot */}
        

        {/* ember. */}
        <Text style={styles.appName}>ember.</Text>
        <Text style={styles.tagline}>Focus burns brighter</Text>

        {/* CTA — opens modal */}
        <Animated.View style={[styles.ctaWrap, { transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => setModalVisible(true)}   // ← opens modal
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
        <TouchableOpacity style={styles.streakPill} activeOpacity={0.7}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>7 day streak</Text>
        </TouchableOpacity>

      </Animated.View>

      {/* ── Start Session Modal ── */}
      <StartSessionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0603', alignItems: 'center' },

  bloom: {
    position: 'absolute', top: height * 0.10, alignSelf: 'center',
    width: width * 1.1, height: width * 1.1, borderRadius: width * 0.55,
    backgroundColor: 'transparent',
    shadowColor: '#FF5500', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.60, shadowRadius: 160, elevation: 0,
  },

  topLabel:     { position: 'absolute', top: 0, alignSelf: 'center' },
  topLabelText: { fontFamily: 'Nunito_400Regular', fontSize: 11, letterSpacing: 3.5, color: 'rgba(255,180,100,0.40)', textTransform: 'uppercase' },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, width: '100%', paddingBottom: 40 },

  mascotContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  mascotGlow: { position: 'absolute', width: MASCOT_SIZE * 0.95, height: MASCOT_SIZE * 0.95, borderRadius: MASCOT_SIZE * 0.475, backgroundColor: '#FF6B1A' },
  mascotImage: { width: MASCOT_SIZE, height: MASCOT_SIZE * 1.4 },
  mascotShadow: { width: MASCOT_SIZE * 0.45, height: 8, borderRadius: 4, backgroundColor: '#FF6B1A', opacity: 0.20, shadowColor: '#FF6B1A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, marginTop: -4 },

  appName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 48, color: '#FF6B1A', letterSpacing: -1.5, marginBottom: 6 },
  tagline: { fontFamily: 'Nunito_400Regular',   fontSize: 16, color: 'rgba(255,244,230,0.50)', letterSpacing: 0.3, marginBottom: 44 },

  ctaWrap:     { width: '100%', marginBottom: 18, borderRadius: 50, shadowColor: '#FF4400', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 22, elevation: 14 },
  ctaGradient: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 50 },
  ctaText:     { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: '#ffffff', letterSpacing: 0.4 },

  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(255,255,255,0.04)' },
  streakEmoji: { fontSize: 16 },
  streakText:  { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFF4E6', letterSpacing: 0.2 },
});
