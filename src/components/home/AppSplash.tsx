// components/home/AppSplash.tsx
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
  Image,
  Easing,
} from "react-native";

export function AppSplash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    // Initial fade + scale in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={require("../../assets/images/fifteen.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 96,
    height: 96,
  },
});
