/**
 * src/lib/liveActivity.ts
 *
 * JavaScript wrapper around the native LiveActivityModule.
 * Fails silently if Live Activities aren't supported (older iOS, simulator).
 *
 * Usage in sessionStore.ts:
 *   import { LiveActivity } from '../src/lib/liveActivity';
 *   await LiveActivity.start('Deep Work', durationSec);   // on session start
 *   await LiveActivity.end(true);                          // on natural end
 *   await LiveActivity.end(false);                         // on manual stop
 */

import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

const isSupported = Platform.OS === 'ios' && !!LiveActivityModule;

export const LiveActivity = {
  start: async (sessionName: string, durationSeconds: number): Promise<string | null> => {
    if (!isSupported) return null;
    try {
      return await LiveActivityModule.startActivity(sessionName, durationSeconds);
    } catch (e: any) {
      // LIVE_ACTIVITY_DISABLED = user turned them off in Settings — not a crash
      if (e?.code !== 'LIVE_ACTIVITY_DISABLED') {
        console.warn('[LiveActivity] start failed:', e?.message);
      }
      return null;
    }
  },

  // Optional — the countdown runs natively without updates.
  // Call this if you want the isEnding flag to turn the timer red at <60s.
  update: async (remainingSeconds: number): Promise<void> => {
    if (!isSupported) return;
    try {
      await LiveActivityModule.updateActivity(remainingSeconds);
    } catch (e: any) {
      console.warn('[LiveActivity] update failed:', e?.message);
    }
  },

  // natural=true  → shows "Complete! 🎯" for 4s then dismisses
  // natural=false → dismisses immediately (user stopped early)
  end: async (natural: boolean): Promise<void> => {
    if (!isSupported) return;
    try {
      await LiveActivityModule.endActivity(natural);
    } catch (e: any) {
      console.warn('[LiveActivity] end failed:', e?.message);
    }
  },
};
