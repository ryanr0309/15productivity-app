import { Stack } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import React from "react";

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    async function hydrateAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    hydrateAuth();
  }, []);

  return <Stack />;
}
