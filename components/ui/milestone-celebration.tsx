import React, { useEffect, useMemo } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/contexts/ThemeContext";
import { getMilestoneCopy, type MilestoneThreshold } from "@/store/celebrationStore";
import { haptics } from "@/services/haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#FF6F9C",
  "#FACC15",
  "#5EE0C7",
  "#B580FF",
  "#FF9D4D",
  "#7D93FF",
  "#34D399",
];

type Props = {
  visible: boolean;
  threshold: MilestoneThreshold | null;
  streakDays: number;
  onClose: () => void;
};

export function MilestoneCelebration({ visible, threshold, streakDays, onClose }: Props) {
  const { colors } = useTheme();
  const copy = useMemo(
    () => (threshold !== null ? getMilestoneCopy(threshold) : null),
    [threshold]
  );

  const trophyScale = useSharedValue(0);
  const trophyRot = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      trophyScale.value = 0;
      cardOpacity.value = 0;
      return;
    }
    haptics.success();
    cardOpacity.value = withTiming(1, { duration: 280 });
    trophyScale.value = withSequence(
      withTiming(1.15, { duration: 320, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 180 })
    );
    // Subtle wiggle, repeats forever while visible.
    trophyRot.value = withRepeat(
      withSequence(
        withTiming(-0.06, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.06, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(trophyRot);
    };
  }, [visible, trophyScale, trophyRot, cardOpacity]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRot.value}rad` },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      {
        translateY: (1 - cardOpacity.value) * 24,
      },
    ],
  }));

  const handleShare = async () => {
    if (!copy) return;
    haptics.tapLight();
    try {
      await Share.share({
        message:
          `Antislot ile ${streakDays} gün bahsiz! ${copy.emoji} ${copy.title}\n\n` +
          `Beni desteklemek ister misin?`,
      });
    } catch {
      // user cancelled or share unavailable — quiet
    }
  };

  const handleClose = () => {
    haptics.tapLight();
    onClose();
  };

  if (!copy) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <ConfettiLayer />
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <LinearGradient
            colors={colors.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>

            <Animated.Text style={[styles.trophy, trophyStyle]}>
              {copy.emoji}
            </Animated.Text>
            <Text style={styles.dayCount}>{streakDays}</Text>
            <Text style={styles.dayLabel}>gün</Text>

            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.title}>{copy.title}</Text>
              <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.85)" />
            </View>
            <Text style={styles.message}>{copy.message}</Text>

            <View style={styles.btnRow}>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Paylaş"
              >
                <Ionicons name="share-social" size={16} color="#0F172A" />
                <Text style={styles.btnPrimaryText}>Paylaş</Text>
              </Pressable>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.btnGhost,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Devam"
              >
                <Text style={styles.btnGhostText}>Devam</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Lightweight confetti: 24 particles that drift down with rotation and
 * fade. Implemented purely on the UI thread via shared values. No external
 * dependencies, no native modules.
 */
function ConfettiLayer() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 24 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  // Pseudo-random but deterministic positions per index, so the layout
  // looks varied without recomputing every render.
  const startX = ((index * 73) % 100) / 100; // 0..1
  const startDelay = (index * 90) % 1400;
  const duration = 2600 + ((index * 137) % 1200);
  const rotateTo = ((index % 2 === 0 ? 1 : -1) * (360 + (index * 30) % 240));
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + (index % 5) * 2;

  const fall = useSharedValue(0);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(startDelay, withTiming(1, { duration: 200 }));
    fall.value = withDelay(
      startDelay,
      withTiming(1, { duration, easing: Easing.in(Easing.quad) })
    );
    rot.value = withDelay(startDelay, withTiming(rotateTo, { duration }));
    return () => {
      cancelAnimation(fall);
      cancelAnimation(rot);
      cancelAnimation(opacity);
    };
  }, [fall, rot, opacity, startDelay, duration, rotateTo]);

  const style = useAnimatedStyle(() => {
    const y = fall.value * (SCREEN_H + 80);
    const lateral =
      Math.sin(fall.value * 6 + index) * 22;
    return {
      transform: [
        { translateX: startX * SCREEN_W + lateral },
        { translateY: -40 + y },
        { rotate: `${rot.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        { width: size, height: size * 0.55, backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confetti: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 2,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 380,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: "center",
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  trophy: {
    fontSize: 76,
    lineHeight: 86,
    marginTop: 4,
  },
  dayCount: {
    color: "#FFFFFF",
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 6,
  },
  dayLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  message: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 6,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    width: "100%",
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  btnPrimaryText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 14,
  },
  btnGhost: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  btnGhostText: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "800",
    fontSize: 14,
  },
});
