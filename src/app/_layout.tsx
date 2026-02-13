import { Slot } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../providers/AuthProvider";
import { BillingProvider } from "../providers/BillingProvider";
import { DataProvider } from "../providers/DataProvider";
import { useVideoPlayer } from "expo-video";

export default function RootLayout() {
  useVideoPlayer(
    require("../assets/animations/intro.mp4"),
    () => {}
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <BillingProvider>
          <DataProvider>
            <Slot />
          </DataProvider>
        </BillingProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
