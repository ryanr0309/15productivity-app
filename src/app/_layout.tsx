import { Stack } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import React from "react";

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("AUTH CHANGE:", session?.user);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <Stack />;
}

