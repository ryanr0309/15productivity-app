import "react-native-gesture-handler";
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
  const [latestDay, setLatestDay] = useState<any | null>(null);
  const COOLDOWN_HOURS = 4;


  useEffect(() => {
    const load = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  setSession(session);

  let onboardingCompleted = false;

  if (session?.user) {
    const { data: profileData } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);
    onboardingCompleted = profileData?.onboarding_completed === true;
  }

  // ⏳ cooldown check data
  if (session?.user && onboardingCompleted) {
   const { data: day } = await supabase
  .from("days")
  .select("status, end_time")
  .eq("user_id", session.user.id)
  .not("end_time", "is", null)
  .order("end_time", { ascending: false })
  .limit(1)
  .maybeSingle();

setLatestDay(day ?? null);


  }

  setLoading(false);
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
