/**
 * store/sessionStore.ts  —  Bulletproof timer that survives app close
 *
 * HOW IT WORKS
 * ─────────────
 * startedAt (a UTC timestamp) is written to AsyncStorage when a session begins.
 *
 * elapsed is ALWAYS computed as:
 *   elapsed = Date.now() - startedAt
 *
 * setInterval only triggers re-renders. The time value comes from the
 * wall clock, so it's always correct regardless of what the app was doing.
 *
 * WHAT SURVIVES APP CLOSE
 * ────────────────────────
 * ✓  App backgrounded (switch apps, lock screen)
 * ✓  App fully killed by user
 * ✓  Phone rebooted
 * ✓  Checkpoint crossed while app was closed (button appears on resume)
 * ✓  Session finished while app was closed (clears cleanly)
 *
 * SETUP
 * ──────
 * 1. npx expo install @react-native-async-storage/async-storage
 *
 * 2. In app/_layout.tsx:
 *
 *      const hadSession = await rehydrateSession();
 *      if (hadSession) router.replace('/session');
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// ─── Constants ────────────────────────────────────────────────────────────────
export const CHECKPOINT_INTERVAL_SEC = 1 * 60;
export const CHECKPOINT_BREAK_SEC    = 120;

const STORAGE_KEY = 'ember_session_v1';

// ─── What we persist to AsyncStorage ─────────────────────────────────────────
interface PersistedSession {
  goal:             string;
  durationSec:      number;
  startedAt:        number;   // Date.now() at session start — source of truth
  nextCheckpointAt: number;   // elapsed seconds when next checkpoint fires
  checkpointsTaken: number;
}

// ─── Zustand state ────────────────────────────────────────────────────────────
interface SessionState {
  goal:             string;
  durationSec:      number;
  startedAt:        number | null;
  nextCheckpointAt: number;
  checkpointsTaken: number;

  // Derived every tick from (Date.now() - startedAt)
  elapsed:          number;
  isRunning:        boolean;
  checkpointReady:  boolean;

  // Actions
  startSession:       (goal: string, durationSec?: number) => Promise<void>;
  stopSession:        () => Promise<void>;
  resetSession:       () => Promise<void>;
  takeCheckpoint:     () => void;
  completeCheckpoint: () => Promise<void>;

  // Internal — called by interval, not for external use
  _tick: () => void;
}

// ─── Module-level interval ────────────────────────────────────────────────────
let _interval: ReturnType<typeof setInterval> | null = null;

function startInterval() {
  if (_interval) clearInterval(_interval);
  _interval = setInterval(() => useSessionStore.getState()._tick(), 1000);
}

function stopInterval() {
  if (_interval) { clearInterval(_interval); _interval = null; }
}

// ─── AsyncStorage helpers ─────────────────────────────────────────────────────
async function persist(data: PersistedSession) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Ember] Failed to persist session:', e);
  }
}

async function clearPersisted() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[Ember] Failed to clear session:', e);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useSessionStore = create<SessionState>((set, get) => ({
  goal:             '',
  durationSec:      25 * 60,
  startedAt:        null,
  nextCheckpointAt: CHECKPOINT_INTERVAL_SEC,
  checkpointsTaken: 0,
  elapsed:          0,
  isRunning:        false,
  checkpointReady:  false,

  // ── Start ──────────────────────────────────────────────────────────────────
  startSession: async (goal, durationSec = 25 * 60) => {
    stopInterval();

    const startedAt        = Date.now();
    const nextCheckpointAt = CHECKPOINT_INTERVAL_SEC;

    set({
      goal,
      durationSec,
      startedAt,
      nextCheckpointAt,
      checkpointsTaken: 0,
      elapsed:          0,
      isRunning:        true,
      checkpointReady:  false,
    });

    // Persist BEFORE starting interval — if app crashes immediately,
    // we still have the session saved
    await persist({
      goal, durationSec, startedAt,
      nextCheckpointAt, checkpointsTaken: 0,
    });

    startInterval();
  },

  // ── Stop — user deliberately ends session ─────────────────────────────────
  stopSession: async () => {
    stopInterval();
    set({ isRunning: false });
    await clearPersisted();
  },

  // ── Full reset ─────────────────────────────────────────────────────────────
  resetSession: async () => {
    stopInterval();
    set({
      goal: '', durationSec: 25 * 60, startedAt: null,
      nextCheckpointAt: CHECKPOINT_INTERVAL_SEC, checkpointsTaken: 0,
      elapsed: 0, isRunning: false, checkpointReady: false,
    });
    await clearPersisted();
  },

  // ── Checkpoint actions ────────────────────────────────────────────────────
  takeCheckpoint: () => set({ checkpointReady: false }),

  completeCheckpoint: async () => {
    const s = get();
    const newNext  = s.elapsed + CHECKPOINT_INTERVAL_SEC;
    const newTaken = s.checkpointsTaken + 1;

    set({ nextCheckpointAt: newNext, checkpointsTaken: newTaken });

    if (s.startedAt !== null) {
      await persist({
        goal:             s.goal,
        durationSec:      s.durationSec,
        startedAt:        s.startedAt,
        nextCheckpointAt: newNext,
        checkpointsTaken: newTaken,
      });
    }
  },

  // ── Tick ──────────────────────────────────────────────────────────────────
  // This is the ONLY place elapsed is computed.
  // It reads from the wall clock, never increments a counter.
  _tick: () => {
    const { startedAt, durationSec, nextCheckpointAt, checkpointReady } = get();
    if (startedAt === null) return;

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);

    if (elapsed >= durationSec) {
      stopInterval();
      set({ elapsed: durationSec, isRunning: false, checkpointReady: false });
      clearPersisted();
      return;
    }

    set({
      elapsed,
      checkpointReady: checkpointReady || elapsed >= nextCheckpointAt,
    });
  },
}));

// ─── rehydrateSession ────────────────────────────────────────────────────────
/**
 * Call once in your root app/_layout.tsx useEffect.
 *
 * Returns TRUE if a session was restored (so layout can redirect to /session).
 * Returns FALSE if no session was active (normal home screen load).
 *
 * Example:
 *   const hadSession = await rehydrateSession();
 *   if (hadSession) router.replace('/session');
 */
export async function rehydrateSession(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const saved: PersistedSession = JSON.parse(raw);

    // How much real time has passed since the session started?
    const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);

    // Session already finished while app was closed — clean up
    if (elapsed >= saved.durationSec) {
      await clearPersisted();
      return false;
    }

    // Restore store with accurate elapsed time
    useSessionStore.setState({
      goal:             saved.goal,
      durationSec:      saved.durationSec,
      startedAt:        saved.startedAt,
      nextCheckpointAt: saved.nextCheckpointAt,
      checkpointsTaken: saved.checkpointsTaken,
      elapsed,
      isRunning:        true,
      checkpointReady:  elapsed >= saved.nextCheckpointAt,
    });

    startInterval();
    return true; // ← tells layout to redirect to /session

  } catch (e) {
    console.warn('[Ember] Failed to rehydrate session:', e);
    return false;
  }
}

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectTimeDisplay = (s: SessionState) => {
  const rem = Math.max(s.durationSec - s.elapsed, 0);
  return `${Math.floor(rem / 60).toString().padStart(2, '0')}:${(rem % 60).toString().padStart(2, '0')}`;
};

export const selectCpProgress = (s: SessionState) => {
  const start = s.nextCheckpointAt - CHECKPOINT_INTERVAL_SEC;
  return Math.min(Math.max((s.elapsed - start) / CHECKPOINT_INTERVAL_SEC, 0), 1);
};

export const selectCpRemaining = (s: SessionState) => {
  const rem  = Math.max(s.nextCheckpointAt - s.elapsed, 0);
  const mins = Math.floor(rem / 60);
  const secs = (rem % 60).toString().padStart(2, '0');
  return mins > 0 ? `${mins} min` : `${secs}s`;
};
