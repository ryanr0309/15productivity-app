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
export const AFTERNOON_NOTIFICATION_ID = "afternoon-reminder";
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
      title: "Start your day ☀️",
      body: "Take a moment to plan your time blocks.",
    },
   trigger: {
  type: "calendar",
  hour: 9,
  minute: 0,
  repeats: true,
} as Notifications.NotificationTriggerInput

  });
}

export async function scheduleAfternoonReminder() {
  await cancel(AFTERNOON_NOTIFICATION_ID);

  await Notifications.scheduleNotificationAsync({
    identifier: AFTERNOON_NOTIFICATION_ID,
    content: {
      title: "Afternoon check-in ☀️",
      body: "Pause and see how your day is going.",
    },
    trigger: {
      type: "calendar",
      hour: 14,         // ✅ 3:00 PM
      minute: 30,
      repeats: true,
    } as Notifications.NotificationTriggerInput,
  });
}

export async function cancelAfternoonReminder() {
  await cancel(AFTERNOON_NOTIFICATION_ID);
}

/* ===================== NIGHT ===================== */

export async function scheduleNightReflection(
) {
  await cancel(NIGHT_NOTIFICATION_ID);


  await Notifications.scheduleNotificationAsync({
    identifier: NIGHT_NOTIFICATION_ID,
    content: {
      title: "Night reflection 🌙",
      body: "Wrap up and reflect on how your time went today.",
    },
    trigger: {
      type: "calendar",
      hour: 21,         // ✅ 3:00 PM
      minute: 30,
      repeats: true,
    } as Notifications.NotificationTriggerInput,
  });
} 


/* ===================== CANCEL ===================== */

export async function cancelMorningReminder() {
  await cancel(MORNING_NOTIFICATION_ID);
}

export async function cancelNightReflection() {
  await cancel(NIGHT_NOTIFICATION_ID);
}
