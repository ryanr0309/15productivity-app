import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { requestScreenTimePermission, startShield } from "../native/FocusShield";
import { COLORS, FONTS } from "../theme";

export default function ScreenTimeButton() {
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePress = async () => {
    if (Platform.OS !== "ios") {
      setError("Screen Time only works on iOS.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await requestScreenTimePermission();
      await startShield();

      setGranted(true);
    } catch (e: any) {
      console.warn("ScreenTime error:", e);
      setError("Permission denied or failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={loading}
        style={[styles.button, granted && styles.buttonGranted]}
      >
        <LinearGradient
          colors={
            granted
              ? ["#55DDAA", "#44BB99"]
              : ["#FF9030", "#FF5E0E"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#1A0602" />
          ) : (
            <Text style={styles.text}>
              {granted ? "Shield Active 🔒" : "Enable Focus Shield"}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  button: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#FF6600",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGranted: {
    shadowColor: "#55DDAA",
  },
  gradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: FONTS.black,
    fontSize: 16,
    color: "#1A0602",
    letterSpacing: 0.3,
  },
  error: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: "#FF4433",
    textAlign: "center",
  },
});
