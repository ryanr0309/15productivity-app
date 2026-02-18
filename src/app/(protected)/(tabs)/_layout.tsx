// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../theme";

// ─── Export so screens can consume it for paddingBottom ──────────────────────
export const TAB_BAR_HEIGHT = 72;

// ─── Frosted glass background rendered as tabBarBackground ───────────────────
function TabBarBackground() {
  return (
    <>
      <View
       
        style={StyleSheet.absoluteFill}
      />
      {/* Warm ember tint */}
      <View style={styles.tint} />
      {/* Subtle border ring */}
      <View style={styles.border} />
    </>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        lazy: false,

        // ── The two magic lines ──────────────────────────────────────────────
        tabBarStyle: {
          position: "absolute",          // ← floats over content, doesn't push
          bottom: insets.bottom + 10,    // ← sits above home indicator
          left: 16,
          right: 16,
          height: TAB_BAR_HEIGHT,
          borderRadius: 32,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: "transparent",
          overflow: "hidden",            // ← clips blur to rounded corners
          // Glow shadow
          shadowColor: COLORS.orange,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
        },

        // Render the frosted blur as the background
        tabBarBackground: () => <TabBarBackground />,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 18,
          marginHorizontal: 4,
        },

        tabBarActiveBackgroundColor: "rgba(255,255,255,0.08)",
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255,255,255,0.38)",
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
              color={focused ? "#FFFFFF" : "yellow"}
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
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 10, 4, 0.70)",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
  },
});
