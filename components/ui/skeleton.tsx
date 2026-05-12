import React, { useEffect } from "react";
import { StyleSheet, type StyleProp, type ViewStyle, type DimensionValue } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/contexts/ThemeContext";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const PULSE_LOW = 0.45;
const PULSE_HIGH = 0.85;
const PULSE_HALF_MS = 700;

export function Skeleton({ width = "100%", height = 14, radius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const pulse = useSharedValue(PULSE_LOW);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(PULSE_HIGH, { duration: PULSE_HALF_MS, easing: Easing.inOut(Easing.ease) }),
        withTiming(PULSE_LOW, { duration: PULSE_HALF_MS, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        animatedStyle,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.cardBorder,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
