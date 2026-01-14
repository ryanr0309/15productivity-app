import { Slot } from "expo-router";
import React from "react";
import { AuthProvider } from "../providers/AuthProvider";
import { BillingProvider } from "../providers/BillingProvider";
import { DataProvider } from "../providers/DataProvider";

export default function RootLayout() {
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
