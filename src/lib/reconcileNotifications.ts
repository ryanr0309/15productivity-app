import * as Notifications from "expo-notifications";
import {
  scheduleMorningReminder,
  scheduleNightReflection,
  cancelMorningReminder,
  cancelNightReflection,
} from "./notifications";

export async function reconcileNotifications({
  notifyMorning,
  notifyNight,
}: {
  notifyMorning: boolean;
  notifyNight: boolean;
}) {
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    await cancelMorningReminder();
    await cancelNightReflection();
    return;
  }

  if (notifyMorning) {
    await scheduleMorningReminder();
  } else {
    await cancelMorningReminder();
  }

  if (notifyNight) {
    await scheduleNightReflection();
  } else {
    await cancelNightReflection();
  }
}
