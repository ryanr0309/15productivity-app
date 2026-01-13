import { createContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import React from "react";

type AuthContextType = {
  userId: string | null;
  authReady: boolean;
  onboardingCompleted: boolean;

};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const resolvedRef = useRef(false); // ✅ ADD THIS


  useEffect(() => {
  let mounted = true;

  async function hydrate() {
    const { data: { session } } = await supabase.auth.getSession();

    if (mounted) {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    }

    setAuthReady(true); // only set here
  }

  hydrate();

  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!mounted) return;

    if (session?.user) {
      setUserId(session.user.id);
    } else {
      setUserId(null);
    }
  });

  return () => {
    mounted = false;
    sub.subscription.unsubscribe();
  };
}, []);


  return (
    <AuthContext.Provider
      value={{ userId, authReady, onboardingCompleted}}
    >
      {children}
    </AuthContext.Provider>
  );
}
