/**
 * services/screenTimeService.ts
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

const MONITOR_NAME = 'ember_focus_session';
const SELECTION_ID = 'ember_block_selection';
const BLUR_DARK    = 4;

type AuthStatus = 'approved' | 'denied' | 'notDetermined';

function normaliseStatus(raw: AuthorizationStatusType): AuthStatus {
  if (raw === AuthorizationStatus.approved) return 'approved';
  if (raw === AuthorizationStatus.denied)   return 'denied';
  return 'notDetermined';
}

export async function requestScreenTimeAuthorization(): Promise<AuthStatus> {
  try {
    await RNDeviceActivity.requestAuthorization('individual');
    const raw = await RNDeviceActivity.pollAuthorizationStatus({
      pollIntervalMs: 300,
      maxAttempts:    15,
    });
    return normaliseStatus(raw);
  } catch {
    return normaliseStatus(RNDeviceActivity.getAuthorizationStatus());
  }
}

export function getAuthorizationStatus(): AuthStatus {
  return normaliseStatus(RNDeviceActivity.getAuthorizationStatus());
}

export function saveSelectionToken(familyActivitySelection: string): string {
  RNDeviceActivity.setFamilyActivitySelectionId({
    id: SELECTION_ID,
    familyActivitySelection,
  });
  return SELECTION_ID;
}

export function hasStoredSelection(): boolean {
  return !!RNDeviceActivity.getFamilyActivitySelectionId(SELECTION_ID);
}

export async function startBlocking(durationSec: number, goal?: string): Promise<boolean> {
  if (!hasStoredSelection()) return false;

  
  if (goal) {
    RNDeviceActivity.userDefaultsSet('ember_session_goal', goal);
  }

  const shieldConfig: ShieldConfiguration = {
    title:                        'This app is blocked\nduring your session',
    subtitle:                     'Your focus session is active in Ember 🔥',
    primaryButtonLabel:           'Go to Ember',
    secondaryButtonLabel:         'Go back',
    primaryButtonBackgroundColor: { red: 255, green: 107, blue: 26 },
    primaryButtonLabelColor:      { red: 255, green: 255, blue: 255 },
    secondaryButtonLabelColor:    { red: 180, green: 180, blue: 180 },
    backgroundBlurStyle:          BLUR_DARK,
  };

  // disableBlockAllMode temporarily lifts the block when user taps primary.
  // This lets them switch to Ember where the session screen is open.
  // openApp is a native ShieldActionType and does not work via updateShield().
  const shieldActions: ShieldActions = {
    primary:   { type: 'openApp',             behavior: 'close' },
    secondary: { type: 'dismiss',             behavior: 'close' },
  };

  console.log('[Ember] updateShield firing with openApp action');
  RNDeviceActivity.updateShield(shieldConfig, shieldActions);

  RNDeviceActivity.blockSelection({ activitySelectionId: SELECTION_ID });

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
    intervalStart: { hour: now.getHours(),  minute: now.getMinutes(),  second: now.getSeconds() },
    intervalEnd:   { hour: endT.getHours(), minute: endT.getMinutes(), second: endT.getSeconds() },
    repeats: false,
  };

  const selection = RNDeviceActivity.getFamilyActivitySelectionId(SELECTION_ID);
  if (selection) {
    try {
      await RNDeviceActivity.startMonitoring(
        MONITOR_NAME,
        schedule,
        [
          {
            eventName:               'session_end_marker',
            familyActivitySelection: selection as unknown as FamilyActivitySelection,
            threshold:               { hour: 23 },
          },
        ]
      );
    } catch (e) {
      console.warn('[Ember] startMonitoring error (non-fatal):', e);
    }
  }

  return true;
}

export async function stopBlocking(): Promise<void> {
  RNDeviceActivity.resetBlocks();
  RNDeviceActivity.stopMonitoring([MONITOR_NAME]);
  RNDeviceActivity.userDefaultsClearWithPrefix(`actions_for_${MONITOR_NAME}`);

  RNDeviceActivity.updateShield(
    { title: '' },
    {
      primary:   { type: 'dismiss', behavior: 'close' },
      secondary: { type: 'dismiss', behavior: 'close' },
    }
  );
}

export async function pauseBlockingForBreak(
  breakDurationSec:  number,
  remainingFocusSec: number
): Promise<void> {
  await stopBlocking();
  setTimeout(() => startBlocking(remainingFocusSec), breakDurationSec * 1000);
}
