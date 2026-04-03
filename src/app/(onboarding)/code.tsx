// app/onboarding/creatorcode.tsx — Screen 13.5: Creator Code

import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Easing, StatusBar, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { usePostHog } from 'posthog-react-native';
import { supabase } from '../../lib/supabase'; // adjust to your path
import { useOnboardingStore } from '../../store/onboardingStore';
import { redeemPromoCode } from '../../store/promoStore';


const PAD = 28;

export default function CreatorCodeScreen() {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  const [expanded, setExpanded] = useState(false);
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // ── Entrance animations ──────────────────────────────────────────────────
  const headerA = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(16)).current;
  const cardA   = useRef(new Animated.Value(0)).current;
  const cardY   = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    posthog.capture('onboarding_step_viewed', { step: 'creator_code' });

    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(headerA, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.timing(cardA, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const FRIENDS_FAMILY_CODE = 'PROMO030907';
  const completeOnboarding = useOnboardingStore(s => s.completeOnboarding);

const handleValidate = async () => {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return;

  setLoading(true);
  setError('');

  // Friends & family shortcut — no DB lookup needed
 if (trimmed === FRIENDS_FAMILY_CODE) {
  posthog.capture('creator_code_entered', { code: trimmed, influencer: 'friends_family' });
  await redeemPromoCode(trimmed);  // writes to AsyncStorage + logs to Supabase
  await completeOnboarding();
  router.replace('/(onboarding)/screentime');
  return;
}

  try {
    const { data, error: fetchError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', trimmed)
      .eq('active', true)
      .single();

    if (fetchError || !data) {
      setError("That code doesn't look right. Double-check and try again.");
      setLoading(false);
      return;
    }

    if (data.use_count >= data.max_uses) {
      setError('This code has reached its limit.');
      setLoading(false);
      return;
    }

    await supabase
      .from('promo_codes')
      .update({ use_count: data.use_count + 1 })
      .eq('code', trimmed);

    await supabase
      .from('promo_redemptions')
      .insert({ code: trimmed, redeemed_at: new Date().toISOString() });

    posthog.capture('creator_code_entered', {
      code: trimmed,
      influencer: data.influencer,
    });

    router.push('/(onboarding)/commitment');

  } catch (e) {
    setError('Something went wrong. Please try again.');
    setLoading(false);
  }
};

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#050204', '#0A0508', '#100608']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.deepGlow} pointerEvents="none" />

      <View style={[styles.inner, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 32 }]}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <OnboardingProgress step={14} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
          <Text style={styles.eyebrow}>ALMOST THERE</Text>
          <Text style={styles.headline}>
            Did a creator{'\n'}
            <Text style={styles.headlineAccent}>send you here?</Text>
          </Text>
          <Text style={styles.sub}>
            If someone shared a code with you, enter it below.
          </Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: cardA, transform: [{ translateY: cardY }] }]}>
          <LinearGradient
            colors={['rgba(255,144,48,0.06)', 'rgba(255,94,14,0.03)']}
            style={StyleSheet.absoluteFill}
          />

          {!expanded ? (
            <TouchableOpacity
              style={styles.yesButton}
              onPress={() => setExpanded(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6030', '#FF9030']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.yesButtonText}>Yes, I have a code</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Enter code"
                placeholderTextColor="rgba(255,244,230,0.25)"
                value={code}
                onChangeText={(t) => { setCode(t); setError(''); }}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.applyButton, (!code.trim() || loading) && styles.disabled]}
                onPress={handleValidate}
                disabled={!code.trim() || loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6030', '#FF9030']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {loading
                  ? <ActivityIndicator color={COLORS.cream} />
                  : <Text style={styles.applyButtonText}>Apply Code</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Skip */}
        <View style={styles.skipWrap}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.push('/(onboarding)/commitment')}
            activeOpacity={0.6}
          >
            <Text style={styles.skipText}>No thanks, skip</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#050204' },
  inner: { flex: 1 },

  deepGlow: {
    position: 'absolute',
    top: '40%', left: '10%', right: '10%', bottom: 0,
    shadowColor:   '#FF5500',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius:  80,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },

  header: { paddingHorizontal: PAD, gap: 8, marginBottom: 24 },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: 'rgba(255,150,50,0.55)', textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FONTS.black, fontSize: 34,
    color: COLORS.cream, lineHeight: 42, letterSpacing: -0.5,
  },
  headlineAccent: { color: COLORS.amber },
  sub: {
    fontFamily: FONTS.regular, fontSize: 15,
    color: 'rgba(255,244,230,0.38)', lineHeight: 22,
  },

  card: {
    marginHorizontal: PAD,
    borderRadius: 24, borderWidth: 1.5,
    borderColor: 'rgba(255,144,48,0.18)',
    padding: 24, overflow: 'hidden', gap: 12,
  },

  yesButton: {
    borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  yesButtonText: {
    fontFamily: FONTS.bold, fontSize: 16, color: COLORS.cream,
  },

  inputGroup: { gap: 12 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,144,48,0.25)',
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: FONTS.bold, fontSize: 18,
    color: COLORS.cream, letterSpacing: 3, textAlign: 'center',
  },

  errorText: {
    fontFamily: FONTS.regular, fontSize: 13,
    color: '#ff4d4d', textAlign: 'center',
  },

  applyButton: {
    borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  applyButtonText: {
    fontFamily: FONTS.bold, fontSize: 16, color: COLORS.cream,
  },
  disabled: { opacity: 0.45 },

  skipWrap: { marginTop: 'auto', alignItems: 'center', paddingBottom: 8 },
  skipButton: { padding: 16 },
  skipText: {
    fontFamily: FONTS.regular, fontSize: 15,
    color: 'rgba(255,244,230,0.28)',
  },
});