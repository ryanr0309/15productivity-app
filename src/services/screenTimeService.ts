/**
 * services/screenTimeService.ts
 *
 * Written against the actual library source (index.ts + types).
 *
 * Key facts from the source:
 *   - getAuthorizationStatus()  → synchronous, returns AuthorizationStatusType
 *   - requestAuthorization()    → async, takes "individual" | "child"
 *   - pollAuthorizationStatus() → async, takes { abortController?, pollIntervalMs?, maxAttempts? }
 *   - stopMonitoring()          → takes activityNames?: string[]  (optional array)
 *   - DeviceActivityEvent.familyActivitySelection → FamilyActivitySelection (typed object)
 *   - blockSelection()          → direct imperative block, no scheduling needed
 *   - configureActions()        → callbackName must be CallbackName union type
 */

import * as RNDeviceActivity from 'react-native-device-activity';
import {
  AuthorizationStatus,
  type AuthorizationStatusType,
  type DeviceActivitySchedule,
  type FamilyActivitySelection,
  type ShieldConfiguration,
  type ShieldActions,
  type CallbackName,
} from 'react-native-device-activity';

// ── Constants ─────────────────────────────────────────────────────────────────

const MONITOR_NAME = 'ember_focus_session';
const SELECTION_ID = 'ember_block_selection';
const BLUR_DARK    = 4; // UIBlurEffectStyle.systemMaterialDark

// ── Auth status ───────────────────────────────────────────────────────────────

type AuthStatus = 'approved' | 'denied' | 'notDetermined';

function normaliseStatus(raw: AuthorizationStatusType): AuthStatus {
  if (raw === AuthorizationStatus.approved)      return 'approved';
  if (raw === AuthorizationStatus.denied)        return 'denied';
  return 'notDetermined';
}

// ── 1. Permission ─────────────────────────────────────────────────────────────

export async function requestScreenTimeAuthorization(): Promise<AuthStatus> {
  try {
    await RNDeviceActivity.requestAuthorization('individual');
    // Poll with maxAttempts + pollIntervalMs (correct params from source)
    const raw = await RNDeviceActivity.pollAuthorizationStatus({
      pollIntervalMs: 300,
      maxAttempts:    15,   // 15 × 300ms = 4.5s max wait
    });
    return normaliseStatus(raw);
  } catch {
    return normaliseStatus(RNDeviceActivity.getAuthorizationStatus());
  }
}

// getAuthorizationStatus is synchronous in the source
export function getAuthorizationStatus(): AuthStatus {
  return normaliseStatus(RNDeviceActivity.getAuthorizationStatus());
}

// ── 2. Save selection token ───────────────────────────────────────────────────

/**
 * Persist the raw token string from DeviceActivitySelectionView under a
 * stable ID. Call from onSelectionChange:
 *
 *   onSelectionChange={(e) =>
 *     saveSelectionToken(e.nativeEvent.familyActivitySelection)
 *   }
 */
export function saveSelectionToken(familyActivitySelection: string): string {
  RNDeviceActivity.setFamilyActivitySelectionId({
    id: SELECTION_ID,
    familyActivitySelection,
  });
  return SELECTION_ID;
}

// ── 3. Blocking ───────────────────────────────────────────────────────────────

/**
 * Start blocking immediately using blockSelection() — the direct imperative
 * API. Also starts a DeviceActivity monitor so blocking re-applies if the
 * phone restarts or the monitor process is killed.
 */
export async function startBlocking(durationSec: number): Promise<void> {
  // ── Configure shield UI ──
  const shieldConfig: ShieldConfiguration = {
    title:                        'Focus Session Active 🔥',
    subtitle:                     'This app is blocked during your focus block.',
    primaryButtonLabel:           'I need it (1 min)',
    secondaryButtonLabel:         'Go back',
    primaryButtonBackgroundColor: { red: 255, green: 107, blue: 26 },
    primaryButtonLabelColor:      { red: 255, green: 255, blue: 255 },
    secondaryButtonLabelColor:    { red: 180, green: 180, blue: 180 },
    backgroundBlurStyle:          BLUR_DARK,
  };

  const shieldActions: ShieldActions = {
    primary:   { type: 'disableBlockAllMode', behavior: 'defer' },
    secondary: { type: 'dismiss',             behavior: 'close' },
  };

  RNDeviceActivity.updateShield(shieldConfig, shieldActions);

  // ── Apply blocking immediately via imperative API ──
  // Retrieve the stored token by ID and block it
  const storedToken = RNDeviceActivity.getFamilyActivitySelectionId(SELECTION_ID);
  if (storedToken) {
    RNDeviceActivity.blockSelection({ activitySelectionId: SELECTION_ID });
  }

  // ── Also set up a DeviceActivity monitor for persistence ──
  // callbackName must be a valid CallbackName — 'intervalDidStart' fires
  // at the start of the interval, which is when we want blocking applied.
  const callbackName: CallbackName = 'intervalDidStart';

  RNDeviceActivity.configureActions({
    activityName: MONITOR_NAME,
    callbackName,
    actions: [
      {
        type:                      'blockSelection',
        familyActivitySelectionId: SELECTION_ID,
      },
    ],
  });

  const now  = new Date();
  const endT = new Date(now.getTime() + durationSec * 1000);

  const schedule: DeviceActivitySchedule = {
    intervalStart: {
      hour:   now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
    },
    intervalEnd: {
      hour:   endT.getHours(),
      minute: endT.getMinutes(),
      second: endT.getSeconds(),
    },
    repeats: false,
  };

  // DeviceActivityEvent.familyActivitySelection is FamilyActivitySelection
  // (an opaque token object). We get it via getFamilyActivitySelectionId.
  const selection = RNDeviceActivity.getFamilyActivitySelectionId(SELECTION_ID);

  if (selection) {
    await RNDeviceActivity.startMonitoring(
      MONITOR_NAME,
      schedule,
      [
        {
          eventName:               'session_active',
          familyActivitySelection: selection as unknown as FamilyActivitySelection,
          threshold:               { second: 1 },
        },
      ]
    );
  }
}

/**
 * Stop blocking immediately.
 * stopMonitoring takes string[] (optional), resetBlocks clears ManagedSettings.
 */
export async function stopBlocking(): Promise<void> {
  RNDeviceActivity.stopMonitoring([MONITOR_NAME]);
  RNDeviceActivity.resetBlocks();

  // Clear shield
  RNDeviceActivity.updateShield(
    { title: '' },
    {
      primary:   { type: 'dismiss', behavior: 'close' },
      secondary: { type: 'dismiss', behavior: 'close' },
    }
  );
}

/**
 * Pause blocking during a checkpoint break, then auto-resume.
 */
export async function pauseBlockingForBreak(
  breakDurationSec:  number,
  remainingFocusSec: number
): Promise<void> {
  await stopBlocking();
  setTimeout(() => startBlocking(remainingFocusSec), breakDurationSec * 1000);
}
