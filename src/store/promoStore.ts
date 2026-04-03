import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const PROMO_KEY = 'ember_promo_redeemed';

export async function validatePromoCode(code: string): Promise<{
  valid: boolean;
  influencer?: string;
  reason?: string;
}> {
  const normalized = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('promo_codes')
    .select('influencer, active, max_uses, use_count')
    .eq('code', normalized)
    .single();

  if (error || !data)          return { valid: false, reason: 'Invalid code.' };
  if (!data.active)            return { valid: false, reason: 'This code is no longer active.' };
  if (data.use_count >= data.max_uses) {
    return { valid: false, reason: 'This code has reached its limit.' };
  }

  return { valid: true, influencer: data.influencer };
}

export async function redeemPromoCode(code: string) {
  const normalized = code.trim().toUpperCase();

  const { data, error: fetchError } = await supabase
    .from('promo_codes')
    .select('influencer')
    .eq('code', normalized)
    .single();

  console.log('fetch result:', data, fetchError);
  if (!data) return;

  const { error: rpcError } = await supabase.rpc('increment_promo_use', { promo_code: normalized });
  console.log('rpc error:', rpcError);

  const { error: logError } = await supabase.from('promo_redemptions').insert({ code: normalized });
  console.log('log error:', logError);

  await AsyncStorage.setItem(PROMO_KEY, JSON.stringify({
    code: normalized,
    influencer: data.influencer,
    redeemedAt: new Date().toISOString(),
  }));
}

export async function hasRedeemedPromo(): Promise<boolean> {
  const val = await AsyncStorage.getItem(PROMO_KEY);
  return !!val;
}