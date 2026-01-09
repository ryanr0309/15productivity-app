import { createContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import React from "react";

type AuthContextType = {
  userId: string | null;
  authReady: boolean;
  onboardingCompleted: boolean;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const resolvedRef = useRef(false); // ✅ ADD THIS

  const logout = async () => {
    console.log("Logged out")
  await supabase.auth.signOut();
  setUserId(null);
  setOnboardingCompleted(false);
};



  useEffect(() => {
    let mounted = true;
    console.log("🟢 AuthProvider mounted");

    async function resolve(session: any) {
      if (!mounted) return;
      if (resolvedRef.current) return; // ✅ GUARD
      resolvedRef.current = true;

      if (!session?.user) {
        setUserId(null);
        setOnboardingCompleted(false);
        setAuthReady(true);
        return;
      }

      setUserId(session.user.id);

      const { data } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .single();

      if (!mounted) return;

      setOnboardingCompleted(data?.onboarding_completed === true);
      setAuthReady(true);
    }

  
    // initial load
    supabase.auth.getSession().then(({ data }) => {
      resolve(data.session);
    });

    // auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("🔵 auth state change:", session);
        resolve(session);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ userId, authReady, onboardingCompleted, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
