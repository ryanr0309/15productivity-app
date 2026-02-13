import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import FocusCore from "../../../components/home/RadialTimeCore";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const RECENT_SESSIONS = [
  { id: "1", score: 82, duration: "45m", time: "1:15 PM" },
  { id: "2", score: 67, duration: "30m", time: "10:00 AM" },
  { id: "3", score: 94, duration: "60m", time: "8:00 AM" },
];

export default function Home() {
  const holdProgress = useSharedValue(0);

  const onFocusStart = useCallback(() => {
    console.log("Focus Session Started");
  }, []);

  const gesture = Gesture.LongPress()
    .minDuration(800)
    .onStart(() => {
      holdProgress.value = withTiming(1, { duration: 800 });
    })
    .onEnd((_, success) => {
      if (success) {
        onFocusStart();
      }
      holdProgress.value = withSpring(0);
    });

  const animatedCoreStyle = useAnimatedStyle(() => {
    const scale = interpolate(holdProgress.value, [0, 1], [1, 1.1]);
    const opacity = interpolate(holdProgress.value, [0, 1], [0.8, 1]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const renderSession = ({ item }: any) => (
    <View style={styles.sessionRow}>
      <Text style={styles.sessionScore}>{item.score}</Text>
      <Text style={styles.sessionMeta}>
        {item.duration} • {item.time}
      </Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Top Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Afternoon</Text>
          <Text style={styles.subtext}>Ready to lock in?</Text>
        </View>

        {/* Time Core */}
        <View style={styles.coreWrapper}>
           <FocusCore
  />
        </View>

        {/* Schedule Button */}
        <Pressable
  style={styles.scheduleButton}
  onPress={() => router.push("/focus/schedule")}
>

          <Text style={styles.scheduleText}>Schedule Focus</Text>
        </Pressable>




        {/* Recent Sessions */}
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent Sessions</Text>
          <FlatList
            data={RECENT_SESSIONS}
            keyExtractor={(item) => item.id}
            renderItem={renderSession}
            scrollEnabled={false}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1224",
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  header: {
    marginBottom: 40,
  },

  greeting: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
  },

  subtext: {
    color: "#6B7A99",
    fontSize: 16,
    marginTop: 4,
  },

  coreWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },

  core: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: 999,
    backgroundColor: "#111C3D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4DA3FF",
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },

  coreText: {
    color: "#4DA3FF",
    fontSize: 18,
    fontWeight: "600",
  },

  scheduleButton: {
    backgroundColor: "#141F3D",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },

  scheduleText: {
    color: "#4DA3FF",
    fontSize: 16,
    fontWeight: "500",
  },

  recentContainer: {
    marginTop: 10,
  },

  recentTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C294D",
  },

  sessionScore: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },

  sessionMeta: {
    color: "#6B7A99",
    fontSize: 14,
  },
});
