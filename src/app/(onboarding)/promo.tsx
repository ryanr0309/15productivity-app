import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { validatePromoCode, redeemPromoCode } from '../../store/promoStore';
import { usePostHog } from 'posthog-react-native';

export default function PromoScreen() {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useOnboardingStore(s => s.completeOnboarding);

  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

 // Replace the handleRedeem function
const handleRedeem = async () => {
  if (!code.trim()) return;
  setLoading(true);
  setError('');

  const { valid, reason } = await validatePromoCode(code);

   const posthog = usePostHog()
  
    useEffect(() => {
      posthog.capture('onboarding_step_viewed', { step: 'promo' })
    }, [])

  if (!valid) {
    setError(reason ?? 'Invalid code.');
    setLoading(false);
    return;
  }

  await redeemPromoCode(code);  // no userId arg anymore
  await completeOnboarding();
  router.replace('/(onboarding)/screentime');
};

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060200', '#0C0400', '#100602', '#060200']}
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.title}>Enter promo code</Text>
      <Text style={styles.sub}>Got a code from a creator? Enter it below for free access.</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={t => { setCode(t); setError(''); }}
        placeholder="Enter code"
        placeholderTextColor="rgba(255,244,230,0.25)"
        autoCapitalize="characters"
        autoCorrect={false}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.btn}
        onPress={handleRedeem}
        disabled={loading || !code.trim()}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#FF9030', '#FF5E0E']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.btnGrad}
        >
          {loading
            ? <ActivityIndicator color="#1A0602" />
            : <Text style={styles.btnTxt}>Redeem code</Text>
          }
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backTxt}>← Back to paywall</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060200', paddingHorizontal: 24, gap: 16 },
  title:   { fontFamily: FONTS.black, fontSize: 26, color: COLORS.cream, textAlign: 'center' },
  sub:     { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,244,230,0.45)', textAlign: 'center', lineHeight: 22 },
  input: {
    borderWidth: 1, borderColor: 'rgba(255,150,50,0.35)',
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18,
    fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream,
    textAlign: 'center', letterSpacing: 2,
    backgroundColor: 'rgba(255,100,0,0.07)',
  },
  error:   { fontFamily: FONTS.regular, fontSize: 13, color: '#FF6B6B', textAlign: 'center' },
  btn:     { borderRadius: 22, overflow: 'hidden' },
  btnGrad: { paddingVertical: 20, alignItems: 'center' },
  btnTxt:  { fontFamily: FONTS.black, fontSize: 17, color: '#1A0602' },
  back:    { alignItems: 'center', paddingTop: 8 },
  backTxt: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.30)' },
});