import { Redirect } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { AppSplash } from "../components/home/AppSplash";
import React from "react";

export default function Index() {
  const { userId, authReady } = useAuth();

  if (!authReady) return <AppSplash />;

  if (!userId) return <Redirect href="/(auth)/welcome" />;

  return <Redirect href="/(protected)" />;
}

