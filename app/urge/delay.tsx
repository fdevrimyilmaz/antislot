import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUrgeStore } from "@/store/urgeStore";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

const DELAY_DURATION = 600;

const DELAY_COPY = {
  tr: {
    subtitle: "Durtuler gecicidir. Bu adim dalgayi atlatmana yardim eder.",
    line1: "- 10 dakikalik sureyi baslat",
    line2: "- Durtuyu fark et, eyleme gecme",
    line3: "- Dalgayi gecirdigini hatirla",
    line4: "- Bunu yapabilirsin",
    timeRemaining: "Kalan sure",
    done: "Sure bitti",
    runningHint: "Durtuyu sadece izle. Geciyor.",
    doneHint: "Surenin sonuna geldin. Simdi nasil hissettigine bak.",
  },
  en: {
    subtitle: "Urges are temporary. This exercise helps you ride the wave.",
    line1: "- Start a 10-minute timer",
    line2: "- Notice the urge without acting on it",
    line3: "- Remember that the wave will pass",
    line4: "- You can do this",
    timeRemaining: "Time remaining",
    done: "Time is up",
    runningHint: "Notice the urge and let it pass.",
    doneHint: "You made it through the timer. Check how you feel now.",
  },
} as const;

export default function DelayScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { activeUrge, hydrated, addIntervention, completeIntervention } = useUrgeStore();
  const copy = useLocalizedCopy(DELAY_COPY);

  const [timeRemaining, setTimeRemaining] = useState(DELAY_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [started, setStarted] = useState(false);

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

  const handleStart = async () => {
    await addIntervention("delay", DELAY_DURATION);
    setStarted(true);
    setIsRunning(true);
  };

  const handleComplete = async () => {
    await completeIntervention("helpful");
    router.push("/urge/intervene");
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = ((DELAY_DURATION - timeRemaining) / DELAY_DURATION) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {!started ? (
          <View style={styles.introView}>
            <TouchableOpacity onPress={() => router.push("/urge/intervene")} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.text }]}>{`<- ${t.urgeBack}`}</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>{t.urgeInterventionLabels.delay}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>
            <Text style={[styles.list, { color: colors.text }]}>
              {copy.line1}
              {"\n"}
              {copy.line2}
              {"\n"}
              {copy.line3}
              {"\n"}
              {copy.line4}
            </Text>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => void handleStart()} activeOpacity={0.82}>
              <Text style={styles.primaryBtnText}>{t.urgeDelayStart}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timerView}>
            <Text style={[styles.timer, { color: colors.text }]}>{`${minutes}:${seconds.toString().padStart(2, "0")}`}</Text>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
              {timeRemaining > 0 ? copy.timeRemaining : copy.done}
            </Text>

            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
            </View>

            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {timeRemaining > 0 ? copy.runningHint : copy.doneHint}
            </Text>

            {timeRemaining > 0 ? (
              isRunning ? (
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => setIsRunning(false)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{t.urgeDelayPause}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setIsRunning(true)} activeOpacity={0.82}>
                  <Text style={styles.primaryBtnText}>{t.urgeDelayResume}</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => void handleComplete()} activeOpacity={0.82}>
                <Text style={styles.primaryBtnText}>{t.urgeContinue}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  },
  introView: {
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: Fonts.bodySemiBold,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Fonts.display,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 18,
  },
  list: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 24,
  },
  timerView: {
    alignItems: "center",
  },
  timer: {
    fontSize: 66,
    lineHeight: 74,
    fontFamily: Fonts.display,
    marginBottom: 6,
  },
  timerLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 16,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: { height: "100%", borderRadius: Radius.full },
  hint: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 18,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: 13,
    paddingHorizontal: 34,
    minWidth: 190,
    alignItems: "center",
    ...Shadows.button,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 170,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
  },
});
