/**
 * src/lib/sessionNotifications.ts
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Persist the scheduled notification ID across app restarts ────────────────
// The module-level variable dies when the JS runtime is suspended in background.
// AsyncStorage survives. We use both — the variable for speed, storage for safety.

const NOTIF_ID_KEY = '@ember/scheduledNotifId';

let _cachedId: string | null = null;

async function saveNotifId(id: string | null) {
  _cachedId = id;
  try {
    if (id) {
      await AsyncStorage.setItem(NOTIF_ID_KEY, id);
    } else {
      await AsyncStorage.removeItem(NOTIF_ID_KEY);
    }
  } catch (e) {
    console.warn('[Ember] Failed to persist notif id:', e);
  }
}

async function getNotifId(): Promise<string | null> {
  if (_cachedId) return _cachedId;
  try {
    const stored = await AsyncStorage.getItem(NOTIF_ID_KEY);
    _cachedId = stored;
    return stored;
  } catch {
    return null;
  }
}

// ─── Notification handler ─────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  false,
    shouldSetBadge:   false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
export async function scheduleSessionEndNotification(
  durationSeconds: number,
  sessionName = 'Focus Session'
): Promise<void> {
  // Always cancel everything first — belt AND suspenders
  await cancelSessionEndNotification();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Session complete!',
      body:  `${sessionName} is over. Open Ember to unlock your apps.`,
      sound: 'default',
      data:  { url: '/(protected)/(tabs)' },
    },
    trigger: {
      type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(Math.round(durationSeconds), 1),
    },
  });

  await saveNotifId(id);
}

// ─── Cancel ───────────────────────────────────────────────────────────────────
// Cancels by stored ID AND cancels ALL scheduled notifications as a safety net.
// This is the key fix — if the JS runtime restarted and _cachedId is gone,
// cancelAllScheduledNotificationsAsync catches it anyway.
export async function cancelSessionEndNotification(): Promise<void> {
  try {
    const id = await getNotifId();
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    // Safety net: wipe everything scheduled. Ember only ever schedules
    // one notification at a time so this is always safe.
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('[Ember] cancelSessionEndNotification error:', e);
  } finally {
    await saveNotifId(null);
  }
}

// ─── Send immediate ───────────────────────────────────────────────────────────
// Cancels first (including the safety-net wipe), THEN fires immediate.
// Called from _tick after natural session end.
export async function sendSessionEndedNotification(
  sessionName = 'Focus Session'
): Promise<void> {
  // Cancel all scheduled first — ensures the timed one is 100% gone
  // before we fire the immediate replacement.
  await cancelSessionEndNotification();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Session complete!',
      body:  `Nice work on "${sessionName}". Your apps are unlocked.`,
      sound: 'default',
      data:  { url: '/(protected)/(tabs)' },
    },
    trigger: null, // fire immediately
  });
}

// ─── Tap handler ─────────────────────────────────────────────────────────────
export function setupNotificationTapHandler() {
  return Notifications.addNotificationResponseReceivedListener(response => {
    const url = response.notification.request.content.data?.url as string | undefined;
    if (url) {
      setTimeout(() => {
        const { router } = require('expo-router');
        router.push(url);
      }, 100);
    }
  });
}
