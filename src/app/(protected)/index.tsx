import { Redirect } from "expo-router";
import React from "react";

export default function ProtectedIndex() {
  return <Redirect href="/(protected)/(tabs)" />;
}
