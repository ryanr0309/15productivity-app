/**
 * store/sessionStore.ts  —  Bulletproof timer that survives app close
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { saveSession } from '../services/sessionService';
import { startBlocking, stopBlocking } from '../services/screenTimeService';

// ─── Constants ────────────────────────────────────────────────────────────────
export const CHECKPOINT_INTERVAL_SEC = 25 * 60;
export const CHECKPOINT_BREAK_SEC    = 5 * 60;

const STORAGE_KEY = 'ember_session_v1';

// ─── Persisted shape ──────────────────────────────────────────────────────────
interface PersistedSession {
  goal:             string;
  durationSec:      number;
  startedAt:        number;
  nextCheckpointAt: number;
  checkpointsTaken: number;
  breakStartedAt:   number | null;
}

// ─── Zustand state ────────────────────────────────────────────────────────────
interface SessionState {
  goal:             string;
  durationSec:      number;
  startedAt:        number | null;
  nextCheckpointAt: number;
  checkpointsTaken: number;
  elapsed:          number;
  isRunning:        boolean;
  checkpointReady:  boolean;
  breakStartedAt:   number | null;

  startSession:       (goal: string, durationSec?: number) => Promise<void>;
  stopSession:        () => Promise<void>;
  resetSession:       () => Promise<void>;
  takeCheckpoint:     () => Promise<void>;
  completeCheckpoint: () => Promise<void>;
  _tick:              () => void;
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
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (e) { console.warn('[Ember] Failed to persist session:', e); }
}

async function clearPersisted() {
  try { await AsyncStorage.removeItem(STORAGE_KEY); }
  catch (e) { console.warn('[Ember] Failed to clear session:', e); }
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
  breakStartedAt:   null,

  startSession: async (goal, durationSec = 25 * 60) => {
    stopInterval();

    // Read onboardingStore at call-time using getState() — safe to call
    // outside React components, unlike the useOnboardingStore hook.
    const { useOnboardingStore } = await import('./onboardingStore');
    const { screenTimeSelectionId } = useOnboardingStore.getState();

    // startBlocking() only takes durationSec — it uses the SELECTION_ID
    // constant internally, which was set via saveSelectionToken() in the
    // screen-time onboarding screen.
    if (screenTimeSelectionId) {
      await startBlocking(durationSec, goal);
    }

    const startedAt        = Date.now();
    const nextCheckpointAt = CHECKPOINT_INTERVAL_SEC;

    set({
      goal, durationSec, startedAt, nextCheckpointAt,
      checkpointsTaken: 0, elapsed: 0, isRunning: true,
      checkpointReady: false, breakStartedAt: null,
    });

    await persist({
      goal, durationSec, startedAt, nextCheckpointAt,
      checkpointsTaken: 0, breakStartedAt: null,
    });

    startInterval();
  },

  stopSession: async () => {
    await stopBlocking();
    stopInterval();
    const s = get();
    console.log('[Ember] stopSession saving:', {
      goal:        s.goal,
      startedAt:   s.startedAt,
      startedAtDate: s.startedAt ? new Date(s.startedAt).toISOString() : 'NULL',
      elapsed:     s.elapsed,
      durationSec: s.durationSec,
      checkpoints: s.checkpointsTaken,
    });
    await saveSession({
      goal:         s.goal,
      startedAt:    s.startedAt!,
      elapsed:      s.elapsed,
      durationSec:  s.durationSec,
      wasCompleted: s.elapsed >= s.durationSec,
      checkpoints:  s.checkpointsTaken,
    });
    set({ isRunning: false });
    await clearPersisted();
  },

  resetSession: async () => {
    stopInterval();
    set({
      goal: '', durationSec: 25 * 60, startedAt: null,
      nextCheckpointAt: CHECKPOINT_INTERVAL_SEC, checkpointsTaken: 0,
      elapsed: 0, isRunning: false, checkpointReady: false, breakStartedAt: null,
    });
    await clearPersisted();
  },

  takeCheckpoint: async () => {
    const s = get();
    const breakStartedAt = Date.now();
    set({ checkpointReady: false, breakStartedAt });
    if (s.startedAt !== null) {
      await persist({
        goal:             s.goal,
        durationSec:      s.durationSec,
        startedAt:        s.startedAt,
        nextCheckpointAt: s.nextCheckpointAt,
        checkpointsTaken: s.checkpointsTaken,
        breakStartedAt,
      });
    }
  },

  completeCheckpoint: async () => {
    const s = get();
    // Next checkpoint is CHECKPOINT_INTERVAL_SEC from the moment this one is completed,
    // not from when it was due. So if user takes it late, next is still 25min from now.
    const newNext  = s.elapsed + CHECKPOINT_INTERVAL_SEC;
    const newTaken = s.checkpointsTaken + 1;
    set({ nextCheckpointAt: newNext, checkpointsTaken: newTaken, breakStartedAt: null , checkpointReady: false });
    if (s.startedAt !== null) {
      await persist({
        goal:             s.goal,
        durationSec:      s.durationSec,
        startedAt:        s.startedAt,
        nextCheckpointAt: newNext,
        checkpointsTaken: newTaken,
        breakStartedAt:   null,
      });
    }
  },

  _tick: () => {
    const { startedAt, durationSec, nextCheckpointAt, checkpointReady } = get();
    if (startedAt === null) return;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    if (elapsed >= durationSec) {
      stopInterval();
      set({ elapsed: durationSec, isRunning: false, checkpointReady: false });
      clearPersisted();
      // Session ended naturally — unblock apps and save to Supabase
      const s = get();
      stopBlocking().catch(e => console.warn('[Ember] stopBlocking error:', e));
      saveSession({
        goal:         s.goal,
        startedAt:    s.startedAt!,
        elapsed:      durationSec,
        durationSec:  s.durationSec,
        wasCompleted: true,
        checkpoints:  s.checkpointsTaken,
      }).catch(e => console.warn('[Ember] saveSession error:', e));
      return;
    }
    set({ elapsed, checkpointReady: false || elapsed >= nextCheckpointAt });
  },
}));

// ─── rehydrateSession ─────────────────────────────────────────────────────────
export async function rehydrateSession(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved: PersistedSession = JSON.parse(raw);
    const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
     if (elapsed >= saved.durationSec) {
      await clearPersisted();
      // Session expired while app was closed — clean up blocking safely on main thread
      await stopBlocking();
      return false;
    }
    useSessionStore.setState({
      goal:             saved.goal,
      durationSec:      saved.durationSec,
      startedAt:        saved.startedAt,
      nextCheckpointAt: saved.nextCheckpointAt,
      checkpointsTaken: saved.checkpointsTaken,
      elapsed,
      isRunning:        true,
      checkpointReady:  elapsed >= saved.nextCheckpointAt,
      breakStartedAt:   saved.breakStartedAt ?? null,
    });
    startInterval();
    return true;
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

export const selectBreakElapsed = (s: SessionState): number => {
  if (!s.breakStartedAt) return 0;
  return Math.floor((Date.now() - s.breakStartedAt) / 1000);
};

export const selectBreakRemaining = (s: SessionState): number => {
  if (!s.breakStartedAt) return CHECKPOINT_BREAK_SEC;
  const elapsed = Math.floor((Date.now() - s.breakStartedAt) / 1000);
  return Math.max(CHECKPOINT_BREAK_SEC - elapsed, 0);
};
0