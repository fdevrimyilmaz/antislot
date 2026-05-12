import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/contexts/ThemeContext";

export type ToastTone = "success" | "error" | "warning" | "info";

type ToastConfig = {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastContextValue = {
  show: (config: ToastConfig) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3500;
const ANIM_IN_MS = 220;
const ANIM_OUT_MS = 180;

const TONE_STYLES: Record<
  ToastTone,
  { icon: keyof typeof Ionicons.glyphMap; accent: string; bg: string; iconColor: string }
> = {
  success: { icon: "checkmark-circle", accent: "#027A48", bg: "#D1FADF", iconColor: "#027A48" },
  error: { icon: "close-circle", accent: "#B42318", bg: "#FEE4E2", iconColor: "#B42318" },
  warning: { icon: "warning", accent: "#B54708", bg: "#FEF0C7", iconColor: "#B54708" },
  info: { icon: "information-circle", accent: "#0369A1", bg: "#E0F2FE", iconColor: "#0369A1" },
};

type ActiveToast = ToastConfig & { tone: ToastTone; durationMs: number; nonce: number };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveToast | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nonceRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const clearActive = useCallback(() => setActive(null), []);

  const dismiss = useCallback(() => {
    clearTimer();
    setActive(null);
  }, [clearTimer]);

  const show = useCallback(
    (config: ToastConfig) => {
      clearTimer();
      nonceRef.current += 1;
      const tone = config.tone ?? "info";
      const durationMs = config.durationMs ?? DEFAULT_DURATION_MS;
      setActive({ ...config, tone, durationMs, nonce: nonceRef.current });
      dismissTimerRef.current = setTimeout(() => setActive(null), durationMs);
    },
    [clearTimer]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, title) => show({ message, title, tone: "success" }),
      error: (message, title) => show({ message, title, tone: "error" }),
      warning: (message, title) => show({ message, title, tone: "warning" }),
      info: (message, title) => show({ message, title, tone: "info" }),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toast={active} onAnimatedOut={clearActive} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}

type ToastHostProps = {
  toast: ActiveToast | null;
  onAnimatedOut: () => void;
  onDismiss: () => void;
};

function ToastHost({ toast, onAnimatedOut, onDismiss }: ToastHostProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (toast) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: ANIM_IN_MS,
        easing: Easing.out(Easing.cubic),
      });
      const dismissAt = toast.durationMs - ANIM_OUT_MS;
      const safeDismiss = Math.max(0, dismissAt);
      const timer = setTimeout(() => {
        progress.value = withTiming(
          0,
          { duration: ANIM_OUT_MS, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(onAnimatedOut)();
          }
        );
      }, safeDismiss);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast, progress, onAnimatedOut]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -16 }],
  }));

  if (!toast) return null;

  const palette = TONE_STYLES[toast.tone];
  const topOffset = Math.max(insets.top + 8, 24);
  const a11yRole = toast.tone === "error" ? "alert" : "status";
  const liveRegion = toast.tone === "error" ? "assertive" : "polite";

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: topOffset }]}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            shadowColor: "#000",
          },
          animatedStyle,
        ]}
        accessibilityRole={a11yRole as "alert"}
        accessibilityLiveRegion={liveRegion}
        accessible
      >
        <View style={[styles.accent, { backgroundColor: palette.accent }]} />
        <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
          <Ionicons name={palette.icon} size={20} color={palette.iconColor} />
        </View>
        <View style={styles.textWrap}>
          {toast.title ? (
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {toast.title}
            </Text>
          ) : null}
          <Text
            style={[styles.message, { color: toast.title ? colors.textMuted : colors.text }]}
            numberOfLines={3}
          >
            {toast.message}
          </Text>
        </View>
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Bildirimi kapat"
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingRight: 8,
    paddingLeft: 14,
    gap: 10,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
