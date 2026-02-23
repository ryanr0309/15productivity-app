// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Easing as REasing,
} from "react-native-reanimated";
import { COLORS, FONTS } from "../../../theme";

export const TAB_BAR_HEIGHT = 68;

const TABS = [
  { name: "index",    label: "Home",     icon: "grid",      iconOut: "grid-outline"      },
  { name: "insights", label: "Insights", icon: "bar-chart", iconOut: "bar-chart-outline" },
  { name: "settings", label: "Settings", icon: "settings",  iconOut: "settings-outline"  },
] as const;

// ─── Single animated tab button ───────────────────────────────────────────────
function TabButton({
  label, icon, iconOut, focused, onPress,
}: {
  label: string;
  icon: string;
  iconOut: string;
  focused: boolean;
  onPress: () => void;
}) {
  const press   = useSharedValue(0);
  const focusAnim = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    focusAnim.value = withSpring(focused ? 1 : 0, {
      mass: 0.6, damping: 14, stiffness: 180,
    });
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(focusAnim.value, [0, 1], [0, 1]),
    transform: [{ scaleX: interpolate(focusAnim.value, [0, 1], [0.7, 1]) }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(focusAnim.value, [0, 1], [1, 1.18]) },
      { translateY: interpolate(focusAnim.value, [0, 1], [0, -1]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(focusAnim.value, [0, 1], [0.38, 1]),
    transform: [{ scale: interpolate(focusAnim.value, [0, 1], [0.92, 1]) }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.91]) }],
  }));

  return (
    <Pressable
      style={styles.tabBtn}
      onPress={onPress}
      onPressIn={() => { press.value = withSpring(1, { mass: 0.3, damping: 10, stiffness: 300 }); }}
      onPressOut={() => { press.value = withSpring(0, { mass: 0.3, damping: 10, stiffness: 300 }); }}
    >
      <Animated.View style={[styles.tabInner, pressStyle]}>
        {/* Active pill glow behind icon */}
        <Animated.View style={[styles.activePill, pillStyle]} />

        {/* Icon */}
        <Animated.View style={iconStyle}>
          <Ionicons
            name={(focused ? icon : iconOut) as any}
            size={22}
            color={focused ? "#FFFFFF" : "rgba(255,255,255,0.38)"}
          />
        </Animated.View>

        {/* Label */}
        <Animated.Text style={[styles.tabLabel, labelStyle, focused && styles.tabLabelActive]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barOuter, { bottom: insets.bottom + 10 }]}>
      {/* Glass layers */}
      <View style={styles.barBg} />
      <View style={styles.barTint} />
      <View style={styles.barBorder} />

      {/* Top accent line */}
      <View style={styles.barTopAccent} />

      {/* Tab buttons */}
      <View style={styles.barContent}>
        {state.routes.map((route: any, i: number) => {
          const tab     = TABS.find(t => t.name === route.name) ?? TABS[0];
          const focused = state.index === i;
          return (
            <TabButton
              key={route.key}
              label={tab.label}
              icon={tab.icon}
              iconOut={tab.iconOut}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress", target: route.key, canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        lazy: false,
      }}
    >
      <Tabs.Screen name="index"    options={{ title: "Home"     }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Bar shell
  barOuter: {
    position:     "absolute",
    left:         16,
    right:        16,
    height:       TAB_BAR_HEIGHT,
    borderRadius: 32,
    overflow:     "hidden",
    // Ember glow shadow
    shadowColor:   "#FF5500",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius:  22,
    elevation:     18,
  },

  barBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 7, 2, 0.82)",
  },
  barTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 80, 10, 0.055)",
  },
  barBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth:  1,
    borderColor:  "rgba(255, 255, 255, 0.09)",
  },
  // Thin warm line at the very top of the bar
  barTopAccent: {
    position:        "absolute",
    top:             0,
    left:            40,
    right:           40,
    height:          1,
    borderRadius:    1,
    backgroundColor: "rgba(255, 120, 40, 0.30)",
  },

  barContent: {
    flex:           1,
    flexDirection:  "row",
    alignItems:     "center",     // ← vertically centres the tab buttons
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },

  // Individual tab
  tabBtn: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    height:         TAB_BAR_HEIGHT,  // full bar height so tap target is generous
  },

  tabInner: {
    alignItems:    "center",
    justifyContent: "center",
    gap:            3,
    paddingVertical:  6,
    paddingHorizontal: 14,
    borderRadius:  22,
    position:      "relative",
  },

  // Glowing pill that appears behind the active icon
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    22,
    backgroundColor: "rgba(255, 100, 30, 0.14)",
    borderWidth:     1,
    borderColor:     "rgba(255, 120, 40, 0.22)",
    // Inner glow
    shadowColor:     "#FF6010",
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.55,
    shadowRadius:    10,
  },

  tabLabel: {
    fontSize:      10,
    fontFamily:    FONTS.bold,
    letterSpacing: 0.4,
    color:         "rgba(255,255,255,0.38)",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
});
