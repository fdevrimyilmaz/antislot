import { router } from "expo-router";
import React, { useMemo } from "react";
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
import { useProgressStore } from "@/store/progressStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";

const MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;
const WEEKDAY_LABELS = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"] as const;

function getNextMilestone(days: number): number {
  const next = MILESTONES.find((value) => value > days);
  if (next) return next;
  return Math.ceil((days + 1) / 30) * 30;
}

export default function Progress() {
  const { userAddictions, hydrated } = useUserAddictionsStore();
  const { uid } = useUser();
  const { colors } = useTheme();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const resetProgress = useProgressStore((state) => state.reset);
  const progressHydrated = useProgressStore((state) => state.hydrated);

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

  const weeklySeries = useMemo(
    () =>
      WEEKDAY_LABELS.map((label, index) => {
        const daysFromToday = WEEKDAY_LABELS.length - 1 - index;
        const completed = gamblingFreeDays > daysFromToday;
        return {
          label,
          completed,
          height: completed ? 26 + index * 8 : 12,
        };
      }),
    [gamblingFreeDays]
  );

  const completedWeeklyBars = weeklySeries.filter((item) => item.completed).length;
  const weeklyScore = Math.round((completedWeeklyBars / WEEKDAY_LABELS.length) * 100);

  const handleReset = () => {
    if (!uid) {
      Alert.alert("Hata", "Kullanici bulunamadi.");
      return;
    }
    Alert.alert(
      "Ilerlemeyi Sifirla",
      "Bu islem secili bagimlilik sayacini sifirlar.",
      [
        { text: "Iptal", style: "cancel" },
        {
          text: "Sifirla",
          style: "destructive",
          onPress: () => resetProgress(uid),
        },
      ]
    );
  };

  if (!hydrated || !progressHydrated) {
    return (
      <SafeAreaView style={[styles.loader, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>Yukleniyor...</Text>
      </SafeAreaView>
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.primary }]}>← Geri</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Ilerleme Paneli</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Grafiklerle guclendirilmis toparlanma gorunumu
            </Text>
          </View>

          <LinearGradient
            colors={colors.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroLeft}>
              <View style={[styles.streakOuter, { borderColor: "rgba(255,255,255,0.28)" }]}>
                <View style={[styles.streakInner, { backgroundColor: "rgba(255,255,255,0.14)" }]}>
                  <Text style={styles.streakValue}>{gamblingFreeDays}</Text>
                  <Text style={styles.streakLabel}>Temiz Gun</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroRight}>
              <Text style={styles.heroMetricTitle}>Haftalik Momentum</Text>
              <Text style={styles.heroMetricValue}>{weeklyScore}%</Text>
              <Text style={styles.heroMetricHint}>
                Son 7 gunun {completedWeeklyBars} gunu aktif streak icinde.
              </Text>
            </View>
          </LinearGradient>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>7 Gunluk Gorsel Grafik</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Her bar son 7 gun icindeki streak durumunu gosterir.
            </Text>
            <View style={styles.chartRow}>
              {weeklySeries.map((item) => (
                <View key={item.label} style={styles.chartColumn}>
                  <View style={[styles.chartTrack, { backgroundColor: colors.cardBorder }]}>
                    <LinearGradient
                      colors={
                        item.completed
                          ? [colors.primary, colors.accent]
                          : [colors.cardBorder, colors.cardBorder]
                      }
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.chartFill, { height: item.height }]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.milestoneHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Kilometre Taslari</Text>
              <Text style={[styles.milestoneBadge, { color: colors.primary }]}>
                Hedef {nextMilestone} gun
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Bir sonraki hedefe yaklasma oraniniz: %{Math.round(milestoneProgress * 100)}
            </Text>

            <View style={[styles.milestoneTrack, { backgroundColor: colors.cardBorder }]}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.milestoneFill, { width: `${Math.max(4, milestoneProgress * 100)}%` }]}
              />
            </View>

            <View style={styles.milestoneLabels}>
              <Text style={[styles.milestoneLabel, { color: colors.textMuted }]}>{previousMilestone}g</Text>
              <Text style={[styles.milestoneLabel, { color: colors.textMuted }]}>{nextMilestone}g</Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kumar Ilerlemesi</Text>
            {!userAddictions.gambling ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henuz secim yok.</Text>
            ) : (
              <View style={[styles.progressCard, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                <View style={styles.progressRow}>
                  <View>
                    <Text style={[styles.progressTitle, { color: colors.text }]}>Kumar</Text>
                    <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Temiz gun sayaci</Text>
                  </View>
                  <Text style={[styles.progressValue, { color: colors.primary }]}>{gamblingFreeDays}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.progressResetBtn, { backgroundColor: colors.danger }]}
                  onPress={handleReset}
                >
                  <Text style={styles.resetText}>Sayaci Sifirla</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  backBtn: { alignSelf: "flex-start", marginBottom: 10 },
  backText: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 29, fontWeight: "900", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  heroCard: {
    borderRadius: 22,
    padding: 18,
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
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 2,
  },
  chartColumn: { alignItems: "center", flex: 1 },
  chartTrack: {
    height: 96,
    width: "100%",
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: 4,
  },
  chartFill: {
    width: "100%",
    borderRadius: 8,
  },
  chartLabel: { marginTop: 8, fontSize: 11, fontWeight: "600" },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  milestoneBadge: { fontSize: 12, fontWeight: "700" },
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
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  resetText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyText: { fontSize: 13, fontStyle: "italic" },
});
