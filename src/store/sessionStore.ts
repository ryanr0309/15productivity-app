/**
 * store/sessionStore.ts  —  Bulletproof timer that survives app close
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as StoreReview from 'expo-store-review';
import { saveSession } from '../services/sessionService';
import { startBlocking, stopBlocking } from '../services/screenTimeService';
import {
  scheduleSessionEndNotification,
  cancelSessionEndNotification,
  sendSessionEndedNotification,
} from '../../src/lib/sessionNotifications';
import { LiveActivity } from '../lib/liveActivity';

// ─── Constants ────────────────────────────────────────────────────────────────
export const CHECKPOINT_INTERVAL_SEC = 25 * 60;
export const CHECKPOINT_BREAK_SEC    = 5 * 60;

const STORAGE_KEY         = 'ember_session_v1';
const REVIEW_PROMPTED_KEY = '@ember/reviewPrompted';

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
let _sessionEndFired = false;

function startInterval() {
  if (_interval) clearInterval(_interval);
  _sessionEndFired = false;
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

// ─── Review prompt ────────────────────────────────────────────────────────────
// Called directly (no hook) — safe to use outside React components.
// Fires once ever after the first NATURAL session completion.
async function maybeRequestReview() {
  try {
    const alreadyPrompted = await AsyncStorage.getItem(REVIEW_PROMPTED_KEY);
    if (alreadyPrompted) return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    // Let the session-complete celebration render before the prompt appears
    await new Promise(resolve => setTimeout(resolve, 1500));
    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_PROMPTED_KEY, 'true');
  } catch (e) {
    console.warn('[Ember] Review prompt error:', e);
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
  breakStartedAt:   null,

  startSession: async (goal, durationSec = 25 * 60) => {
    stopInterval();
    const { useOnboardingStore } = await import('./onboardingStore');
    const { screenTimeSelectionId } = useOnboardingStore.getState();

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

    await scheduleSessionEndNotification(durationSec, goal);
    startInterval();
    await LiveActivity.start(goal, durationSec);
  },

  stopSession: async () => {
    // Manual stop — cancel the scheduled notification immediately.
    // This must come FIRST before anything else so iOS doesn't deliver
    // the scheduled notification moments later after the session ends.
    await cancelSessionEndNotification();

    await stopBlocking();
    stopInterval();
    const s = get();
    await saveSession({
      goal:         s.goal,
      startedAt:    s.startedAt!,
      elapsed:      s.elapsed,
      durationSec:  s.durationSec,
      wasCompleted: false,
      checkpoints:  s.checkpointsTaken,
    });
    set({ isRunning: false });
    await clearPersisted();
    await LiveActivity.end(false);
    // No review prompt on manual stop
  },

  resetSession: async () => {
    await cancelSessionEndNotification();
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
    const newNext  = s.elapsed + CHECKPOINT_INTERVAL_SEC;
    const newTaken = s.checkpointsTaken + 1;
    set({ nextCheckpointAt: newNext, checkpointsTaken: newTaken, breakStartedAt: null, checkpointReady: false });
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
    const { startedAt, durationSec, nextCheckpointAt } = get();
    if (startedAt === null) return;

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);

    if (elapsed >= durationSec) {
      // Guard: only run once even if interval fires a second time before clearing
      if (_sessionEndFired) return;
      _sessionEndFired = true;

      stopInterval();
      set({ elapsed: durationSec, isRunning: false, checkpointReady: false });
      clearPersisted();

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

      // ── Notification fix ──────────────────────────────────────────────────
      // Cancel FIRST (awaited in sequence via .then) so the scheduled
      // notification is definitely gone before the immediate one is sent.
      // This is the only way to guarantee exactly one notification fires.
      cancelSessionEndNotification()
        .then(() => sendSessionEndedNotification(s.goal))
        .catch(e => console.warn('[Ember] notification error:', e));

      LiveActivity.end(true).catch(() => {});

      // ── Review prompt ─────────────────────────────────────────────────────
      // Fires 1.5s after natural completion, only once ever.
      maybeRequestReview().catch(() => {});

      return;
    }

    set({ elapsed, checkpointReady: elapsed >= nextCheckpointAt });
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
