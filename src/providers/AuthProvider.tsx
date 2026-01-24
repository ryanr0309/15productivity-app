import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import React from "react";
import { router } from "expo-router";
import Purchases from "react-native-purchases";

type AuthContextType = {
  userId: string | null;
  authReady: boolean;
  validateSessionOrSignOut: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  async function validateSessionOrSignOut() {
  const { data, error } = await supabase.auth.getUser();

  
  // 🚨 SESSION IS INVALID OR USER WAS DELETED
  if (error || !data?.user) {
    await Purchases.logOut();
    await supabase.auth.signOut();
    router.replace("/(auth)/welcome");
    return false;
  }

  return true;
}

  useEffect(() => {
    let mounted = true;

    // 1️⃣ Initial hydration (handles cold app start)
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
      setAuthReady(true); // <- becomes ready only once real state known
    })();

    // 2️⃣ Subscribe to future auth state (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ userId, authReady,validateSessionOrSignOut  }}>
      {children}
    </AuthContext.Provider>
  );
}
