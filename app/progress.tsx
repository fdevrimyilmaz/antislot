import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useProgressStore } from "@/store/progressStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { PremiumBarChart } from "@/components/ui/premium-bar-chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { getPremiumState } from "@/store/premiumStore";
import { reportError } from "@/services/monitoring";

const MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;
const WEEK_DAYS = 7;
const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
const BAR_COMPLETED = 92;
const BAR_PENDING = 12;

function getNextMilestone(days: number): number {
  const next = MILESTONES.find((value) => value > days);
  if (next) return next;
  return Math.ceil((days + 1) / 30) * 30;
}

const ADVANCED_STAT_TEASERS: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
}[] = [
  {
    icon: "calendar-number",
    title: "Saatlik Aktivite Analizi",
    description: "Dürtülerin günün hangi saatlerinde yoğunlaştığını gör.",
  },
  {
    icon: "git-network",
    title: "Tetikleyici Haritası",
    description: "Stres, yalnızlık veya reklam — hangisi seni en çok etkiliyor?",
  },
  {
    icon: "wallet",
    title: "Tasarruf Hesaplaması",
    description: "Temiz günlerinde biriken yaklaşık tutarı izle.",
  },
  {
    icon: "trending-up",
    title: "Streak Yıl Görünümü",
    description: "GitHub takvimi gibi yıllık ısı haritası.",
  },
];

export default function Progress() {
  const { userAddictions, hydrated } = useUserAddictionsStore();
  const { uid } = useUser();
  const { colors } = useTheme();
  const toast = useToast();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const resetProgress = useProgressStore((state) => state.reset);
  const progressHydrated = useProgressStore((state) => state.hydrated);
  const [premiumActive, setPremiumActive] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const state = await getPremiumState();
        if (active) setPremiumActive(state.isActive);
      } catch (error) {
        reportError(error, { scope: "progress.premium", level: "warning" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const nextMilestone = useMemo(
    () => getNextMilestone(Math.max(0, gamblingFreeDays)),
    [gamblingFreeDays]
  );
  const previousMilestone = useMemo(
    () => MILESTONES.slice().reverse().find((value) => value <= gamblingFreeDays) ?? 0,
    [gamblingFreeDays]
  );
  const milestoneSpan = Math.max(1, nextMilestone - previousMilestone);
  const milestoneProgress = Math.min(
    1,
    Math.max(0, (gamblingFreeDays - previousMilestone) / milestoneSpan)
  );

  const weeklySeries = useMemo(() => {
    const todayWeekday = new Date().getDay();
    return Array.from({ length: WEEK_DAYS }, (_, index) => {
      const daysFromToday = WEEK_DAYS - 1 - index;
      const completed = gamblingFreeDays > daysFromToday;
      const weekday = (todayWeekday - daysFromToday + 7) % 7;
      const labelIndex = (weekday + 6) % 7;
      const label = WEEKDAY_LABELS[labelIndex];
      return {
        key: `weekly-${index}`,
        label,
        value: completed ? BAR_COMPLETED : BAR_PENDING,
        completed,
        inactive: !completed,
        valueLabel: completed ? "✓" : "–",
      };
    });
  }, [gamblingFreeDays]);

  const completedWeeklyBars = weeklySeries.filter((item) => item.completed).length;
  const weeklyScore = Math.round((completedWeeklyBars / WEEK_DAYS) * 100);

  const handleReset = () => {
    if (!uid) {
      haptics.error();
      toast.error("Kullanıcı bulunamadı.", "Hata");
      return;
    }
    haptics.warning();
    Alert.alert(
      "İlerlemeyi Sıfırla",
      "Bu işlem seçili bağımlılık sayacını sıfırlar.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: async () => {
            await resetProgress(uid);
            haptics.success();
          },
        },
      ]
    );
  };

  if (!hydrated || !progressHydrated) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView
          style={styles.container}
          accessible
          accessibilityLabel="İlerleme verisi yükleniyor"
          accessibilityState={{ busy: true }}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Skeleton width={60} height={16} radius={6} style={styles.skelBack} />
              <Skeleton width="60%" height={28} radius={8} style={styles.skelTitle} />
              <Skeleton width="80%" height={14} radius={6} />
            </View>

            <Card variant="hero" padding={18} style={styles.heroCard}>
              <View style={styles.heroLeft}>
                <Skeleton width={122} height={122} radius={61} />
              </View>
              <View style={styles.heroRight}>
                <Skeleton width="70%" height={12} radius={6} />
                <Skeleton width="40%" height={28} radius={8} style={styles.skelHeroMetric} />
                <Skeleton width="90%" height={12} radius={6} />
              </View>
            </Card>

            <Card padding={18} style={styles.section}>
              <Skeleton width="50%" height={16} radius={6} />
              <Skeleton width="80%" height={12} radius={6} style={styles.skelSubtitle} />
              <Skeleton width="100%" height={128} radius={12} style={styles.skelChart} />
            </Card>

            <Card padding={18} style={styles.section}>
              <Skeleton width="50%" height={16} radius={6} />
              <Skeleton width="70%" height={12} radius={6} style={styles.skelSubtitle} />
              <Skeleton width="100%" height={14} radius={999} style={styles.skelChart} />
            </Card>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.primary}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.backText, { color: colors.primary }]}>Geri</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
              İlerleme Paneli
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Grafiklerle güçlendirilmiş toparlanma görünümü
            </Text>
          </View>

          <Card variant="hero" padding={18} style={styles.heroCard}>
            <View style={styles.heroLeft}>
              <View
                style={[styles.streakOuter, { borderColor: "rgba(255,255,255,0.28)" }]}
                accessible
                accessibilityLabel={`${gamblingFreeDays} temiz gün`}
              >
                <View style={[styles.streakInner, { backgroundColor: "rgba(255,255,255,0.14)" }]}>
                  <Text style={styles.streakValue}>{gamblingFreeDays}</Text>
                  <Text style={styles.streakLabel}>Temiz Gün</Text>
                </View>
              </View>
            </View>

            <View
              style={styles.heroRight}
              accessible
              accessibilityLabel={`Haftalık Momentum: yüzde ${weeklyScore}. Son 7 günün ${completedWeeklyBars} günü aktif streak içinde.`}
            >
              <Text style={styles.heroMetricTitle}>Haftalık Momentum</Text>
              <Text style={styles.heroMetricValue}>{weeklyScore}%</Text>
              <Text style={styles.heroMetricHint}>
                Son 7 günün {completedWeeklyBars} günü aktif streak içinde.
              </Text>
            </View>
          </Card>

          <Card padding={18} style={styles.section}>
            <SectionHeader
              title="Son 7 Gün"
              icon="bar-chart"
              subtitle={`Streak içindeki günler: ${completedWeeklyBars}/${WEEK_DAYS}`}
            />
            <PremiumBarChart
              data={weeklySeries}
              colors={colors}
              chartHeight={128}
              highlightPeak={false}
            />
          </Card>

          <Card padding={18} style={styles.section}>
            <SectionHeader
              title="Kilometre Taşları"
              icon="flag"
              subtitle={`Bir sonraki hedefe yaklaşma oranınız: %${Math.round(milestoneProgress * 100)}`}
              meta={`Hedef ${nextMilestone} gün`}
            />

            <View style={[styles.milestoneTrack, { backgroundColor: colors.cardBorder }]}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.milestoneFill, { width: `${Math.max(4, milestoneProgress * 100)}%` }]}
              />
            </View>

            <View style={styles.milestoneLabels}>
              <Text
                style={[styles.milestoneLabel, { color: colors.textMuted }]}
                accessibilityLabel={`${previousMilestone} gün`}
              >
                {previousMilestone}g
              </Text>
              <Text
                style={[styles.milestoneLabel, { color: colors.textMuted }]}
                accessibilityLabel={`${nextMilestone} gün`}
              >
                {nextMilestone}g
              </Text>
            </View>
          </Card>

          <Card padding={18} style={styles.section}>
            <SectionHeader title="Kumar İlerlemesi" icon="trending-up" />
            {!userAddictions.gambling ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz seçim yok.</Text>
            ) : (
              <View
                style={[
                  styles.progressCard,
                  { backgroundColor: colors.background, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.progressRow}>
                  <View>
                    <Text style={[styles.progressTitle, { color: colors.text }]}>Kumar</Text>
                    <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                      Temiz gün sayacı
                    </Text>
                  </View>
                  <Text style={[styles.progressValue, { color: colors.primary }]}>
                    {gamblingFreeDays}
                  </Text>
                </View>
                <Button
                  title="Sayacı Sıfırla"
                  onPress={handleReset}
                  variant="destructive"
                  fullWidth
                  leftIcon="refresh"
                  style={styles.progressResetBtn}
                />
              </View>
            )}
          </Card>

          {/* Premium-locked Advanced Stats */}
          <Card padding={0} style={[styles.section, styles.advancedStatsCard]}>
            <LinearGradient
              colors={
                premiumActive
                  ? [`${colors.primary}1A`, `${colors.accent}10`]
                  : ["rgba(245, 158, 11, 0.10)", "rgba(255, 208, 116, 0.04)"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.advancedStatsInner}
            >
              <View style={styles.advancedHeader}>
                <View style={styles.advancedTitleRow}>
                  <View
                    style={[
                      styles.advancedIconWrap,
                      {
                        backgroundColor: premiumActive
                          ? `${colors.primary}22`
                          : "rgba(245, 158, 11, 0.18)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={premiumActive ? "analytics" : "lock-closed"}
                      size={18}
                      color={premiumActive ? colors.primary : colors.warning}
                    />
                  </View>
                  <View style={styles.advancedTitleText}>
                    <Text style={[styles.advancedTitle, { color: colors.text }]}>
                      Gelişmiş İstatistikler
                    </Text>
                    <Text style={[styles.advancedHint, { color: colors.textMuted }]}>
                      {premiumActive
                        ? "Detaylı içgörüler ve haritalar."
                        : "Premium ile derinleşmiş içgörüler aç."}
                    </Text>
                  </View>
                </View>
                {!premiumActive ? (
                  <View
                    style={[
                      styles.premiumPill,
                      { backgroundColor: colors.warning, shadowColor: colors.warning },
                    ]}
                  >
                    <Ionicons name="diamond" size={11} color="#FFFFFF" />
                    <Text style={styles.premiumPillText}>PREMIUM</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.teaserList}>
                {ADVANCED_STAT_TEASERS.map((teaser) => (
                  <View key={teaser.title} style={styles.teaserRow}>
                    <View
                      style={[
                        styles.teaserIconWrap,
                        {
                          backgroundColor: premiumActive
                            ? `${colors.primary}14`
                            : "rgba(255, 208, 116, 0.16)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={teaser.icon}
                        size={14}
                        color={premiumActive ? colors.primary : colors.warning}
                      />
                    </View>
                    <View style={styles.teaserTextWrap}>
                      <Text style={[styles.teaserTitle, { color: colors.text }]}>
                        {teaser.title}
                      </Text>
                      <Text style={[styles.teaserDesc, { color: colors.textMuted }]}>
                        {teaser.description}
                      </Text>
                    </View>
                    {!premiumActive ? (
                      <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    )}
                  </View>
                ))}
              </View>

              {!premiumActive ? (
                <Button
                  title="Kilidi Aç"
                  onPress={() => {
                    haptics.tapMedium();
                    router.push("/premium");
                  }}
                  variant="gradient"
                  size="lg"
                  fullWidth
                  leftIcon="diamond"
                  style={styles.unlockButton}
                />
              ) : null}
            </LinearGradient>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 22, paddingBottom: 36, gap: 16 },
  header: { marginBottom: 4 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backText: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 29, fontWeight: "900", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  heroLeft: { marginRight: 16 },
  streakOuter: {
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  streakInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  streakValue: { color: "#FFFFFF", fontSize: 34, fontWeight: "900" },
  streakLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", opacity: 0.95 },
  heroRight: { flex: 1 },
  heroMetricTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", opacity: 0.9 },
  heroMetricValue: { color: "#FFFFFF", fontSize: 32, fontWeight: "900", marginVertical: 4 },
  heroMetricHint: { color: "#FFFFFF", fontSize: 12, lineHeight: 18, opacity: 0.9 },
  section: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  milestoneTrack: {
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  milestoneFill: { height: "100%", minWidth: 14, borderRadius: 999 },
  milestoneLabels: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  milestoneLabel: { fontSize: 12, fontWeight: "600" },
  progressCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitle: { fontSize: 15, fontWeight: "800" },
  progressLabel: { fontSize: 12, marginTop: 3 },
  progressValue: { fontSize: 30, fontWeight: "900" },
  progressResetBtn: {
    marginTop: 12,
  },
  emptyText: { fontSize: 13, fontStyle: "italic" },
  advancedStatsCard: {
    overflow: "hidden",
  },
  advancedStatsInner: {
    padding: 18,
  },
  advancedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  advancedTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  advancedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  advancedTitleText: { flex: 1, minWidth: 0 },
  advancedTitle: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  advancedHint: { fontSize: 12, lineHeight: 16 },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  premiumPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  teaserList: {
    gap: 10,
    marginBottom: 14,
  },
  teaserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  teaserIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  teaserTextWrap: { flex: 1, minWidth: 0 },
  teaserTitle: { fontSize: 13, fontWeight: "700", marginBottom: 1 },
  teaserDesc: { fontSize: 11, lineHeight: 15 },
  unlockButton: {
    marginTop: 4,
  },
  skelBack: { marginBottom: 10 },
  skelTitle: { marginBottom: 8 },
  skelHeroMetric: { marginVertical: 6 },
  skelSubtitle: { marginTop: 8 },
  skelChart: { marginTop: 14 },
});
