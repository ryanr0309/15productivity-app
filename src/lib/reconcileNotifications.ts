import * as Notifications from "expo-notifications";
import {
  scheduleMorningReminder,
  cancelMorningReminder,
  scheduleAfternoonReminder,
  cancelAfternoonReminder,
  scheduleNightReflection,
  cancelNightReflection,
} from "./notifications";

type Params = {
  notifyMorning: boolean;
  notifyAfternoon: boolean;
  notifyNight: boolean;
  estimatedSleepTime?: string | Date;
};

export async function reconcileNotifications({
  notifyMorning,
  notifyAfternoon,
  notifyNight,
  estimatedSleepTime,
}: Params) {
  const { status } = await Notifications.getPermissionsAsync();

  /* ===================== PERMISSION GUARD ===================== */

  if (status !== "granted") {
    await Promise.all([
      cancelMorningReminder(),
      cancelAfternoonReminder(),
      cancelNightReflection(),
    ]);
    return;
  }

  /* ===================== MORNING ===================== */

  if (notifyMorning) {
    await scheduleMorningReminder();
  } else {
    await cancelMorningReminder();
  }

  /* ===================== AFTERNOON ===================== */

  if (notifyAfternoon) {
    await scheduleAfternoonReminder();
  } else {
    await cancelAfternoonReminder();
  }

  /* ===================== NIGHT (DYNAMIC, ONE-OFF) ===================== */

   if (notifyNight) {
    await scheduleNightReflection();
  } else {
    await cancelNightReflection();
  }
}
