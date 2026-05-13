import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import * as SecureStore from "expo-secure-store";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { getPremiumState } from "@/store/premiumStore";

type DayTask = {
  day: number;
  title: string;
  duration: string;
  description: string;
  steps: string[];
  rationale: string;
};

const DAYS: DayTask[] = [
  {
    day: 1,
    title: "Bilgi günü — Dopamin nedir?",
    duration: "10 dk okuma",
    description:
      "Kumar oynama anında beyninde ne olduğunu öğren. Bilinçli farkındalık değişimin ilk basamağıdır.",
    steps: [
      "Dopamin ödül kimyasalı değil, 'bir sonraki ödülü iste' kimyasalıdır.",
      "Slot makineleri ve bahisler 'aralıklı pekiştirme' kullanır — en bağımlılık yapan ödül şeması.",
      "Yakın kaçırış (iki uyumlu sembol + üçüncüsü kıl payı) gerçek kazanç kadar dopamin verir.",
      "Bağımlılık beyinsel onarım gerektiren bir koşullanmadır, irade eksikliği değil.",
    ],
    rationale: "Olanı isimlendirdiğinde gücü düşer.",
  },
  {
    day: 2,
    title: "Sabah yürüyüşü",
    duration: "20 dk",
    description:
      "Sabah güneş ışığı dopamin baz seviyesini sağlıklı şekilde yükseltir. 10 dk açık havada yeter.",
    steps: [
      "Telefonsuz dışarı çık.",
      "İlk 10 dk hızlı yürü, kalan 10 dk yavaşla.",
      "Sadece adımlarına ve nefesine dikkat ver.",
      "Eve dönünce 1 bardak su iç.",
    ],
    rationale: "Sabah güneş + hareket = doğal dopamin temeli.",
  },
  {
    day: 3,
    title: "Ekran orucu",
    duration: "2 saat",
    description:
      "Sosyal medya kısa süreli dopamin atışları üretiyor — kumarla aynı devreyi besliyor.",
    steps: [
      "Telefonu uzak bir odaya bırak.",
      "2 saat boyunca okuma, ev işi, yürüyüş veya konuşma — sıra senin.",
      "Bittikten sonra hissettiklerini bir cümle ile günlüğe yaz.",
    ],
    rationale: "Beynine 'sıkılma' fırsatı ver — yaratıcılık burada başlar.",
  },
  {
    day: 4,
    title: "Soğuk duş veya soğuk yüz yıkama",
    duration: "30-60 sn",
    description:
      "Soğuk şok dopamin yükselişini saatlerce yüksek tutar — kumardan farklı: çöküş yok.",
    steps: [
      "Duşun sonunda 30 saniye soğuk suyu aç.",
      "Burnundan derin nefes al, ağzından ver.",
      "Korkutucuysa: 5 kere soğuk su ile yüzünü yıka.",
    ],
    rationale: "Kontrol ettiğin küçük rahatsızlıklar büyük dürtülere karşı tampon kurar.",
  },
  {
    day: 5,
    title: "Yoğun fiziksel aktivite",
    duration: "20-40 dk",
    description:
      "Egzersiz endorfin ve dopamin üretir, kortizol düşürür — dürtü direnci için en kanıtlı yöntem.",
    steps: [
      "Hızlı tempo yürüyüş, koşu, bisiklet veya HIIT.",
      "Nefes alış-verişin yorulmuş hissetmen yeterli.",
      "Bittikten sonra 2 dk hareketsiz oturup nefesini izle.",
    ],
    rationale: "Bedeni yorulan zihin sakinleşir.",
  },
  {
    day: 6,
    title: "Anlamlı sosyal etkileşim",
    duration: "30 dk+",
    description:
      "Yalnızlık dürtüyü besler. Bir kişiyle yüzeysel olmayan bir konuşma sosyal ödül devresini onarır.",
    steps: [
      "Telefon olmadan birine ulaş.",
      "Yüz yüze veya video ile en az 30 dk konuş.",
      "Onun günü, sağlığı, düşünceleri hakkında 3 gerçek soru sor.",
    ],
    rationale: "İnsan beyni paylaşmaya ödül ödüyor — sosyal bağ doğal dopamin.",
  },
  {
    day: 7,
    title: "Derin uyku gecesi",
    duration: "8+ saat",
    description:
      "Uyku dopamin reseptörlerinin temizlik gecesidir. 8 saatlik uyku duyarlılığı yeniler.",
    steps: [
      "Yatak saatinden 1 saat önce ekranları kapat.",
      "Oda 18-20°C ve karanlık olsun.",
      "Yatağa girince 5 dk nefes egzersizi (4 al, 6 ver).",
      "Sabah aynı saatte uyan.",
    ],
    rationale: "Uyku iradenin kaslı olduğu yerdir — dinlenmiş beyin daha güçlü direnir.",
  },
];

const PROGRESS_KEY = "antislot_brain_hygiene_progress";
const STARTED_KEY = "antislot_brain_hygiene_started_at";

export default function BrainHygieneModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const [premiumActive, setPremiumActive] = useState<boolean | null>(null);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const state = await getPremiumState();
        setPremiumActive(state.isActive);
        const progressRaw = await SecureStore.getItemAsync(PROGRESS_KEY);
        if (progressRaw) {
          const parsed = JSON.parse(progressRaw) as number[];
          if (Array.isArray(parsed)) setCompletedDays(parsed);
        }
        const startedRaw = await SecureStore.getItemAsync(STARTED_KEY);
        if (startedRaw) {
          const parsed = parseInt(startedRaw, 10);
          if (Number.isFinite(parsed)) setStartedAt(parsed);
        }
      } catch (error) {
        reportError(error, { scope: "brainHygiene.load", level: "warning" });
        setPremiumActive(false);
      }
    })();
  }, []);

  const currentDay = useMemo(() => {
    if (completedDays.length === 0) return 1;
    const maxCompleted = Math.max(...completedDays);
    return Math.min(7, maxCompleted + 1);
  }, [completedDays]);

  const handleStart = async () => {
    haptics.tapMedium();
    try {
      const now = Date.now();
      await SecureStore.setItemAsync(STARTED_KEY, String(now));
      setStartedAt(now);
      haptics.success();
      toast.success("7 günlük protokol başladı.", "Başladı");
    } catch (error) {
      reportError(error, { scope: "brainHygiene.start" });
      haptics.error();
    }
  };

  const handleComplete = async (day: number) => {
    if (completedDays.includes(day)) {
      haptics.warning();
      try {
        const next = completedDays.filter((d) => d !== day);
        await SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(next));
        setCompletedDays(next);
      } catch (error) {
        reportError(error, { scope: "brainHygiene.uncomplete" });
      }
      return;
    }
    haptics.success();
    try {
      const next = [...completedDays, day].sort((a, b) => a - b);
      await SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(next));
      setCompletedDays(next);
      if (next.length === 7) {
        toast.success("7 gün tamamlandı. Müthiş iş.", "Bravo");
      }
    } catch (error) {
      reportError(error, { scope: "brainHygiene.complete" });
    }
  };

  // Premium gate
  if (premiumActive === false) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <ThemeTexture
          primary={colors.primary}
          secondary={colors.secondary}
          accent={colors.accent}
        />
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
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
                <Ionicons name="lock-closed" size={140} color="rgba(255,255,255,0.14)" />
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="diamond" size={11} color="#FFD074" />
                <Text style={styles.heroBadgeText}>PREMIUM MODÜL</Text>
              </View>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Beyin Hijyeni
              </Text>
              <Text style={styles.heroSubtitle}>
                Dopamin döngüsünü onarmak için 7 günlük yapılandırılmış
                protokol. Bilgi günü, sabah yürüyüşü, ekran orucu, soğuk şok,
                egzersiz, sosyal bağ ve derin uyku.
              </Text>
            </LinearGradient>

            <Card style={styles.cardSpacing}>
              <SectionHeader title="Protokolde neler var?" icon="list" />
              <View style={styles.previewList}>
                {DAYS.map((d) => (
                  <View key={d.day} style={styles.previewRow}>
                    <View
                      style={[
                        styles.previewBadge,
                        { backgroundColor: `${colors.primary}14` },
                      ]}
                    >
                      <Text style={[styles.previewBadgeText, { color: colors.primary }]}>
                        G{d.day}
                      </Text>
                    </View>
                    <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
                      {d.title}
                    </Text>
                    <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                  </View>
                ))}
              </View>
            </Card>

            <Button
              title="Premium ile Kilidi Aç"
              onPress={() => {
                haptics.tapMedium();
                router.push("/premium");
              }}
              variant="gradient"
              size="lg"
              fullWidth
              leftIcon="diamond"
              style={styles.unlockBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Loading state — neutral
  if (premiumActive === null) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container} />
      </LinearGradient>
    );
  }

  // Premium active
  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
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
            colors={["#B14040", "#A03838", "#8E2F2F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="fitness" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="pulse" size={11} color="#FF8A66" />
              <Text style={styles.heroBadgeText}>7 GÜNLÜK PROTOKOL</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Beyin Hijyeni
            </Text>
            <Text style={styles.heroSubtitle}>
              Dopamin döngüsünü 7 günde onar. Bilgi → hareket → ekran orucu →
              soğuk şok → egzersiz → sosyal bağ → uyku.
            </Text>
            <View style={styles.heroProgressTrack}>
              <View
                style={[
                  styles.heroProgressFill,
                  { width: `${(completedDays.length / 7) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.heroProgressText}>
              {completedDays.length}/7 gün tamamlandı
            </Text>
          </LinearGradient>

          {!startedAt ? (
            <Button
              title="Protokolü Başlat"
              onPress={handleStart}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon="play"
              style={styles.startBtn}
            />
          ) : null}

          {DAYS.map((day) => {
            const isCompleted = completedDays.includes(day.day);
            const isCurrent = day.day === currentDay && !isCompleted;
            return (
              <Card
                key={day.day}
                style={[
                  styles.cardSpacing,
                  isCurrent && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayBadgeRow}>
                    <View
                      style={[
                        styles.dayBadge,
                        {
                          backgroundColor: isCompleted
                            ? colors.success
                            : isCurrent
                            ? colors.primary
                            : `${colors.cardBorder}66`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayBadgeText,
                          {
                            color:
                              isCompleted || isCurrent
                                ? "#FFFFFF"
                                : colors.textMuted,
                          },
                        ]}
                      >
                        G{day.day}
                      </Text>
                    </View>
                    {isCurrent ? (
                      <View
                        style={[
                          styles.currentPill,
                          { backgroundColor: `${colors.primary}14` },
                        ]}
                      >
                        <Text style={[styles.currentPillText, { color: colors.primary }]}>
                          BUGÜN
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.dayDuration, { color: colors.textMuted }]}>
                    {day.duration}
                  </Text>
                </View>
                <Text style={[styles.dayTitle, { color: colors.text }]}>{day.title}</Text>
                <Text style={[styles.dayDescription, { color: colors.textMuted }]}>
                  {day.description}
                </Text>
                <View style={styles.stepList}>
                  {day.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View
                        style={[
                          styles.stepBullet,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                      <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                    </View>
                  ))}
                </View>
                <View
                  style={[
                    styles.rationaleBox,
                    { backgroundColor: `${colors.warning}10` },
                  ]}
                >
                  <Ionicons name="bulb" size={14} color={colors.warning} />
                  <Text style={[styles.rationaleText, { color: colors.text }]}>
                    {day.rationale}
                  </Text>
                </View>
                <Button
                  title={isCompleted ? "Tamamlandı · geri al" : "Bugünü Tamamla"}
                  onPress={() => handleComplete(day.day)}
                  variant={isCompleted ? "secondary" : "primary"}
                  fullWidth
                  leftIcon={isCompleted ? "checkmark-circle" : "play"}
                  style={styles.completeBtn}
                />
              </Card>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
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
    backgroundColor: "rgba(255,138,102,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,138,102,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FF8A66",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    marginBottom: 6,
  },
  heroProgressFill: {
    height: "100%",
    backgroundColor: "#FFB366",
    borderRadius: 999,
  },
  heroProgressText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "700",
  },

  cardSpacing: { marginBottom: 14 },
  previewList: { gap: 10 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  previewBadge: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBadgeText: { fontSize: 12, fontWeight: "900" },
  previewTitle: { flex: 1, fontSize: 13, fontWeight: "700" },

  unlockBtn: { marginTop: 4 },
  startBtn: { marginBottom: 14 },

  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayBadge: {
    width: 40,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeText: { fontSize: 13, fontWeight: "900", letterSpacing: 0.3 },
  currentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  currentPillText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  dayDuration: { fontSize: 12, fontWeight: "700" },
  dayTitle: { fontSize: 17, fontWeight: "800", marginBottom: 6 },
  dayDescription: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  stepList: { gap: 8, marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  stepText: { fontSize: 13, lineHeight: 19, flex: 1 },
  rationaleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  rationaleText: { fontSize: 12, fontStyle: "italic", flex: 1 },
  completeBtn: { marginTop: 2 },
});
