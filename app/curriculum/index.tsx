import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import {
  PHASE_LABELS,
  RECOVERY_DAYS,
  TOTAL_DAYS,
  type CurriculumDay,
} from "@/app/data/recoveryCurriculum";
import {
  getNextDay,
  progressPct,
  useCurriculumStore,
} from "@/store/curriculumStore";
import { haptics } from "@/services/haptics";

export default function CurriculumHub() {
  const { colors } = useTheme();
  const { state, hydrated, hydrate, start } = useCurriculumStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const nextDay = useMemo(() => getNextDay(state), [state]);
  const pct = useMemo(() => progressPct(state), [state]);

  const todaysCard = RECOVERY_DAYS.find((d) => d.day === nextDay);
  const completedSet = useMemo(
    () => new Set(state.completed),
    [state.completed]
  );

  const handleStart = async () => {
    haptics.tapMedium();
    await start();
    router.push(`/curriculum/${nextDay}` as never);
  };

  const handleOpenDay = (day: number) => {
    haptics.tapLight();
    router.push(`/curriculum/${day}` as never);
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ThemeTexture
        primary={colors.primary}
        secondary={colors.secondary}
        accent={colors.accent}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            30 Günlük Yol
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Günlük 4–6 dakika · klinik gözlem temelli yapılandırılmış bir
            iyileşme yolculuğu.
          </Text>

          {/* Hero progress */}
          <Card variant="hero" padding={22} style={styles.heroCard}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="leaf" size={14} color="#FFFFFF" />
                <Text style={styles.heroBadgeText}>İLERLEMEN</Text>
              </View>
            </View>
            <Text style={styles.heroBig}>
              {state.completed.length} / {TOTAL_DAYS}
            </Text>
            <Text style={styles.heroSub}>gün tamamlandı</Text>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.heroProgressMeta}>{pct}%</Text>
          </Card>

          {/* Today's lesson */}
          {todaysCard ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title={
                  state.completed.length === 0
                    ? "Hadi başla"
                    : "Sıradaki gün"
                }
                icon="play-circle"
                meta={`${todaysCard.durationMin} dk`}
              />
              <View style={styles.todayHeader}>
                <View
                  style={[
                    styles.dayBadge,
                    {
                      backgroundColor: PHASE_LABELS[todaysCard.phase].color,
                    },
                  ]}
                >
                  <Text style={styles.dayBadgeText}>{todaysCard.day}</Text>
                </View>
                <View style={styles.todayText}>
                  <Text style={[styles.todayTitle, { color: colors.text }]}>
                    {todaysCard.title}
                  </Text>
                  <Text
                    style={[styles.todaySummary, { color: colors.textMuted }]}
                  >
                    {todaysCard.summary}
                  </Text>
                </View>
              </View>
              <Button
                title={
                  state.completed.length === 0 ? "Yolculuğu başlat" : "Bugünü aç"
                }
                onPress={handleStart}
                variant="primary"
                fullWidth
                leftIcon="arrow-forward"
                style={styles.todayBtn}
              />
            </Card>
          ) : null}

          {/* Timeline */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Tüm günler"
              icon="list"
              subtitle="Daha önceki günleri ziyaret edebilir, içeriği tekrar okuyabilirsin."
            />
            <View style={styles.timeline}>
              {RECOVERY_DAYS.map((d) => (
                <TimelineRow
                  key={d.day}
                  day={d}
                  completed={completedSet.has(d.day)}
                  isNext={d.day === nextDay}
                  onPress={() => handleOpenDay(d.day)}
                />
              ))}
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type TimelineRowProps = {
  day: CurriculumDay;
  completed: boolean;
  isNext: boolean;
  onPress: () => void;
};

function TimelineRow({ day, completed, isNext, onPress }: TimelineRowProps) {
  const { colors } = useTheme();
  const phase = PHASE_LABELS[day.phase];
  const accent = completed ? colors.success : isNext ? colors.primary : colors.textMuted;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Gün ${day.day}: ${day.title}${completed ? " — tamamlandı" : ""}`}
      style={[
        styles.timelineRow,
        {
          backgroundColor: isNext ? `${colors.primary}10` : colors.card,
          borderColor: isNext ? colors.primary : colors.cardBorder,
        },
      ]}
    >
      <View
        style={[
          styles.timelineDot,
          { backgroundColor: completed ? colors.success : phase.color },
        ]}
      >
        {completed ? (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        ) : (
          <Text style={styles.timelineDotText}>{day.day}</Text>
        )}
      </View>
      <View style={styles.timelineText}>
        <View style={styles.timelineTopRow}>
          <Text style={[styles.timelineTitle, { color: colors.text }]} numberOfLines={1}>
            {day.title}
          </Text>
          <Text style={[styles.timelinePhase, { color: phase.color }]}>
            {phase.label}
          </Text>
        </View>
        <Text
          style={[styles.timelineSummary, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {day.summary}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={accent} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 22, paddingBottom: 60 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 18 },

  heroCard: { marginBottom: 14, alignItems: "center" },
  heroBadgeRow: { width: "100%", alignItems: "center", marginBottom: 14 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  heroBig: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  heroProgressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: 16,
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  heroProgressMeta: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },

  cardSpacing: { marginBottom: 14 },

  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  dayBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 20,
  },
  todayText: { flex: 1, minWidth: 0 },
  todayTitle: { fontSize: 17, fontWeight: "800" },
  todaySummary: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  todayBtn: { marginTop: 4 },

  timeline: { gap: 8 },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timelineDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  timelineText: { flex: 1, minWidth: 0 },
  timelineTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  timelineTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  timelinePhase: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  timelineSummary: { fontSize: 12, marginTop: 2 },
});
