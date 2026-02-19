/**
 * lib/supabase.ts
 *
 * Supabase client for Ember.
 * No auth — uses a stable device_id stored in AsyncStorage.
 *
 * SETUP:
 *   npx expo install @supabase/supabase-js
 *   npx expo install @react-native-async-storage/async-storage  (already installed)
 *
 * Add to your .env (or app.config.ts extra):
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const DEVICE_ID_KEY     = 'ember_device_id';

// ─── Device ID ────────────────────────────────────────────────────────────────
// Stable anonymous identifier — generated once, stored forever.
let _deviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (_deviceId) return _deviceId;
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) { _deviceId = stored; return stored; }
    // Generate new UUID-style id
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    _deviceId = id;
    return id;
  } catch {
    return 'fallback-device';
  }
}

// ─── Supabase client ──────────────────────────────────────────────────────────
// We create a base client. For queries that need RLS (reads/updates),
// use getSupabase() which injects the device_id header.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Returns a supabase client with the device_id header injected.
 * Required for RLS policies that filter by device_id.
 * Use this for SELECT and UPDATE queries.
 * INSERT doesn't need it (policy uses `with check (true)`).
 */
export async function getSupabase() {
  const deviceId = await getDeviceId();
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { 'x-device-id': deviceId },
    },
  });
}
