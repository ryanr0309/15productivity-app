// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { colors } from "../../../constants/colors";
import { useData } from "../../../providers/DataProvider";
import { ActivityIndicator, View } from "react-native";
import { AppSplash } from "../../../components/home/AppSplash";
import { useBilling } from "../../../providers/BillingProvider";
import { PaywallGate } from "../../../components/PaywallGate";

export default function TabsLayout() {
  const { hydrated, hydrate } = useData();

   const { paywallState } = useBilling();

   console.log("paywallState:", paywallState);

   useEffect(() => {
    hydrate();
  }, []);


  if (paywallState === "LOADING") {
    return <AppSplash />;
  }
 

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        lazy: false,

        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 82,
          paddingBottom: 10,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 18,
          marginHorizontal: 6,
        },

        tabBarActiveBackgroundColor: "rgba(255,255,255,0.08)",
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255,255,255,0.45)",
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
        }}
      />

      {/* INSIGHTS */}
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
        }}
      />

      {/* LAB – PRIMARY ACTION */}
      <Tabs.Screen
        name="lab"
        options={{
          title: "Lab",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "sparkles" : "sparkles-outline"}
              size={focused ? 30 : 28}
              color={focused ? "#FFFFFF" : colors.textSecondary}
            />
          ),
        }}
      />

      {/* SETTINGS */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
    <PaywallGate />
    </>
  );
}
