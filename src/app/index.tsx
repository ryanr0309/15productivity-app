import { Redirect } from "expo-router";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import React from "react";

type UserProfile = {
  onboarding_completed: boolean;
};

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      // 1️⃣ Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      // 2️⃣ Fetch profile if logged in
      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single();

        setProfile(data);
      }

      setLoading(false);
      console.log("SESSION:", session);
        console.log("PROFILE:", profile);

    };

    load();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // 🚫 Not logged in → Welcome screen
  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // 🧭 Logged in, onboarding not finished
  if (!profile || profile.onboarding_completed !== true) {
  return <Redirect href="/(onboarding)" />;
}


  // ✅ Logged in + onboarding done
  return <Redirect href="/(tabs)" />;
}
