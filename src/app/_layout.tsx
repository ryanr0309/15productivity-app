import { Slot } from "expo-router";
import React from "react";
import { AuthProvider } from "../providers/AuthProvider";
import { DataProvider } from "../providers/DataProvider";

export default function RootLayout() {
  console.log('HIT APP/LAYOUT')
  return (
    <AuthProvider>
      <DataProvider>
        <Slot />
      </DataProvider>
    </AuthProvider>
  );
}
