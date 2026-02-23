/**
 * src/lib/sessionNotifications.ts
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let scheduledNotifId: string | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Fix 1: NotificationBehavior requires shouldShowBanner + shouldShowList
// in newer expo-notifications versions, not just shouldShowAlert.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,   // legacy — keep for older SDK compat
    shouldShowBanner: true,   // required in SDK 51+
    shouldShowList:   true,   // required in SDK 51+
    shouldPlaySound:  false,
    shouldSetBadge:   false,
  }),
});

export async function scheduleSessionEndNotification(
  durationSeconds: number,
  sessionName = 'Focus Session'
): Promise<void> {
  await cancelSessionEndNotification();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Session complete!',
      body:  `${sessionName} is over. Open Ember to unlock your apps.`,
      sound: 'default',
      data:  { url: '/(protected)/(tabs)' },
    },
    // Fix 2: TimeIntervalTriggerInput requires type: 'timeInterval'
    trigger: {
      type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(Math.round(durationSeconds), 1),
    },
  });

  scheduledNotifId = id;
}

export async function cancelSessionEndNotification(): Promise<void> {
  if (scheduledNotifId) {
    await Notifications.cancelScheduledNotificationAsync(scheduledNotifId);
    scheduledNotifId = null;
  }
}

export async function sendSessionEndedNotification(
  sessionName = 'Focus Session'
): Promise<void> {
  await cancelSessionEndNotification();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Session ended',
      body:  `${sessionName} complete. Open Ember to unlock your apps.`,
      sound: 'default',
      data:  { url: '/(protected)/(tabs)' },
    },
    trigger: null, // fire immediately
  });
}

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
