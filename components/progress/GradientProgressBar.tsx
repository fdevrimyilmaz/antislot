import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { GRADIENTS, progressCardStyles } from "./styles";

type Props = {
  progress: number;
  height?: number;
  gradient?: readonly [string, string, ...string[]];
  borderRadius?: number;
};

export function GradientProgressBar({
  progress,
  height = 10,
  gradient = GRADIENTS.primary,
  borderRadius = 5,
}: Props) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: Math.min(1, Math.max(0, progress)),
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, animValue]);

  return (
    <View style={[progressCardStyles.progressBarTrack, { height, borderRadius }]}>
      <Animated.View
        style={[
          styles.fillWrap,
          {
            height,
            borderRadius,
            width: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { height, borderRadius }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fillWrap: { overflow: "hidden" },
  gradient: { flex: 1, width: "100%" },
});
