import { NativeModules, Platform } from "react-native";

const { FocusShieldModule } = NativeModules;

function assertIOS() {
  if (Platform.OS !== "ios") throw new Error("FocusShield is iOS only");
  if (!FocusShieldModule) throw new Error("FocusShieldModule not linked. Rebuild dev client.");
}

export async function requestScreenTimePermission() {
  assertIOS();
  return await FocusShieldModule.requestAuthorization();
}

export async function startShield() {
  assertIOS();
  return await FocusShieldModule.startShield();
}

export async function stopShield() {
  assertIOS();
  return await FocusShieldModule.stopShield();
}
