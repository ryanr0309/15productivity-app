import * as Notifications from "expo-notifications";

/* ===================== HANDLER ===================== */

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as Notifications.NotificationBehavior),
});

/* ===================== IDS ===================== */

export const MORNING_NOTIFICATION_ID = "morning-reminder";
export const NIGHT_NOTIFICATION_ID = "night-reflection";

/* ===================== HELPERS ===================== */

async function cancel(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

/* ===================== MORNING ===================== */

export async function scheduleMorningReminder() {
  await cancel(MORNING_NOTIFICATION_ID);

  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_NOTIFICATION_ID,
    content: {
      title: "Start your day",
      body: "Take a moment to plan your time blocks.",
    },
   trigger: {
  type: "calendar",
  hour: 11,
  minute: 40,
  repeats: true,
} as Notifications.NotificationTriggerInput

  });
}

/* ===================== NIGHT ===================== */

export async function scheduleNightReflection() {
  await cancel(NIGHT_NOTIFICATION_ID);

  await Notifications.scheduleNotificationAsync({
    identifier: NIGHT_NOTIFICATION_ID,
    content: {
      title: "Reflect on your day",
      body: "Wrap up and review how your time went today.",
    },
    trigger: {
  type: "calendar",
  hour: 21,
  minute: 30,
  repeats: true,
} as Notifications.NotificationTriggerInput

  });
}

/* ===================== CANCEL ===================== */

export async function cancelMorningReminder() {
  await cancel(MORNING_NOTIFICATION_ID);
}

export async function cancelNightReflection() {
  await cancel(NIGHT_NOTIFICATION_ID);
}
