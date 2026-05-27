import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

import { withPremiumGate } from "@/components/ui/premium-gate";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import {
  cancelReverseDebtReminder,
  scheduleReverseDebtReminder,
} from "@/services/localNotifications";
import { reportError } from "@/services/monitoring";
import { formatCurrency, getSavingsConfig } from "@/store/savingsStore";

/**
 * Reverse-debt simulator — "1 oyun = saatlerce emek".
 *
 * The user picks a hypothetical bet, the dice rolls with the real-world
 * house-edge of 1% win / 99% loss, and on loss we translate the rupee
 * loss into hours of labor at their stated hourly recovery rate. Then we
 * offer a real local-notification reminder for that interval so the
 * abstract "saatler" lands as a concrete buzz at a future time.
 *
 * Implementation notes:
 *   - Inputs persist via SecureStore so re-entry doesn't reset state.
 *   - Amount/rate are clamped to sensible bounds so a runaway typo
 *     can't produce a Date that overflows the notification scheduler.
 *   - Result includes a deterministic `finishAt`; the alarm uses the
 *     SAME instant rather than recomputing on tap, so the "saat 21:30'da
 *     bitirirdin" copy is exactly when the alarm fires.
 *   - Currency follows the user's savings config — no more hard-coded TL.
 *   - Win path uses sharper copy than "looks like you won"; the 1%
 *     outcome is the manipulation, not a victory.
 */

const WIN_PERCENT = 1;
const LOSE_PERCENT = 99;
const STORAGE_KEY = "antislot_reverse_debt_input_v1";

// Upper bounds — prevents a typo (e.g. 99999999) from creating a Date that
// overflows `Notifications.scheduleNotificationAsync`'s 32-bit seconds
// trigger and from rendering hours-of-labor numbers that mean nothing.
const MAX_AMOUNT = 100_000;
const MAX_HOURLY = 10_000;

const AMOUNT_PRESETS = [100, 250, 500, 1000] as const;
const HOURLY_PRESETS = [10, 20, 30, 50] as const;
const EXAMPLE_AMOUNTS = [50, 100, 250, 500, 750, 1000] as const;

type SpinOutcome = "win" | "loss";

type SpinResult = {
  outcome: SpinOutcome;
  roll: number;
  amount: number;
  hourlyRate: number;
  workHours: number;
  /** Wall-clock target the alarm should fire at. Pinned at spin time so
   *  the displayed "X o'clock" matches the alarm even if the user delays. */
  finishAt: Date;
  currency: string;
};

interface StoredInput {
  amount: string;
  hourlyRate: string;
}

function parsePositiveInt(raw: string): number {
  const value = parseInt(raw.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  const label = Number.isInteger(rounded)
    ? `${Math.round(rounded)}`
    : rounded.toFixed(1).replace(".", ",");
  return `${label} saat`;
}

function formatWorkDays(hours: number): string {
  const dayCount = hours / 8;
  if (dayCount < 1) return "1 iş gününden az";
  const rounded = Math.round(dayCount * 10) / 10;
  const label = Number.isInteger(rounded)
    ? `${Math.round(rounded)}`
    : rounded.toFixed(1).replace(".", ",");
  return `yaklaşık ${label} iş günü`;
}

function ReverseDebtModule() {
  const { colors } = useTheme();
  const toast = useToast();

  const [amountInput, setAmountInput] = useState("100");
  const [hourlyInput, setHourlyInput] = useState("10");
  const [currency, setCurrency] = useState("TL");
  const [result, setResult] = useState<SpinResult | null>(null);
  const [alarmBusy, setAlarmBusy] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

  // One-time hydrate: pull saved input + currency.
  useEffect(() => {
    (async () => {
      try {
        const [raw, savings] = await Promise.all([
          SecureStore.getItemAsync(STORAGE_KEY),
          getSavingsConfig().catch(() => null),
        ]);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<StoredInput>;
            if (typeof parsed.amount === "string") setAmountInput(parsed.amount);
            if (typeof parsed.hourlyRate === "string") setHourlyInput(parsed.hourlyRate);
          } catch {
            // ignore — corrupt entry, keep defaults.
          }
        }
        if (savings?.currency) setCurrency(savings.currency);
      } catch (error) {
        reportError(error, { scope: "reverseDebt.hydrate", level: "warning" });
      }
    })();
  }, []);

  // Clamp on display + storage so a multi-digit typo never propagates.
  const amount = useMemo(
    () => Math.min(MAX_AMOUNT, Math.max(1, parsePositiveInt(amountInput))),
    [amountInput]
  );
  const hourlyRate = useMemo(
    () => Math.min(MAX_HOURLY, Math.max(1, parsePositiveInt(hourlyInput))),
    [hourlyInput]
  );

  // Persist whenever a debounce-friendly chunk of input lands.
  useEffect(() => {
    const id = setTimeout(() => {
      const payload: StoredInput = {
        amount: amountInput,
        hourlyRate: hourlyInput,
      };
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
    }, 400);
    return () => clearTimeout(id);
  }, [amountInput, hourlyInput]);

  const introLine = `Tamam, hayalî olarak ${amount} ${currency} ile oynayalım. Kazanma ihtimalin %${WIN_PERCENT}. Kaybetme ihtimalin %${LOSE_PERCENT}. Şimdi zarı atalım.`;

  const examples = useMemo(() => {
    const now = Date.now();
    return EXAMPLE_AMOUNTS.map((value) => {
      const workHours = value / hourlyRate;
      return {
        value,
        workHours,
        finishAt: new Date(now + workHours * 60 * 60 * 1000),
      };
    });
  }, [hourlyRate]);

  const handleSpin = () => {
    haptics.tapMedium();
    const roll = Math.floor(Math.random() * 100) + 1;
    const outcome: SpinOutcome = roll === 1 ? "win" : "loss";
    const workHours = amount / hourlyRate;
    const finishAt = new Date(Date.now() + workHours * 60 * 60 * 1000);

    setResult({
      outcome,
      roll,
      amount,
      hourlyRate,
      workHours,
      finishAt,
      currency,
    });
    // Spinning again invalidates any previous alarm state on screen — the
    // helper will still cancel-and-replace on the OS side when scheduled.
    setScheduledAt(null);

    if (outcome === "loss") {
      haptics.warning();
    } else {
      haptics.success();
    }
  };

  const handleScheduleAlarm = async () => {
    if (!result || result.outcome !== "loss") return;

    haptics.tapLight();
    setAlarmBusy(true);
    try {
      const scheduled = await scheduleReverseDebtReminder({
        amount: result.amount,
        workHours: result.workHours,
        currency: result.currency,
        // Pin the trigger to the exact moment shown in the result card so
        // "saat 21:30'da bitirirdin" matches when the notification fires.
        triggerAt: result.finishAt,
      });

      if (scheduled.status === "scheduled") {
        haptics.success();
        setScheduledAt(scheduled.triggerAt);
        toast.success(
          `${formatClock(scheduled.triggerAt)} için hatırlatma ayarlandı.`,
          "Hatırlatma kuruldu"
        );
        return;
      }

      if (scheduled.status === "denied" || scheduled.status === "undetermined") {
        haptics.warning();
        toast.warning(
          "Bildirim izni olmadan hatırlatma kurulamaz. Ayarlardan izin verebilirsin.",
          "İzin gerekli"
        );
        return;
      }

      haptics.warning();
      toast.warning(
        "Bu cihazda yerel bildirim desteklenmiyor (web/Expo Go olabilir).",
        "Desteklenmiyor"
      );
    } finally {
      setAlarmBusy(false);
    }
  };

  const handleCancelAlarm = useCallback(async () => {
    haptics.tapLight();
    try {
      await cancelReverseDebtReminder();
      setScheduledAt(null);
      toast.info("Hatırlatma iptal edildi.");
      haptics.success();
    } catch (error) {
      reportError(error, { scope: "reverseDebt.cancelAlarm", level: "warning" });
      haptics.error();
    }
  }, [toast]);

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={["#8B6614", "#7A580F", "#5A4108"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="warning" size={138} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="diamond" size={11} color="#FFD074" />
              <Text style={styles.heroBadgeText}>PREMIUM MODÜL</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Kumar Borcunu Simüle Et
            </Text>
            <Text style={styles.heroSubtitle}>
              Tersine borç yaklaşımı: oyuna girmeden önce, para yerine emek
              maliyetini gör.
            </Text>
          </LinearGradient>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Senaryo"
              icon="chatbubble-ellipses"
              subtitle={introLine}
            />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Hayalî bahis tutarı ({currency})
              </Text>
              <View
                style={[
                  styles.amountInputWrap,
                  { borderColor: colors.primary, backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.amountPrefix, { color: colors.primary }]}>{currency}</Text>
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.amountInput, { color: colors.text }]}
                  accessibilityLabel="Hayalî bahis tutarı"
                />
              </View>
              <View style={styles.chipRow}>
                {AMOUNT_PRESETS.map((preset) => {
                  const active = amount === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => {
                        haptics.selection();
                        setAmountInput(String(preset));
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {preset} {currency}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Saatlik geri kazanma hızı ({currency}/saat)
              </Text>
              <View
                style={[
                  styles.amountInputWrap,
                  { borderColor: colors.cardBorder, backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.amountPrefix, { color: colors.primary }]}>
                  {currency}/s
                </Text>
                <TextInput
                  value={hourlyInput}
                  onChangeText={setHourlyInput}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.amountInput, { color: colors.text }]}
                  accessibilityLabel="Saatlik geri kazanma hızı"
                />
              </View>
              <View style={styles.chipRow}>
                {HOURLY_PRESETS.map((preset) => {
                  const active = hourlyRate === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => {
                        haptics.selection();
                        setHourlyInput(String(preset));
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="İhtimal"
              icon="analytics"
              subtitle="%1 kazanma — %99 kaybetme"
            />
            <View style={styles.oddsRow}>
              <View
                style={[
                  styles.oddsBox,
                  { backgroundColor: `${colors.success}14`, borderColor: `${colors.success}40` },
                ]}
              >
                <Text style={[styles.oddsLabel, { color: colors.success }]}>KAZANMA</Text>
                <Text style={[styles.oddsValue, { color: colors.success }]}>%{WIN_PERCENT}</Text>
              </View>
              <View
                style={[
                  styles.oddsBox,
                  { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}40` },
                ]}
              >
                <Text style={[styles.oddsLabel, { color: colors.danger }]}>KAYBETME</Text>
                <Text style={[styles.oddsValue, { color: colors.danger }]}>%{LOSE_PERCENT}</Text>
              </View>
            </View>
            <Button
              title="Şimdi zarı at"
              onPress={handleSpin}
              variant="primary"
              fullWidth
              size="lg"
              leftIcon="dice"
              style={styles.spinBtn}
            />
          </Card>

          {result ? (
            <LinearGradient
              colors={
                result.outcome === "loss"
                  ? ["#B14040", "#A03838", "#8E2F2F"]
                  : ["#0E5C44", "#0A4A37", "#073A2B"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultHeader}>
                <View style={styles.resultBadge}>
                  <Ionicons
                    name={result.outcome === "loss" ? "close-circle" : "checkmark-circle"}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.resultBadgeText}>
                    {result.outcome === "loss" ? "SONUÇ: KAYIP" : "SONUÇ: %1’LİK TUZAK"}
                  </Text>
                </View>
                <Text style={styles.rollLabel}>Zar: {result.roll} / 100</Text>
              </View>

              {result.outcome === "loss" ? (
                <>
                  <Text style={styles.resultTitle}>
                    {formatCurrency(result.amount, result.currency)} kaybettin.
                  </Text>
                  <Text style={styles.resultText}>
                    {`Bu ${result.amount} ${result.currency}’yi geri kazanmak için ${formatHours(result.workHours)} çalışman gerekir.`}
                  </Text>
                  <Text style={styles.resultText}>
                    {`Hayalî hatırlatma: Şu an çalışmaya başlasan, saat ${formatClock(result.finishAt)}’te bitirirdin.`}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {formatWorkDays(result.workHours)} — saatte {result.hourlyRate} {result.currency} varsayımı.
                  </Text>
                  {scheduledAt ? (
                    <>
                      <View style={styles.scheduledBanner}>
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.scheduledText}>
                          {formatClock(scheduledAt)} için hatırlatma aktif.
                        </Text>
                      </View>
                      <Button
                        title="Hatırlatmayı iptal et"
                        onPress={handleCancelAlarm}
                        variant="secondary"
                        fullWidth
                        leftIcon="close-circle"
                        style={styles.alarmBtn}
                      />
                    </>
                  ) : (
                    <Button
                      title={`${formatHours(result.workHours)} sonra hatırlat`}
                      onPress={handleScheduleAlarm}
                      loading={alarmBusy}
                      disabled={alarmBusy}
                      variant="gradient"
                      fullWidth
                      size="lg"
                      leftIcon="notifications"
                      style={styles.alarmBtn}
                    />
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.resultTitle}>
                    %1’lik tuzak — bu kazançla seni tutmak istiyor.
                  </Text>
                  <Text style={styles.resultText}>
                    Casinolar nadir kazançlarla seni oyunda tutar. Sıradaki 99
                    tur büyük olasılıkla kayıp olacak — matematik her zaman evin
                    lehine işliyor.
                  </Text>
                  <Text style={styles.resultMeta}>
                    {`Aynı zarı 100 kez atsan, beklenen kayıp ${formatCurrency(result.amount * 99, result.currency)}. Bu turdeki kazanç o kaybı yalnızca biraz geciktirir.`}
                  </Text>
                </>
              )}
            </LinearGradient>
          ) : null}

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Daha fazla örnek"
              icon="list"
              subtitle={`Saatlik ${hourlyRate} ${currency} hızına göre farklı tutarların emek karşılığı.`}
            />
            <View style={styles.examplesList}>
              {examples.map((example) => (
                <View
                  key={example.value}
                  style={[
                    styles.exampleRow,
                    { borderColor: colors.cardBorder, backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.exampleTop}>
                    <Text style={[styles.exampleAmount, { color: colors.text }]}>
                      {example.value} {currency}
                    </Text>
                    <Text style={[styles.exampleHours, { color: colors.primary }]}>
                      {formatHours(example.workHours)}
                    </Text>
                  </View>
                  <Text style={[styles.exampleHint, { color: colors.textMuted }]}>
                    Şimdi başlasan: {formatClock(example.finishAt)} — {formatWorkDays(example.workHours)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 22, paddingBottom: 60 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecor: { position: "absolute", right: -20, bottom: -20 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 208, 116, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 208, 116, 0.42)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FFD074",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
  },

  cardSpacing: { marginBottom: 14 },
  fieldGroup: { marginTop: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  amountPrefix: { fontSize: 12, fontWeight: "900" },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "900",
    paddingVertical: 12,
    marginLeft: 8,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, fontWeight: "800" },

  oddsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  oddsBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  oddsLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  oddsValue: { fontSize: 24, fontWeight: "900", letterSpacing: -0.3 },
  spinBtn: { marginTop: 2 },

  resultCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  resultBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  rollLabel: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700" },
  resultTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", marginBottom: 6 },
  resultText: { color: "rgba(255,255,255,0.92)", fontSize: 13, lineHeight: 19, marginBottom: 6 },
  resultMeta: { color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 17, marginBottom: 10 },
  alarmBtn: { marginTop: 4 },
  scheduledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  scheduledText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  examplesList: { gap: 8 },
  exampleRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  exampleTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  exampleAmount: { fontSize: 14, fontWeight: "800" },
  exampleHours: { fontSize: 14, fontWeight: "900" },
  exampleHint: { fontSize: 12, marginTop: 4, lineHeight: 17 },
});

export default withPremiumGate(ReverseDebtModule, {
  title: "Kumar Borcunu Simüle Et",
  subtitle: "Tersine borç: 1 oyun = saatlerce emek",
});
