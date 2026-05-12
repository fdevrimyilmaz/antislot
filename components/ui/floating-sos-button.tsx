import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { haptics } from "@/services/haptics";

type FloatingSOSButtonProps = {
  /** Distance from bottom edge. Defaults to 100 (above tab bar). */
  bottom?: number;
  /** Distance from right edge. Defaults to 18. */
  right?: number;
};

export function FloatingSOSButton({ bottom = 100, right = 18 }: FloatingSOSButtonProps) {
  const router = useRouter();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1100, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 1100, easing: Easing.in(Easing.cubic) })
      ),
      -1
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value, // 1 at scale=1 → ~0.88 at scale=1.12 (subtle fade)
  }));

  const handlePress = () => {
    haptics.tapHeavy();
    router.push("/sos");
  };

  return (
    <View
      style={[styles.host, { bottom, right }]}
      pointerEvents="box-none"
      accessibilityRole="none"
    >
      <Animated.View style={[styles.pulseRing, ringStyle]} pointerEvents="none" />
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Acil SOS yardımı"
        style={styles.touch}
      >
        <LinearGradient
          colors={["#FF7A4A", "#FF5A30", "#E03E14"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Text style={styles.label}>SOS</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    zIndex: 100,
    elevation: 14,
  },
  pulseRing: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(255, 90, 48, 0.32)",
  },
  touch: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: "hidden",
    shadowColor: "#E03E14",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  button: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.2,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
