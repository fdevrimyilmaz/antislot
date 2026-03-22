import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TimeframeId = "1m" | "6m" | "1y" | "3y";
type DimensionKey = "financial" | "mental" | "social" | "selfControl" | "lifeQuality";

const TIMEFRAMES: {
  id: TimeframeId;
  months: number;
  weeks: number;
  labelTr: string;
  labelEn: string;
}[] = [
  { id: "1m", months: 1, weeks: 4, labelTr: "1 ay", labelEn: "1 month" },
  { id: "6m", months: 6, weeks: 26, labelTr: "6 ay", labelEn: "6 months" },
  { id: "1y", months: 12, weeks: 52, labelTr: "1 yil", labelEn: "1 year" },
  { id: "3y", months: 36, weeks: 156, labelTr: "3 yil", labelEn: "3 years" },
];

const DIMENSIONS: {
  key: DimensionKey;
  labelTr: string;
  labelEn: string;
}[] = [
  { key: "financial", labelTr: "Finansal durum", labelEn: "Financial state" },
  { key: "mental", labelTr: "Ruhsal durum", labelEn: "Mental state" },
  { key: "social", labelTr: "Sosyal yasam", labelEn: "Social life" },
  { key: "selfControl", labelTr: "Oz kontrol", labelEn: "Self-control" },
  { key: "lifeQuality", labelTr: "Yasam kalitesi", labelEn: "Life quality" },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type StepperRowProps = {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    card: string;
    background: string;
    border: string;
  };
  label: string;
  hint: string;
  value: number;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
};

function StepperRow({ colors, label, hint, value, unit, onMinus, onPlus }: StepperRowProps) {
  return (
    <View style={[styles.stepperCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.stepperInfo}>
        <Text style={[styles.stepperLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.stepperHint, { color: colors.textSecondary }]}>{hint}</Text>
      </View>
      <View style={[styles.stepperControls, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={onMinus}
        >
          <Text style={[styles.stepperBtnText, { color: colors.text }]}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.stepperValue, { color: colors.primary }]}>{`${value} ${unit}`}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={onPlus}
        >
          <Text style={[styles.stepperBtnText, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FutureSimulatorScreen() {
  const { t, language, locale } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";

  const [timeframe, setTimeframe] = useState<TimeframeId>("1y");
  const [weeklyLoss, setWeeklyLoss] = useState(2500);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(4);
  const [avgSessionMinutes, setAvgSessionMinutes] = useState(70);
  const [existingDebt, setExistingDebt] = useState(12000);
  const [supportLevel, setSupportLevel] = useState(4);

  const selectedFrame = TIMEFRAMES.find((frame) => frame.id === timeframe) ?? TIMEFRAMES[2];

  const result = useMemo(() => {
    const months = selectedFrame.months;
    const weeks = selectedFrame.weeks;
    const monthlyDebtRate = 0.028;

    const projectedLossIfContinue = weeklyLoss * weeks;
    const projectedHoursIfContinue = (sessionsPerWeek * avgSessionMinutes * weeks) / 60;

    const debtInterest = existingDebt * (Math.pow(1 + monthlyDebtRate, months) - 1);
    const debtFromBehavior = projectedLossIfContinue * 0.18;
    const projectedDebtIfContinue = Math.round(existingDebt + debtInterest + debtFromBehavior);

    const savedMoneyIfStop = projectedLossIfContinue;
    const recoveryBudget = Math.round(savedMoneyIfStop * 0.32);
    const debtPaydownPotential = Math.round(Math.min(existingDebt, savedMoneyIfStop * 0.55));
    const projectedDebtIfStop = Math.max(0, Math.round(existingDebt + debtInterest * 0.4 - debtPaydownPotential));

    const regainedHoursIfStop = Math.round(projectedHoursIfContinue * 0.72);

    const financialContinue = clamp(70 - weeklyLoss / 120 - months * 3 - existingDebt / 1600, 8, 76);
    const financialStop = clamp(financialContinue + 26 + supportLevel * 1.8, 20, 97);

    const mentalContinue = clamp(66 - months * 2.8 - sessionsPerWeek * 2.2 + supportLevel * 1.3, 12, 78);
    const mentalStop = clamp(mentalContinue + 28 + supportLevel * 2.2, 20, 98);

    const socialContinue = clamp(68 - months * 2.2 - sessionsPerWeek * 1.7 + supportLevel, 16, 82);
    const socialStop = clamp(socialContinue + 23 + supportLevel * 1.6, 24, 96);

    const selfControlContinue = clamp(64 - months * 2.9 - sessionsPerWeek * 2.5 + supportLevel * 1.2, 10, 76);
    const selfControlStop = clamp(selfControlContinue + 30 + supportLevel * 1.8, 22, 99);

    const lifeQualityContinue = clamp(
      (financialContinue + mentalContinue + socialContinue + selfControlContinue) / 4 - 5,
      10,
      82
    );
    const lifeQualityStop = clamp(
      (financialStop + mentalStop + socialStop + selfControlStop) / 4 + 2,
      24,
      99
    );

    const dimensions: Record<DimensionKey, { continue: number; stop: number }> = {
      financial: { continue: financialContinue, stop: financialStop },
      mental: { continue: mentalContinue, stop: mentalStop },
      social: { continue: socialContinue, stop: socialStop },
      selfControl: { continue: selfControlContinue, stop: selfControlStop },
      lifeQuality: { continue: lifeQualityContinue, stop: lifeQualityStop },
    };

    const avgContinue = Math.round(
      Object.values(dimensions).reduce((sum, item) => sum + item.continue, 0) / Object.values(dimensions).length
    );
    const avgStop = Math.round(
      Object.values(dimensions).reduce((sum, item) => sum + item.stop, 0) / Object.values(dimensions).length
    );

    return {
      projectedLossIfContinue,
      projectedHoursIfContinue: Math.round(projectedHoursIfContinue),
      projectedDebtIfContinue,
      savedMoneyIfStop,
      regainedHoursIfStop,
      recoveryBudget,
      debtPaydownPotential,
      projectedDebtIfStop,
      dimensions,
      avgContinue,
      avgStop,
      avgGap: avgStop - avgContinue,
    };
  }, [
    avgSessionMinutes,
    existingDebt,
    selectedFrame.months,
    selectedFrame.weeks,
    sessionsPerWeek,
    supportLevel,
    weeklyLoss,
  ]);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: isTr ? "TRY" : "USD",
        maximumFractionDigits: 0,
      }),
    [isTr, locale]
  );

  const continueColor = "#B91C1C";
  const stopColor = "#0F766E";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.exploreModules.futureSimulator.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.exploreModules.futureSimulator.subtitle}
          </Text>

          {/* Graphic: Scenario Comparison Chart */}
          <View style={[styles.chartContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              {isTr ? "Senaryo Karsilastirmasi" : "Scenario Comparison"}
            </Text>
            <View style={styles.chartRow}>
              <View style={styles.chartColumn}>
                <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.barFill, { height: `${result.avgContinue}%`, backgroundColor: continueColor, opacity: 0.9 }]} />
                </View>
                <Text style={[styles.chartValue, { color: continueColor }]}>{result.avgContinue}</Text>
                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{isTr ? "Devam" : "Continue"}</Text>
              </View>

              <View style={styles.gapContainer}>
                <Text style={[styles.gapValue, { color: colors.primary }]}>{`+${result.avgGap}`}</Text>
                <Text style={[styles.gapLabel, { color: colors.textSecondary }]}>{isTr ? "Fark" : "Gap"}</Text>
              </View>

              <View style={styles.chartColumn}>
                <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.barFill, { height: `${result.avgStop}%`, backgroundColor: stopColor, opacity: 0.9 }]} />
                </View>
                <Text style={[styles.chartValue, { color: stopColor }]}>{result.avgStop}</Text>
                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{isTr ? "Dur" : "Stop"}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isTr ? "Zaman dilimi" : "Timeframe"}</Text>
          <View style={styles.chipRow}>
            {TIMEFRAMES.map((frame) => {
              const active = frame.id === timeframe;
              return (
                <TouchableOpacity
                  key={frame.id}
                  style={[
                    styles.chip,
                    {
                      borderColor: colors.border,
                      backgroundColor: active ? colors.primary : colors.background,
                    },
                  ]}
                  onPress={() => setTimeframe(frame.id)}
                >
                  <Text style={[styles.chipText, { color: active ? "#FFFFFF" : colors.text }]}>
                    {isTr ? frame.labelTr : frame.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isTr ? "Kisisel girdiler" : "Personal inputs"}
          </Text>

          <View style={styles.inputsGrid}>
            <StepperRow
            colors={colors}
            label={isTr ? "Haftalik kayip" : "Weekly loss"}
            hint={isTr ? "Ortalama para cikisi" : "Average money out"}
            value={weeklyLoss}
            unit={isTr ? "TL" : "USD"}
            onMinus={() => setWeeklyLoss((value) => Math.max(200, value - 200))}
            onPlus={() => setWeeklyLoss((value) => Math.min(100000, value + 200))}
          />
          <StepperRow
            colors={colors}
            label={isTr ? "Haftalik seans" : "Sessions per week"}
            hint={isTr ? "Riskli oturum sayisi" : "Risk session count"}
            value={sessionsPerWeek}
            unit={isTr ? "seans" : "sessions"}
            onMinus={() => setSessionsPerWeek((value) => Math.max(1, value - 1))}
            onPlus={() => setSessionsPerWeek((value) => Math.min(21, value + 1))}
          />
          <StepperRow
            colors={colors}
            label={isTr ? "Ortalama seans suresi" : "Average session duration"}
            hint={isTr ? "Dakika bazli" : "Minutes"}
            value={avgSessionMinutes}
            unit={isTr ? "dk" : "min"}
            onMinus={() => setAvgSessionMinutes((value) => Math.max(10, value - 10))}
            onPlus={() => setAvgSessionMinutes((value) => Math.min(300, value + 10))}
          />
          <StepperRow
            colors={colors}
            label={isTr ? "Mevcut borc" : "Existing debt"}
            hint={isTr ? "Tahmini toplam borc" : "Estimated total debt"}
            value={existingDebt}
            unit={isTr ? "TL" : "USD"}
            onMinus={() => setExistingDebt((value) => Math.max(0, value - 1000))}
            onPlus={() => setExistingDebt((value) => Math.min(2_000_000, value + 1000))}
          />
          <StepperRow
            colors={colors}
            label={isTr ? "Destek seviyesi" : "Support level"}
            hint={isTr ? "1 dusuk - 10 yuksek" : "1 low - 10 high"}
            value={supportLevel}
            unit="/10"
            onMinus={() => setSupportLevel((value) => Math.max(1, value - 1))}
            onPlus={() => setSupportLevel((value) => Math.min(10, value + 1))}
          />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isTr ? "Projeksiyon ozeti" : "Projection summary"}
          </Text>

          <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.summaryTitle, { color: continueColor }]}>
              {isTr ? "Devam edersen" : "If you continue"}
            </Text>
            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
              {isTr ? "Tahmini kayip" : "Estimated loss"}: {currency.format(result.projectedLossIfContinue)}
            </Text>
            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
              {isTr ? "Tahmini zaman kaybi" : "Estimated time loss"}: {result.projectedHoursIfContinue}{" "}
              {isTr ? "saat" : "hours"}
            </Text>
            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
              {isTr ? "Tahmini toplam borc" : "Projected total debt"}: {currency.format(result.projectedDebtIfContinue)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.summaryTitle, { color: stopColor }]}>
              {isTr ? "Bugun durursan" : "If you stop today"}
            </Text>
            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
              {isTr ? "Korunan para" : "Money protected"}: {currency.format(result.savedMoneyIfStop)}
            </Text>
            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
              {isTr ? "Geri kazanilan zaman" : "Time regained"}: {result.regainedHoursIfStop}{" "}
              {isTr ? "saat" : "hours"}
            </Text>
            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
              {isTr ? "Borc azaltma potansiyeli" : "Debt paydown potential"}: {currency.format(result.debtPaydownPotential)}
            </Text>
            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
              {isTr ? "Iyilesme butcesi" : "Recovery budget"}: {currency.format(result.recoveryBudget)}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isTr ? "Boyut bazli karsilastirma" : "Dimension comparison"}
          </Text>
          <View style={styles.dimensionList}>
            {DIMENSIONS.map((dimension) => {
              const score = result.dimensions[dimension.key];
              const delta = Math.round(score.stop - score.continue);
              return (
                <View
                  key={dimension.key}
                  style={[styles.dimensionCard, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
                  <View style={styles.dimensionHeader}>
                    <Text style={[styles.dimensionLabel, { color: colors.text }]}>
                      {isTr ? dimension.labelTr : dimension.labelEn}
                    </Text>
                    <Text style={[styles.dimensionDelta, { color: stopColor }]}>{`+${delta}`}</Text>
                  </View>

                  <View style={styles.metricRow}>
                    <Text style={[styles.metricTag, { color: continueColor }]}>{isTr ? "DEVAM" : "CONTINUE"}</Text>
                    <View style={[styles.track, { backgroundColor: colors.border }]}>
                      <View style={[styles.fill, { width: `${score.continue}%`, backgroundColor: continueColor }]} />
                    </View>
                    <Text style={[styles.metricValue, { color: colors.textSecondary }]}>{Math.round(score.continue)}</Text>
                  </View>

                  <View style={styles.metricRow}>
                    <Text style={[styles.metricTag, { color: stopColor }]}>{isTr ? "DUR" : "STOP"}</Text>
                    <View style={[styles.track, { backgroundColor: colors.border }]}>
                      <View style={[styles.fill, { width: `${score.stop}%`, backgroundColor: stopColor }]} />
                    </View>
                    <Text style={[styles.metricValue, { color: colors.textSecondary }]}>{Math.round(score.stop)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isTr ? "Aksiyon listesi" : "Action list"}
          </Text>
          <View style={styles.actionList}>
            <Text style={[styles.actionItem, { color: colors.textSecondary, borderColor: colors.border, backgroundColor: colors.background }]}>
              {`1. ${
                isTr
                  ? `${isTr ? selectedFrame.labelTr : selectedFrame.labelEn} hedefinde haftalik kaybi ${currency.format(
                      Math.round(weeklyLoss * 0.75)
                    )} altina cekmeyi dene.`
                  : `For this ${selectedFrame.labelEn} horizon, try reducing weekly loss below ${currency.format(
                      Math.round(weeklyLoss * 0.75)
                    )}.`
              }`}
            </Text>
            <Text style={[styles.actionItem, { color: colors.textSecondary, borderColor: colors.border, backgroundColor: colors.background }]}>
              {`2. ${
                isTr
                  ? `Korunacak para icin otomatik guvenli hesap transferi ayarla (oneri: ${currency.format(result.recoveryBudget)}).`
                  : `Set an automatic safe-account transfer (suggested: ${currency.format(result.recoveryBudget)}).`
              }`}
            </Text>
            <Text style={[styles.actionItem, { color: colors.textSecondary, borderColor: colors.border, backgroundColor: colors.background }]}>
              {`3. ${
                isTr
                  ? `Destek seviyesini ${supportLevel}/10 seviyesinden ${Math.min(10, supportLevel + 2)}/10 seviyesine cikaracak bir kisi/profesyonel planla.`
                  : `Plan one person/professional step to move support from ${supportLevel}/10 to ${Math.min(10, supportLevel + 2)}/10.`
              }`}
            </Text>
          </View>
        </View>

        <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
          {isTr
            ? "Bu simulator davranis girdilerine dayali tahmini senaryo sunar; profesyonel tibbi, hukuki veya finansal tavsiyenin yerine gecmez."
            : "This simulator provides scenario estimates from behavior inputs and does not replace professional medical, legal, or financial advice."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 12,
  },
  chartContainer: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: 4,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 12,
    textAlign: "center",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 32,
    height: 140,
  },
  chartColumn: {
    alignItems: "center",
    width: 60,
  },
  barTrack: {
    width: 32,
    height: 80,
    borderRadius: Radius.full,
    justifyContent: "flex-end",
    marginBottom: 8,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: Radius.full,
  },
  chartValue: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 2,
  },
  chartLabel: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  gapContainer: {
    alignItems: "center",
    paddingBottom: 24,
  },
  gapValue: {
    fontSize: 20,
    fontFamily: Fonts.display,
    marginBottom: 2,
  },
  gapLabel: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  scoreBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: Fonts.display,
    lineHeight: 34,
    marginTop: 4,
  },
  section: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  inputsGrid: {
    gap: 12,
  },
  stepperCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  stepperInfo: {
    flex: 1,
    paddingRight: 8,
  },
  stepperLabel: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 2,
  },
  stepperHint: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius.full,
    padding: 2,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  stepperValue: {
    minWidth: 78,
    textAlign: "center",
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  summaryItem: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
    marginBottom: 4,
  },
  dimensionList: {
    gap: 10,
  },
  dimensionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  dimensionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dimensionLabel: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  dimensionDelta: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metricTag: {
    width: 68,
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  metricValue: {
    width: 34,
    textAlign: "right",
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  actionList: {
    gap: 8,
  },
  actionItem: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 13,
    lineHeight: 22,
    fontFamily: Fonts.body,
    overflow: "hidden",
  },
  footerNote: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});
