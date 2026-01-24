import React, { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function AnimatedTabWrapper({ children, style }: Props) {
  const isFocused = useIsFocused();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    if (isFocused) {
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      translateX.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
