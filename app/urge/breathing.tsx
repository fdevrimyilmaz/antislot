import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trackEvent } from "@/services/analytics";
import { DEFAULT_BREATHING_PLAN } from "@/services/crisisProtocol";
import { useUrgeStore } from "@/store/urgeStore";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

const BREATHING_CYCLE = {
  inhale: DEFAULT_BREATHING_PLAN.inhaleSec,
  hold: DEFAULT_BREATHING_PLAN.holdSec,
  exhale: DEFAULT_BREATHING_PLAN.exhaleSec,
} as const;

const TOTAL_DURATION = 60;

const BREATHING_COPY = {
  tr: {
    holdInstruction: "Nefesi yumusakca tut.",
    startGuide1: "- 4 saniye nefes al",
    startGuide2: "- 4 saniye tut",
    startGuide3: "- 6 saniye ver",
    startGuide4: "- Donguyu tekrar et",
    runningHint: "Sadece nefese odaklan. Dalgayi geciriyorsun.",
    doneHint: "Sure tamamlandi. Simdi nasil hissettigine bak.",
  },
  en: {
    holdInstruction: "Hold your breath gently.",
    startGuide1: "- Inhale for 4 seconds",
    startGuide2: "- Hold for 4 seconds",
    startGuide3: "- Exhale for 6 seconds",
    startGuide4: "- Repeat the cycle",
    runningHint: "Focus only on breath. You are riding the wave.",
    doneHint: "Time completed. Notice how you feel now.",
  },
} as const;

export default function BreathingScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { activeUrge, hydrated, completeIntervention } = useUrgeStore();
  const copy = useLocalizedCopy(BREATHING_COPY);

  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [scale] = useState(new Animated.Value(1));

  useEffect(() => {
    if (hydrated && !activeUrge) {
      router.replace("/urge/detect");
    }
  }, [hydrated, activeUrge]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const phaseDuration = BREATHING_CYCLE[phase] * 1000;
    const phaseTimer = setTimeout(() => {
      if (phase === "inhale") setPhase("hold");
      else if (phase === "hold") setPhase("exhale");
      else setPhase("inhale");
    }, phaseDuration);
    return () => clearTimeout(phaseTimer);
  }, [phase, isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const animation = Animated.timing(scale, {
      toValue: phase === "exhale" ? 1 : 1.26,
      duration: BREATHING_CYCLE[phase] * 500,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [phase, isRunning, scale]);

  const handleStart = () => {
    trackEvent("breathing_started", {
      pattern: DEFAULT_BREATHING_PLAN.pattern,
      totalSeconds: TOTAL_DURATION,
    });
    setIsRunning(true);
  };

  const handleComplete = async () => {
    trackEvent("breathing_completed", {
      pattern: DEFAULT_BREATHING_PLAN.pattern,
      totalSeconds: TOTAL_DURATION,
    });
    await completeIntervention("helpful");
    router.push("/urge/intervene");
  };

  const phaseLabel = {
    inhale: t.urgeBreathingInhale,
    hold: t.urgeBreathingHold,
    exhale: t.urgeBreathingExhale,
  }[phase];

  const phaseInstruction = {
    inhale: t.urgeBreathingInhale,
    hold: copy.holdInstruction,
    exhale: t.urgeBreathingExhale,
  }[phase];

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {!isRunning && timeRemaining === TOTAL_DURATION ? (
          <View style={styles.startView}>
            <Text style={[styles.title, { color: colors.text }]}>{t.urgeBreathingTitle}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.urgeBreathingSubtitle}</Text>
            <Text style={[styles.instructions, { color: colors.text }]}>
              {copy.startGuide1}
              {"\n"}
              {copy.startGuide2}
              {"\n"}
              {copy.startGuide3}
              {"\n"}
              {copy.startGuide4}
            </Text>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleStart} activeOpacity={0.82}>
              <Text style={styles.primaryBtnText}>{t.urgeBreathingStart}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.exerciseView}>
            <Text style={[styles.timer, { color: colors.text }]}>{timeDisplay}</Text>
            <Animated.View
              style={[
                styles.circle,
                {
                  backgroundColor: `${colors.primary}20`,
                  borderColor: colors.primary,
                  transform: [{ scale }],
                },
              ]}
            >
              <Text style={[styles.phaseLabel, { color: colors.primary }]}>{phaseLabel}</Text>
              <Text style={[styles.phaseCount, { color: colors.primary }]}>{BREATHING_CYCLE[phase]}</Text>
            </Animated.View>
            <Text style={[styles.phaseInstruction, { color: colors.textSecondary }]}>
              {timeRemaining > 0 ? `${phaseInstruction}` : copy.doneHint}
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {timeRemaining > 0 ? copy.runningHint : ""}
            </Text>

            {timeRemaining === 0 ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => void handleComplete()}
                activeOpacity={0.82}
              >
                <Text style={styles.primaryBtnText}>{t.urgeContinue}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <TouchableOpacity style={styles.skipBtn} onPress={() => router.push("/urge/intervene")} activeOpacity={0.82}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>{isRunning ? t.urgeSkip : t.urgeBack}</Text>
        </TouchableOpacity>
      </View>
      <SOSQuickAccess variant="floating" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  startView: { alignItems: "center", width: "100%" },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Fonts.display,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
    marginBottom: 24,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.body,
    marginBottom: 28,
    textAlign: "center",
  },
  exerciseView: { alignItems: "center", width: "100%" },
  timer: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Fonts.display,
    marginBottom: 20,
  },
  circle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  phaseLabel: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  phaseCount: {
    fontSize: 42,
    lineHeight: 46,
    fontFamily: Fonts.display,
  },
  phaseInstruction: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 16,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: "center",
    minWidth: 190,
    ...Shadows.button,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
  },
  skipBtn: {
    marginTop: 20,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
  },
});
