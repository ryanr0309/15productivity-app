// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { colors } from "../../../constants/colors";


export default function TabsLayout() {

  console.log("HITTING TABS LAYOUT")
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        freezeOnBlur: true,
        lazy: false,

        tabBarStyle: {
  backgroundColor: colors.background,
  borderTopWidth: 0,
  elevation: 0,
  height: 80,
  paddingBottom: 8,
  paddingTop: 6,
},
tabBarLabelStyle: {
  fontSize: 11,
  fontWeight: "600",
  marginTop: 2,
},
tabBarItemStyle: {
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 16,
},

tabBarActiveBackgroundColor: "rgba(255,255,255,0.08)",




        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#6B6B6B",
        
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="lab"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size + 4} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
