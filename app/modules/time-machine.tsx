import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { useProgressStore } from "@/store/progressStore";
import { daysSince } from "@/services/progress";
import { withPremiumGate } from "@/components/ui/premium-gate";

/**
 * Time Machine — concrete time-cost visualization.
 *
 * Idea: ask the user once for their past gambling rhythm (avg hours/day,
 * months of habit). With those two numbers we compute two things:
 *
 *   1. LOST hours — the total they spent before recovery started. Big,
 *      shocking, ideally encourages reflection without inducing shame.
 *   2. RECLAIMED hours — every clean day since `streakStartedAt`, multiplied
 *      by the same daily average. Grows organically, ties into the streak.
 *
 * Each comparison ("Savaş ve Barış'ı oku — 50 saat") is unlocked as the
 * reclaimed total crosses its hour threshold, so the screen evolves with
 * the user. Comparisons over the reclaimed total stay visible but
 * locked, giving them a "what's next" carrot.
 */

const STORAGE_KEY = "antislot_time_machine_input_v1";

interface TimeMachineInput {
  hoursPerDay: number;
  monthsSpent: number;
}

const HOURS_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12] as const;
const MONTH_OPTIONS = [
  { months: 6, label: "6 ay" },
  { months: 12, label: "1 yıl" },
  { months: 24, label: "2 yıl" },
  { months: 36, label: "3 yıl" },
  { months: 60, label: "5 yıl" },
  { months: 120, label: "10 yıl" },
  { months: 240, label: "20 yıl" },
] as const;

type ComparisonCategory = "kultur" | "beceri" | "fiziksel" | "yaratici";

interface Comparison {
  id: string;
  emoji: string;
  title: string;
  hint: string;
  hours: number;
  category: ComparisonCategory;
}

/**
 * Comparison library — sorted ascending by hours so the unlock progression
 * is monotonic. Numbers are rough, defensible estimates; not gospel.
 */
const COMPARISONS: Comparison[] = [
  { id: "mindfulness", emoji: "🧘", title: "Mindfulness alışkanlığı", hint: "Günde 10 dk × 90 gün", hours: 15, category: "fiziksel" },
  { id: "20-recipes", emoji: "🍳", title: "20 yeni yemek tarifi pişir", hint: "Mutfak repertuvarın genişler", hours: 40, category: "beceri" },
  { id: "war-and-peace", emoji: "📖", title: "Savaş ve Barış'ı oku", hint: "Tolstoy — 1500 sayfa", hours: 50, category: "kultur" },
  { id: "yoga-routine", emoji: "🧘‍♂️", title: "Düzenli yoga rutini", hint: "Esneklik + uyku düzeni", hours: 60, category: "fiziksel" },
  { id: "5k-runner", emoji: "🏃", title: "5K koşusuna hazırlan", hint: "Sıfırdan başlayarak", hours: 60, category: "fiziksel" },
  { id: "touch-typing", emoji: "⌨️", title: "Hızlı klavye yazımı 80wpm", hint: "İş hayatında zaman kazandırır", hours: 60, category: "beceri" },
  { id: "lotr", emoji: "🧙", title: "Yüzüklerin Efendisi külliyatı", hint: "Üç kitap + üç film", hours: 80, category: "kultur" },
  { id: "drawing-basics", emoji: "🎨", title: "Temel resim becerileri", hint: "10 eser portfolyo", hours: 100, category: "yaratici" },
  { id: "guitar-songs", emoji: "🎸", title: "Gitarla 10 şarkı çal", hint: "Akorlar + ritm + 10 parça", hours: 120, category: "yaratici" },
  { id: "photography", emoji: "📷", title: "Fotoğrafçılık temelleri", hint: "Kompozisyon + ışık + 50 çekim", hours: 150, category: "yaratici" },
  { id: "language-a2", emoji: "🌍", title: "Yeni bir dil — A2 seviye", hint: "Tatilde derdini anlatırsın", hours: 200, category: "beceri" },
  { id: "half-marathon", emoji: "🏅", title: "Yarı maraton hazırlığı", hint: "21 km koşabilir hale gel", hours: 250, category: "fiziksel" },
  { id: "python-basics", emoji: "💻", title: "Python programlama temeli", hint: "Veri analizi yapabilir seviye", hours: 250, category: "beceri" },
  { id: "guitar-stage", emoji: "🎤", title: "Sahne seviyesi gitar", hint: "30 şarkılı set list", hours: 300, category: "yaratici" },
  { id: "cooking-pro", emoji: "👨‍🍳", title: "Profesyonel mutfak becerileri", hint: "50 yemek + sunum", hours: 300, category: "beceri" },
  { id: "language-b1", emoji: "🗣️", title: "Yeni bir dil — B1 konuşma", hint: "İşte / seyahatte rahat", hours: 400, category: "beceri" },
  { id: "write-book", emoji: "✍️", title: "Bir kitap yaz", hint: "60.000 kelime — ilk taslak", hours: 500, category: "yaratici" },
  { id: "marathon", emoji: "🏃‍♀️", title: "Maraton koşma hedefi", hint: "42 km — bitir + topla", hours: 600, category: "fiziksel" },
  { id: "language-c1", emoji: "🎓", title: "Yeni bir dil — akıcı (C1)", hint: "Hayatın bir parçası olur", hours: 1000, category: "beceri" },
];

const CATEGORY_LABEL: Record<ComparisonCategory, string> = {
  kultur: "KÜLTÜR",
  beceri: "BECERİ",
  fiziksel: "FİZİKSEL",
  yaratici: "YARATICI",
};

function formatHours(hours: number): string {
  if (hours < 1) return "< 1 saat";
  if (hours < 100) return `${Math.round(hours)} saat`;
  return `${Math.round(hours).toLocaleString("tr-TR")} saat`;
}

/**
 * Time bins so a huge "lost" number reads as a sentence, not a raw integer.
 * 8760 hours = 1 year.
 */
function describeBigTime(hours: number): string {
  if (hours < 24) return `${Math.round(hours)} saat`;
  if (hours < 24 * 30) {
    const days = Math.round(hours / 24);
    return `${days} gün`;
  }
  if (hours < 8760) {
    const months = Math.round(hours / (24 * 30));
    return `${months} ay`;
  }
  const years = (hours / 8760).toFixed(1).replace(".", ",");
  return `${years} yıl`;
}

function TimeMachineModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const streakStartedAt = useProgressStore((s) => s.streakStartedAt);

  const [input, setInput] = useState<TimeMachineInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftHours, setDraftHours] = useState<number>(3);
  const [draftMonths, setDraftMonths] = useState<number>(24);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as TimeMachineInput;
          if (
            typeof parsed.hoursPerDay === "number" &&
            typeof parsed.monthsSpent === "number"
          ) {
            setInput(parsed);
            setDraftHours(parsed.hoursPerDay);
            setDraftMonths(parsed.monthsSpent);
          }
        }
      } catch (error) {
        reportError(error, { scope: "timeMachine.load", level: "warning" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = useCallback(async () => {
    haptics.tapMedium();
    const next: TimeMachineInput = {
      hoursPerDay: draftHours,
      monthsSpent: draftMonths,
    };
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
      setInput(next);
      setEditing(false);
      haptics.success();
    } catch (error) {
      reportError(error, { scope: "timeMachine.save" });
      haptics.error();
      toast.error("Kaydedilemedi.", "Hata");
    }
  }, [draftHours, draftMonths, toast]);

  const handleEdit = () => {
    haptics.tapLight();
    setEditing(true);
  };

  const handleCancelEdit = () => {
    haptics.selection();
    if (input) {
      setDraftHours(input.hoursPerDay);
      setDraftMonths(input.monthsSpent);
    }
    setEditing(false);
  };

  // Derived numbers — null until input set.
  const stats = useMemo(() => {
    if (!input) return null;
    const lost = input.hoursPerDay * input.monthsSpent * 30;
    const cleanDays = streakStartedAt ? daysSince(streakStartedAt) : 0;
    const reclaimed = input.hoursPerDay * cleanDays;
    return { lost, reclaimed, cleanDays };
  }, [input, streakStartedAt]);

  const showSetup = !loading && (input === null || editing);

  if (loading) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.content}>
            <Skeleton width={60} height={16} radius={6} style={{ marginBottom: 12 }} />
            <Skeleton width="70%" height={28} radius={8} style={{ marginBottom: 18 }} />
            <Skeleton width="100%" height={180} radius={20} />
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
      style={styles.gradient}
    >
      <ThemeTexture
        primary={colors.primary}
        secondary={colors.secondary}
        accent={colors.accent}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          {showSetup ? (
            <SetupView
              colors={colors}
              draftHours={draftHours}
              draftMonths={draftMonths}
              onHoursChange={(v) => {
                haptics.selection();
                setDraftHours(v);
              }}
              onMonthsChange={(v) => {
                haptics.selection();
                setDraftMonths(v);
              }}
              onSave={handleSave}
              onCancel={input ? handleCancelEdit : undefined}
              firstRun={input === null}
            />
          ) : stats ? (
            <ResultsView
              colors={colors}
              stats={stats}
              hoursPerDay={input!.hoursPerDay}
              onEdit={handleEdit}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Setup view ──────────────────────────────────────────────────────────────

interface SetupViewProps {
  colors: ReturnType<typeof useTheme>["colors"];
  draftHours: number;
  draftMonths: number;
  onHoursChange: (v: number) => void;
  onMonthsChange: (v: number) => void;
  onSave: () => void;
  onCancel?: () => void;
  firstRun: boolean;
}

function SetupView({
  colors,
  draftHours,
  draftMonths,
  onHoursChange,
  onMonthsChange,
  onSave,
  onCancel,
  firstRun,
}: SetupViewProps) {
  return (
    <>
      <LinearGradient
        colors={["#2B4A82", "#22407A", "#1B3568"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroDecor} pointerEvents="none">
          <Ionicons name="hourglass" size={140} color="rgba(255,255,255,0.14)" />
        </View>
        <View style={styles.heroBadge}>
          <Ionicons name="time" size={11} color="#FFD074" />
          <Text style={styles.heroBadgeText}>ZAMAN MAKİNESİ</Text>
        </View>
        <Text style={styles.heroTitle} accessibilityRole="header">
          {firstRun ? "Eski rutinini gir" : "Bilgilerini güncelle"}
        </Text>
        <Text style={styles.heroSubtitle}>
          İki cevap yetiyor — kaybettiğin saatleri ve temiz kaldıkça geri
          kazandığın saatleri hesaplıyoruz.
        </Text>
      </LinearGradient>

      <Card style={styles.cardSpacing}>
        <SectionHeader
          title="Eskiden günde kaç saat?"
          icon="hourglass"
          subtitle="Ortalama bir kumar/bahis günü için tahmini süre."
        />
        <View style={styles.pillRow}>
          {HOURS_OPTIONS.map((opt) => {
            const active = opt === draftHours;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => onHoursChange(opt)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active
                      ? `${colors.primary}26`
                      : "transparent",
                    borderColor: active ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {opt}h
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Card style={styles.cardSpacing}>
        <SectionHeader
          title="Kaç sürdür bu rutindeydin?"
          icon="calendar"
          subtitle="Yakın geçmişte bu yoğunlukta oynadığın dönem."
        />
        <View style={styles.pillRow}>
          {MONTH_OPTIONS.map((opt) => {
            const active = opt.months === draftMonths;
            return (
              <TouchableOpacity
                key={opt.months}
                onPress={() => onMonthsChange(opt.months)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[
                  styles.pillWide,
                  {
                    backgroundColor: active
                      ? `${colors.primary}26`
                      : "transparent",
                    borderColor: active ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Button
        title="Hesapla"
        onPress={onSave}
        variant="primary"
        fullWidth
        size="lg"
        leftIcon="calculator"
        style={styles.saveBtn}
      />
      {onCancel ? (
        <Button
          title="Vazgeç"
          onPress={onCancel}
          variant="ghost"
          fullWidth
          style={styles.cancelBtn}
        />
      ) : null}
    </>
  );
}

// ─── Results view ────────────────────────────────────────────────────────────

interface ResultsViewProps {
  colors: ReturnType<typeof useTheme>["colors"];
  stats: { lost: number; reclaimed: number; cleanDays: number };
  hoursPerDay: number;
  onEdit: () => void;
}

function ResultsView({ colors, stats, hoursPerDay, onEdit }: ResultsViewProps) {
  const { lost, reclaimed, cleanDays } = stats;

  // Comparison the user has just unlocked OR the closest one ahead.
  const nextComparison = useMemo(() => {
    return COMPARISONS.find((c) => c.hours > reclaimed) ?? null;
  }, [reclaimed]);

  return (
    <>
      <LinearGradient
        colors={["#2B4A82", "#22407A", "#1B3568"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroDecor} pointerEvents="none">
          <Ionicons name="hourglass" size={140} color="rgba(255,255,255,0.14)" />
        </View>
        <View style={styles.heroBadge}>
          <Ionicons name="trending-up" size={11} color="#7FE0B0" />
          <Text style={styles.heroBadgeText}>GERİ KAZANDIN</Text>
        </View>
        <Text style={styles.heroBigNumber} accessibilityRole="header">
          {formatHours(reclaimed)}
        </Text>
        <Text style={styles.heroSubtitle}>
          {cleanDays === 0
            ? "Sayaç ilk temiz günde başlar."
            : `${cleanDays} temiz gün × günde ${hoursPerDay} saat — geri kazanılan zaman.`}
        </Text>
      </LinearGradient>

      {nextComparison && reclaimed > 0 ? (
        <Card
          style={[
            styles.cardSpacing,
            {
              backgroundColor: `${colors.accent}10`,
              borderColor: `${colors.accent}40`,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.nextChip, { color: colors.textMuted }]}>
            SIRADAKİ — {formatHours(nextComparison.hours - reclaimed)} sonra
          </Text>
          <View style={styles.nextRow}>
            <Text style={styles.nextEmoji}>{nextComparison.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nextTitle, { color: colors.text }]}>
                {nextComparison.title}
              </Text>
              <Text style={[styles.nextHint, { color: colors.textMuted }]}>
                {nextComparison.hint}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <View style={styles.lostBanner}>
        <Ionicons name="warning" size={16} color={colors.warning} />
        <Text style={[styles.lostText, { color: colors.text }]}>
          Eski rutin: <Text style={styles.lostBold}>{formatHours(lost)}</Text>
          {"  ≈  "}
          <Text style={styles.lostBold}>{describeBigTime(lost)}</Text>
        </Text>
      </View>

      <SectionHeader
        title="Bu sürede yapabileceklerin"
        icon="sparkles"
        subtitle="Geri kazandığın her saat yeni bir kapı açıyor."
      />

      <View style={styles.comparisonList}>
        {COMPARISONS.map((c) => {
          const unlocked = reclaimed >= c.hours;
          return (
            <Card
              key={c.id}
              style={[
                styles.comparisonCard,
                {
                  opacity: unlocked ? 1 : 0.55,
                  borderColor: unlocked
                    ? `${colors.success}55`
                    : colors.cardBorder,
                  borderWidth: unlocked ? 1 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonEmoji}>{c.emoji}</Text>
                <View style={styles.comparisonText}>
                  <Text
                    style={[styles.categoryChip, { color: colors.textMuted }]}
                  >
                    {CATEGORY_LABEL[c.category]} · {formatHours(c.hours)}
                  </Text>
                  <Text style={[styles.comparisonTitle, { color: colors.text }]}>
                    {c.title}
                  </Text>
                  <Text style={[styles.comparisonHint, { color: colors.textMuted }]}>
                    {c.hint}
                  </Text>
                </View>
                {unlocked ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.success}
                  />
                ) : (
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color={colors.textMuted}
                  />
                )}
              </View>
            </Card>
          );
        })}
      </View>

      <Pressable
        onPress={onEdit}
        style={({ pressed }) => [
          styles.editLink,
          { opacity: pressed ? 0.5 : 1 },
        ]}
        accessibilityRole="button"
      >
        <Ionicons name="create-outline" size={16} color={colors.textMuted} />
        <Text style={[styles.editLinkText, { color: colors.textMuted }]}>
          Bilgileri düzenle
        </Text>
      </Pressable>
    </>
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
    marginBottom: 14,
  },
  backText: { fontSize: 17, fontWeight: "600" },

  heroCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    minHeight: 220,
    justifyContent: "flex-end",
  },
  heroDecor: { position: "absolute", right: -18, top: -18 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroBigNumber: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },

  cardSpacing: { marginBottom: 14 },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 56,
    alignItems: "center",
  },
  pillWide: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 88,
    alignItems: "center",
  },
  pillText: { fontSize: 14, fontWeight: "700" },

  saveBtn: { marginTop: 8 },
  cancelBtn: { marginTop: 8 },

  nextChip: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  nextRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  nextEmoji: { fontSize: 34 },
  nextTitle: { fontSize: 16, fontWeight: "800" },
  nextHint: { fontSize: 13, lineHeight: 18, marginTop: 2 },

  lostBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255, 208, 116, 0.12)",
    marginBottom: 18,
  },
  lostText: { fontSize: 13, flex: 1, lineHeight: 18 },
  lostBold: { fontWeight: "900" },

  comparisonList: { gap: 10, marginTop: 12 },
  comparisonCard: { padding: 14 },
  comparisonRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  comparisonEmoji: { fontSize: 30 },
  comparisonText: { flex: 1, minWidth: 0 },
  categoryChip: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  comparisonTitle: { fontSize: 15, fontWeight: "700" },
  comparisonHint: { fontSize: 12, lineHeight: 16, marginTop: 2 },

  editLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 12,
    marginTop: 18,
  },
  editLinkText: { fontSize: 13, fontWeight: "600" },
});

export default withPremiumGate(TimeMachineModule, {
  title: "Zaman Makinesi",
  subtitle: "Kaybedilen ve geri kazanılan saat",
});
