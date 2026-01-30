// lib/preloadOnboardingAssets.ts
import { Asset } from "expo-asset";

export async function preloadOnboardingAssets() {
  const images = [
    require("../assets/images/LogTimeBlock.png"),
    require("../assets/images/TimeBlockScreen.png"),
    require("../assets/images/TwoScreens.png"),
    require("../assets/images/TimeBreakdown.png"),
    require("../assets/images/HabitPlacement.png"),
  ];

  await Promise.all(
    images.map(img => Asset.fromModule(img).downloadAsync())
  );
}
