import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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

import { withPremiumGate } from "@/components/ui/premium-gate";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { scheduleReverseDebtReminder } from "@/services/localNotifications";
import { formatCurrency } from "@/store/savingsStore";

const WIN_PERCENT = 1;
const LOSE_PERCENT = 99;

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
  finishAt: Date;
};

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
  if (dayCount < 1) return "1 is gununden az";
  const rounded = Math.round(dayCount * 10) / 10;
  const label = Number.isInteger(rounded)
    ? `${Math.round(rounded)}`
    : rounded.toFixed(1).replace(".", ",");
  return `yaklasik ${label} is gunu`;
}

function ReverseDebtModule() {
  const { colors } = useTheme();
  const toast = useToast();

  const [amountInput, setAmountInput] = useState("100");
  const [hourlyInput, setHourlyInput] = useState("10");
  const [result, setResult] = useState<SpinResult | null>(null);
  const [alarmBusy, setAlarmBusy] = useState(false);

  const amount = useMemo(() => Math.max(1, parsePositiveInt(amountInput)), [amountInput]);
  const hourlyRate = useMemo(
    () => Math.max(1, parsePositiveInt(hourlyInput)),
    [hourlyInput]
  );

  const introLine = `Tamam, hayali olarak ${amount} TL ile oynayalim. Kazanma ihtimalin %${WIN_PERCENT}. Kaybetme ihtimalin %${LOSE_PERCENT}. Simdi zari atalim.`;

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
    });

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
        currency: "TL",
      });

      if (scheduled.status === "scheduled") {
        haptics.success();
        toast.success(
          `${formatClock(scheduled.triggerAt)} icin hatirlatma ayarlandi.`,
          "Alarm kuruldu"
        );
        return;
      }

      if (scheduled.status === "denied" || scheduled.status === "undetermined") {
        haptics.warning();
        toast.warning(
          "Bildirim izni olmadan alarm kurulamaz. Ayarlardan izin verebilirsin.",
          "Izin gerekli"
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
              <Text style={styles.heroBadgeText}>PREMIUM MODUL</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Kumar Borcunu Simule Et
            </Text>
            <Text style={styles.heroSubtitle}>
              Tersine borc yaklasimi: oyuna girmeden once, para yerine emek
              maliyetini gor.
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
                Hayali bahis tutari (TL)
              </Text>
              <View
                style={[
                  styles.amountInputWrap,
                  { borderColor: colors.primary, backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.amountPrefix, { color: colors.primary }]}>TL</Text>
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.amountInput, { color: colors.text }]}
                  accessibilityLabel="Hayali bahis tutari"
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
                        {preset} TL
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Saatlik geri kazanma hizi (TL/saat)
              </Text>
              <View
                style={[
                  styles.amountInputWrap,
                  { borderColor: colors.cardBorder, backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.amountPrefix, { color: colors.primary }]}>TL/s</Text>
                <TextInput
                  value={hourlyInput}
                  onChangeText={setHourlyInput}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.amountInput, { color: colors.text }]}
                  accessibilityLabel="Saatlik geri kazanma hizi"
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
              title="Ihtimal"
              icon="analytics"
              subtitle="%1 kazanma - %99 kaybetme"
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
              title="Simdi zari at"
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
                    {result.outcome === "loss" ? "SONUC: KAYIP" : "SONUC: KAZANCLI TUR"}
                  </Text>
                </View>
                <Text style={styles.rollLabel}>Zar: {result.roll} / 100</Text>
              </View>

              {result.outcome === "loss" ? (
                <>
                  <Text style={styles.resultTitle}>
                    {formatCurrency(result.amount, "TL")} kaybettin.
                  </Text>
                  <Text style={styles.resultText}>
                    {`Bu ${result.amount} TL’yi geri kazanmak icin ${formatHours(result.workHours)} calisman gerekir.`}
                  </Text>
                  <Text style={styles.resultText}>
                    {`Hayali alarm: Su an calismaya baslasan, saat ${formatClock(result.finishAt)}’te bitirirdin.`}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {formatWorkDays(result.workHours)} - saatte {result.hourlyRate} TL varsayimi.
                  </Text>
                  <Button
                    title={`${formatHours(result.workHours)} sonra beni uyandir`}
                    onPress={handleScheduleAlarm}
                    loading={alarmBusy}
                    disabled={alarmBusy}
                    variant="gradient"
                    fullWidth
                    size="lg"
                    leftIcon="alarm"
                    style={styles.alarmBtn}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.resultTitle}>Bu turde kazandin gibi gorunuyor.</Text>
                  <Text style={styles.resultText}>
                    {"Ama oran ayni: uzun seride 100 turden ortalama 99’u kayip. Sistem seni oyunda tutmak icin nadir kazanci kullanir."}
                  </Text>
                  <Text style={styles.resultMeta}>
                    Istersen tekrar zari atip oranin nasil isledigini gorebilirsin.
                  </Text>
                </>
              )}
            </LinearGradient>
          ) : null}

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Daha fazla ornek"
              icon="list"
              subtitle={`Saatlik ${hourlyRate} TL hizina gore farkli tutarlarin emek karsiligi.`}
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
                      {example.value} TL
                    </Text>
                    <Text style={[styles.exampleHours, { color: colors.primary }]}>
                      {formatHours(example.workHours)}
                    </Text>
                  </View>
                  <Text style={[styles.exampleHint, { color: colors.textMuted }]}>
                    Simdi baslasan: {formatClock(example.finishAt)} - {formatWorkDays(example.workHours)}
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
  title: "Kumar Borcunu Simule Et",
  subtitle: "Tersine borc: 1 oyun = saatlerce emek",
});
