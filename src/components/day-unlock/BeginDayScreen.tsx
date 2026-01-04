import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics"

type Props = {
  onBeginDay: () => void;
};

export default function BeginDayScreen({ onBeginDay }: Props) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBeginDay();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.title}>Good morning.</Text>
        <Text style={styles.subtitle}>
          Let’s set the tone for today.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Begin Day</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220", // same gradient family as Home
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    transform: [{ translateY: -40 }], // lifts text slightly above center
  },

  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 17,
    fontWeight: "400",
    color: "#B0B8D4",
    maxWidth: "80%",
    lineHeight: 24,
  },

  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },

  button: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#4DA3FF", // brand accent
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0B1220",
  },
});
