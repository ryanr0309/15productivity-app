import { Slot } from "expo-router";
import React, { useEffect } from "react";
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
    <AuthProvider>
  <BillingProvider>
    <DataProvider>
      <Slot />
    </DataProvider>
  </BillingProvider>
</AuthProvider>

  );
}
