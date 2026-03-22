import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CostId = "time" | "focus" | "opportunity" | "relationship" | "selfTrust";
type Counts = Record<CostId, number>;

const STORAGE_KEY = "@antislot/invisible-cost/v2";
const MAX_COUNT = 999;

type CostItem = {
  id: CostId;
  badge: string;
  labelTr: string;
  labelEn: string;
  unitTr: string;
  unitEn: string;
  weight: number;
};

const COSTS: CostItem[] = [
  { id: "time", badge: "TIME", labelTr: "Kayip zaman", labelEn: "Lost time", unitTr: "saat", unitEn: "hours", weight: 1 },
  { id: "focus", badge: "FOCUS", labelTr: "Kayip odak", labelEn: "Lost focus", unitTr: "gun", unitEn: "days", weight: 2 },
  {
    id: "opportunity",
    badge: "OPP",
    labelTr: "Kacan firsat",
    labelEn: "Missed opportunities",
    unitTr: "adet",
    unitEn: "items",
    weight: 2,
  },
  {
    id: "relationship",
    badge: "REL",
    labelTr: "Iliski maliyeti",
    labelEn: "Relationship cost",
    unitTr: "an",
    unitEn: "moments",
    weight: 3,
  },
  {
    id: "selfTrust",
    badge: "TRUST",
    labelTr: "Oz guven kirilmasi",
    labelEn: "Self-trust hits",
    unitTr: "kez",
    unitEn: "times",
    weight: 3,
  },
];

const DEFAULT_COUNTS: Counts = {
  time: 0,
  focus: 0,
  opportunity: 0,
  relationship: 0,
  selfTrust: 0,
};

const INSIGHTS: Record<CostId, { tr: string; en: string }> = {
  time: {
    tr: "Zaman etkisi yukseliyor. Riskli saatlere net bir durdurma saati koy.",
    en: "Time impact is rising. Set a clear stop hour for high-risk windows.",
  },
  focus: {
    tr: "Odak kaybi one cikiyor. Bildirimleri kisitla ve calisma bloklarini kisalt.",
    en: "Focus loss stands out. Restrict notifications and shorten work blocks.",
  },
  opportunity: {
    tr: "Firsat kaybi artmis. Haftalik 3 kucuk hedef belirlemek dengeyi geri getirir.",
    en: "Opportunity loss is up. Setting 3 small weekly targets can restore direction.",
  },
  relationship: {
    tr: "Iliski maliyeti baskin. Kisa bir mesaj veya arama ile bagi yeniden kur.",
    en: "Relationship cost is dominant. Reconnect with a short message or call.",
  },
  selfTrust: {
    tr: "Oz guven etkilenmis. Bugun tek bir uygulanabilir sozu tamamla.",
    en: "Self-trust is affected. Complete one small promise today.",
  },
};

const clamp = (value: number) => Math.max(0, Math.min(MAX_COUNT, Math.round(value)));

export default function InvisibleCostScreen() {
  const { t, language, locale } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";

  const [counts, setCounts] = useState<Counts>(DEFAULT_COUNTS);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || !mounted) return;

        const parsed = JSON.parse(raw) as { counts?: Partial<Counts>; savedAt?: number };
        const restored: Counts = {
          time: clamp(parsed.counts?.time ?? 0),
          focus: clamp(parsed.counts?.focus ?? 0),
          opportunity: clamp(parsed.counts?.opportunity ?? 0),
          relationship: clamp(parsed.counts?.relationship ?? 0),
          selfTrust: clamp(parsed.counts?.selfTrust ?? 0),
        };

        setCounts(restored);
        if (typeof parsed.savedAt === "number" && Number.isFinite(parsed.savedAt)) {
          setLastSavedAt(parsed.savedAt);
        }
      } catch {
        setSaveError(isTr ? "Kayitli veriler okunamadi." : "Saved values could not be loaded.");
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    };

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [isTr]);

  useEffect(() => {
    let cancelled = false;

    const persist = async () => {
      if (!hydrated) return;

      setSaving(true);
      setSaveError(null);
      const savedAt = Date.now();

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ counts, savedAt }));
        if (!cancelled) setLastSavedAt(savedAt);
      } catch {
        if (!cancelled) {
          setSaveError(isTr ? "Veriler kaydedilemedi." : "Values could not be saved.");
        }
      } finally {
        if (!cancelled) setSaving(false);
      }
    };

    void persist();
    return () => {
      cancelled = true;
    };
  }, [counts, hydrated, isTr]);

  const totalEntries = useMemo(
    () => Object.values(counts).reduce((sum, value) => sum + value, 0),
    [counts]
  );

  const weightedScore = useMemo(
    () => COSTS.reduce((sum, item) => sum + counts[item.id] * item.weight, 0),
    [counts]
  );

  const dominantCost = useMemo(() => {
    let dominant: CostItem = COSTS[0];
    for (const item of COSTS) {
      if (counts[item.id] > counts[dominant.id]) {
        dominant = item;
      }
    }
    return counts[dominant.id] > 0 ? dominant : null;
  }, [counts]);

  const risk = useMemo(() => {
    if (weightedScore <= 10) {
      return {
        label: isTr ? "Dusuk etki" : "Low impact",
        color: "#0F766E",
        background: "#CCFBF1",
      };
    }
    if (weightedScore <= 25) {
      return {
        label: isTr ? "Orta etki" : "Moderate impact",
        color: "#B45309",
        background: "#FEF3C7",
      };
    }
    if (weightedScore <= 45) {
      return {
        label: isTr ? "Yuksek etki" : "High impact",
        color: "#B91C1C",
        background: "#FEE2E2",
      };
    }
    return {
      label: isTr ? "Kritik etki" : "Critical impact",
      color: "#7F1D1D",
      background: "#FECACA",
    };
  }, [isTr, weightedScore]);

  const progressPercent = Math.min(100, Math.round((weightedScore / 60) * 100));
  const formattedSavedAt = lastSavedAt
    ? new Date(lastSavedAt).toLocaleString(locale)
    : isTr
      ? "Henuz kaydedilmedi"
      : "Not saved yet";

  const updateCount = (id: CostId, delta: number) => {
    setCounts((prev) => ({ ...prev, [id]: clamp(prev[id] + delta) }));
  };

  const applyPreset = (value: number) => {
    setCounts((prev) => {
      const next = { ...prev };
      for (const item of COSTS) {
        next[item.id] = clamp(prev[item.id] + value);
      }
      return next;
    });
  };

  const resetAll = () => {
    Alert.alert(
      isTr ? "Degerleri sifirla" : "Reset values",
      isTr ? "Tum sayaclar sifirlansin mi?" : "Reset all counters?",
      [
        { text: isTr ? "Vazgec" : "Cancel", style: "cancel" },
        { text: isTr ? "Sifirla" : "Reset", style: "destructive", onPress: () => setCounts(DEFAULT_COUNTS) },
      ]
    );
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
            {isTr ? "Yukleniyor..." : "Loading..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.exploreModules.invisibleCost.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.exploreModules.invisibleCost.subtitle}
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {isTr
              ? "Bu panel, para disindaki kayiplari takip ederek davranisin toplam etkisini gorunur hale getirir."
              : "This panel makes non-financial losses visible so you can see full behavior impact."}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryHeader}>
            <View style={[styles.riskBadge, { backgroundColor: risk.background }]}>
              <Text style={[styles.riskText, { color: risk.color }]}>{risk.label}</Text>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {isTr ? "Gorunmeyen etki skoru" : "Invisible impact score"}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{weightedScore}</Text>
            <Text style={[styles.summaryHint, { color: colors.textSecondary }]}>
              {isTr ? `Toplam giris: ${totalEntries}` : `Total entries: ${totalEntries}`}
            </Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
            <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: risk.color }]} />
          </View>

          <Text style={[styles.savedText, { color: colors.textSecondary, opacity: 0.7 }]}>
            {isTr ? `Son kayit: ${formattedSavedAt}` : `Last saved: ${formattedSavedAt}`}
          </Text>

          {(saving || saveError) && (
            <View style={styles.saveRow}>
              {saving ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              <Text style={[styles.saveText, { color: saveError ? "#B91C1C" : colors.textSecondary }]}>
                {saveError ?? (isTr ? "Kaydediliyor..." : "Saving...")}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.quickTitle, { color: colors.text }]}>
            {isTr ? "Hizli guncelleme" : "Quick update"}
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickBtn, { borderColor: colors.primary, backgroundColor: colors.background }]}
              onPress={() => applyPreset(1)}
            >
              <Text style={[styles.quickBtnText, { color: colors.primary }]}>
                {isTr ? "Gunluk check-in (+1)" : "Daily check-in (+1)"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { borderColor: colors.primary, backgroundColor: colors.background }]}
              onPress={() => applyPreset(3)}
            >
              <Text style={[styles.quickBtnText, { color: colors.primary }]}>
                {isTr ? "Zor gun (+3)" : "Rough day (+3)"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { borderColor: colors.border, backgroundColor: colors.background, opacity: 0.8 }]}
              onPress={resetAll}
            >
              <Text style={[styles.quickBtnText, { color: colors.text }]}>
                {isTr ? "Sifirla" : "Reset"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.list}>
          {COSTS.map((cost) => (
            <View key={cost.id} style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.badge, { borderColor: colors.primary, backgroundColor: colors.background }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{cost.badge}</Text>
              </View>

              <View style={styles.meta}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {isTr ? cost.labelTr : cost.labelEn}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {isTr ? cost.unitTr : cost.unitEn}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {isTr ? `Etki katsayisi: ${cost.weight}` : `Impact weight: ${cost.weight}`}
                </Text>
              </View>

              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => updateCount(cost.id, -1)}
                >
                  <Text style={[styles.stepperText, { color: colors.primary }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.text }]}>{counts[cost.id]}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => updateCount(cost.id, 1)}
                >
                  <Text style={[styles.stepperText, { color: colors.primary }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {dominantCost ? (
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.insightLabel, { color: colors.primary }]}>
              {isTr ? "One cikan alan" : "Main pressure area"}
            </Text>
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              {isTr ? dominantCost.labelTr : dominantCost.labelEn}
            </Text>
            <Text style={[styles.insightBody, { color: colors.textSecondary }]}>
              {isTr ? INSIGHTS[dominantCost.id].tr : INSIGHTS[dominantCost.id].en}
            </Text>
          </View>
        ) : null}

        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {isTr
              ? "Bu degerler yalnizca cihazinda tutulur ve diledigin zaman sifirlanabilir."
              : "These values stay on your device and can be reset anytime."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
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
  intro: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 10,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  riskBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  riskText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  summaryValue: {
    fontSize: 56,
    lineHeight: 60,
    fontFamily: Fonts.display,
    marginBottom: 4,
  },
  summaryHint: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  progressTrack: {
    height: 9,
    borderRadius: Radius.full,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  savedText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
    fontFamily: Fonts.body,
  },
  saveRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveText: {
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  quickCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  quickTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickBtn: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  quickBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    textAlign: "center",
  },
  list: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...Shadows.card,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
    fontFamily: Fonts.bodySemiBold,
  },
  meta: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  rowSub: {
    fontSize: 11,
    fontFamily: Fonts.body,
    marginBottom: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: {
    fontSize: 18,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
  },
  stepperValue: {
    minWidth: 26,
    textAlign: "center",
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  insightCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  insightLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  insightBody: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});
