/**
 * hooks/useBreakTimer.ts
 *
 * Import this in EVERY game screen. That's the only thing needed.
 *
 * What it does:
 *   - Reads breakStartedAt from the store (set when user entered checkpoint)
 *   - Ticks every second
 *   - When 2 minutes expire → calls completeCheckpoint() + router.replace('/session')
 *   - Works regardless of how deep in the game stack the user is
 *
 * Usage (in any game file):
 *   import { useBreakTimer } from '../../../../hooks/useBreakTimer';
 *
 *   export default function MyGame() {
 *     useBreakTimer();   // ← single line, that's it
 *     ...
 *   }
 *
 * The game's own "← Games" button just calls router.back() — no need to
 * interact with the break timer at all.
 */

import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import {
  useSessionStore,
  CHECKPOINT_BREAK_SEC,
} from '../store/sessionStore';

export function useBreakTimer() {
  const breakStartedAt     = useSessionStore(s => s.breakStartedAt);
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);
  const hasEjected         = useRef(false);

  useEffect(() => {
    if (!breakStartedAt || hasEjected.current) return;

    const eject = async () => {
      if (hasEjected.current) return;
      hasEjected.current = true;
      await completeCheckpoint();
      // replace to /session — clears the whole games stack
      router.replace('/session');
    };

    // Check immediately in case we mounted after expiry
    // (e.g. user backgrounded app for a long time during break)
    const now     = Date.now();
    const elapsed = Math.floor((now - breakStartedAt) / 1000);
    if (elapsed >= CHECKPOINT_BREAK_SEC) {
      eject();
      return;
    }

    // Schedule eject for the remaining time
    const remaining = CHECKPOINT_BREAK_SEC - elapsed;
    const timer = setTimeout(eject, remaining * 1000);

    return () => clearTimeout(timer);
  }, [breakStartedAt, completeCheckpoint]);
}
