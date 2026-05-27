import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { withPremiumGate } from "@/components/ui/premium-gate";
import {
  Alert,
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

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import {
  addGoal,
  getGoals,
  progressFor,
  removeGoal,
  toggleGoalCompleted,
  type Goal,
  type GoalKind,
} from "@/store/goalsStore";
import { useProgressStore } from "@/store/progressStore";
import { calculateSavings, formatCurrency, getSavingsConfig } from "@/store/savingsStore";

type KindMeta = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  hint: string;
};

const KIND_META: Record<GoalKind, KindMeta> = {
  streak: {
    label: "Temiz Gün",
    icon: "flame",
    color: "#FF8A66",
    hint: "Belirli sayıda gün temiz kalmak — örn. 30, 90, 365",
  },
  savings: {
    label: "Birikim",
    icon: "wallet",
    color: "#5EE0C7",
    hint: "Belirli bir TL miktarı biriktirmek",
  },
  habit: {
    label: "Yeni Alışkanlık",
    icon: "fitness",
    color: "#7BB8FF",
    hint: "Yerine koyma alışkanlığı — yürüyüş, okuma, spor",
  },
  freeform: {
    label: "Serbest",
    icon: "ribbon",
    color: "#A7AEFF",
    hint: "Kendine göre — borç kapatmak, ilişki onarımı vb.",
  },
};

const PRESETS: { kind: GoalKind; title: string; target?: number }[] = [
  { kind: "streak", title: "1 ay temiz kal", target: 30 },
  { kind: "streak", title: "3 ay temiz kal", target: 90 },
  { kind: "streak", title: "1 yıl temiz kal", target: 365 },
  { kind: "savings", title: "10.000 TL birikim", target: 10000 },
  { kind: "savings", title: "50.000 TL birikim", target: 50000 },
  { kind: "habit", title: "Haftada 3 yürüyüş" },
  { kind: "habit", title: "Günde 1 saat okuma" },
  { kind: "freeform", title: "Borçları ödemeye başla" },
];

function GoalsModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const gamblingFreeDays = useProgressStore((s) => s.gamblingFreeDays);
  const safeDays = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [composing, setComposing] = useState(false);
  const [kind, setKind] = useState<GoalKind>("streak");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [savedAmount, setSavedAmount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setGoals(await getGoals());
        const cfg = await getSavingsConfig();
        setSavedAmount(calculateSavings(safeDays, cfg.dailyAverage));
      } catch (error) {
        reportError(error, { scope: "goals.load", level: "warning" });
      }
    })();
  }, [safeDays]);

  const handleAdd = async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      haptics.warning();
      toast.warning("Hedef başlığını yaz.", "Eksik");
      return;
    }
    const parsedTarget = target ? parseInt(target.replace(/[^\d]/g, ""), 10) : undefined;

    haptics.tapMedium();
    try {
      const updated = await addGoal({
        title: trimmedTitle,
        kind,
        target: Number.isFinite(parsedTarget) ? parsedTarget : undefined,
      });
      setGoals(updated);
      setComposing(false);
      setTitle("");
      setTarget("");
      haptics.success();
      toast.success("Yeni hedef eklendi.", "Eklendi");
    } catch (error) {
      reportError(error, { scope: "goals.add" });
      haptics.error();
      toast.error("Hedef eklenemedi.", "Hata");
    }
  };

  const handleToggle = async (id: string) => {
    haptics.selection();
    try {
      const updated = await toggleGoalCompleted(id);
      setGoals(updated);
      const goal = updated.find((g) => g.id === id);
      if (goal?.completed) {
        haptics.success();
        toast.success("Hedef tamamlandı. Harika.", "Tebrikler");
      }
    } catch (error) {
      reportError(error, { scope: "goals.toggle" });
    }
  };

  const handleRemove = (id: string) => {
    haptics.warning();
    Alert.alert("Hedefi Sil", "Bu hedef silinsin mi?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await removeGoal(id);
            setGoals(updated);
            haptics.success();
          } catch (error) {
            reportError(error, { scope: "goals.remove" });
            haptics.error();
          }
        },
      },
    ]);
  };

  const handlePreset = (preset: typeof PRESETS[0]) => {
    haptics.selection();
    setKind(preset.kind);
    setTitle(preset.title);
    setTarget(preset.target ? String(preset.target) : "");
    setComposing(true);
  };

  const activeGoals = useMemo(() => goals.filter((g) => !g.completed), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.completed), [goals]);

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
            colors={["#264D8A", "#1F4378", "#173460"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="flag" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="flag" size={11} color="#7BB8FF" />
              <Text style={styles.heroBadgeText}>HEDEFLER</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Net hedef, net ilerleme
            </Text>
            <Text style={styles.heroSubtitle}>
              Soyut “iyi olmak” yerine somut hedef koy. Otomatik ilerleme barı
              streak ve birikimi referans alır.
            </Text>
            <View style={styles.heroStatsRow}>
              <View>
                <Text style={styles.heroStatValue}>{activeGoals.length}</Text>
                <Text style={styles.heroStatLabel}>AKTİF</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View>
                <Text style={[styles.heroStatValue, { color: "#A7F3D0" }]}>
                  {completedGoals.length}
                </Text>
                <Text style={styles.heroStatLabel}>TAMAMLANDI</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Compose */}
          {!composing ? (
            <Button
              title="Yeni Hedef Ekle"
              onPress={() => {
                haptics.tapLight();
                setComposing(true);
              }}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon="add-circle"
              style={styles.startBtn}
            />
          ) : (
            <Card style={styles.cardSpacing}>
              <SectionHeader title="Yeni Hedef" icon="create" />

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Tür</Text>
              <View style={styles.kindGrid}>
                {(Object.entries(KIND_META) as [GoalKind, KindMeta][]).map(([k, meta]) => {
                  const isActive = kind === k;
                  return (
                    <TouchableOpacity
                      key={k}
                      onPress={() => {
                        haptics.selection();
                        setKind(k);
                      }}
                      style={[
                        styles.kindChip,
                        {
                          backgroundColor: isActive ? `${meta.color}1F` : colors.card,
                          borderColor: isActive ? meta.color : colors.cardBorder,
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={16}
                        color={isActive ? meta.color : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.kindLabel,
                          { color: isActive ? meta.color : colors.text },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.kindHint, { color: colors.textMuted }]}>
                {KIND_META[kind].hint}
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
                Başlık
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="3 ay temiz kal"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
                accessibilityLabel="Hedef başlığı"
              />

              {kind === "streak" || kind === "savings" ? (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>
                    Hedef {kind === "streak" ? "(gün)" : "(TL)"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                    keyboardType="numeric"
                    placeholder={kind === "streak" ? "90" : "50000"}
                    placeholderTextColor={colors.textMuted}
                    value={target}
                    onChangeText={setTarget}
                    accessibilityLabel="Hedef miktar"
                  />
                </>
              ) : null}

              <View style={styles.actionRow}>
                <Button
                  title="Vazgeç"
                  onPress={() => {
                    haptics.tapLight();
                    setComposing(false);
                  }}
                  variant="secondary"
                  leftIcon="close"
                />
                <Button
                  title="Ekle"
                  onPress={handleAdd}
                  disabled={title.trim().length < 3}
                  variant="primary"
                  leftIcon="checkmark"
                  style={styles.actionPrimary}
                />
              </View>
            </Card>
          )}

          {/* Presets */}
          {goals.length === 0 && !composing ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Hazır Hedefler"
                icon="bulb"
                subtitle="Bir öneriden başla, sonra kendine göre uyarla."
              />
              <View style={styles.presetList}>
                {PRESETS.map((preset) => {
                  const meta = KIND_META[preset.kind];
                  return (
                    <TouchableOpacity
                      key={preset.title}
                      onPress={() => handlePreset(preset)}
                      style={[
                        styles.presetRow,
                        { backgroundColor: colors.card, borderColor: colors.cardBorder },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={preset.title}
                    >
                      <View
                        style={[
                          styles.presetIcon,
                          { backgroundColor: `${meta.color}1F` },
                        ]}
                      >
                        <Ionicons name={meta.icon} size={14} color={meta.color} />
                      </View>
                      <Text style={[styles.presetText, { color: colors.text }]}>
                        {preset.title}
                      </Text>
                      <Ionicons name="add-circle-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          ) : null}

          {/* Active goals */}
          {activeGoals.length > 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader title="Aktif Hedefler" icon="flag" meta={`${activeGoals.length}`} />
              <View style={styles.goalList}>
                {activeGoals.map((goal) => {
                  const meta = KIND_META[goal.kind];
                  const progress = progressFor(goal, safeDays, savedAmount);
                  return (
                    <View
                      key={goal.id}
                      style={[
                        styles.goalCard,
                        { backgroundColor: colors.card, borderColor: colors.cardBorder },
                      ]}
                    >
                      <View style={styles.goalHeader}>
                        <View
                          style={[
                            styles.goalIcon,
                            { backgroundColor: `${meta.color}1F` },
                          ]}
                        >
                          <Ionicons name={meta.icon} size={16} color={meta.color} />
                        </View>
                        <Text style={[styles.goalTitle, { color: colors.text }]}>
                          {goal.title}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemove(goal.id)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel="Sil"
                        >
                          <Ionicons name="close" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>

                      {goal.target ? (
                        <>
                          <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
                            <LinearGradient
                              colors={[meta.color, `${meta.color}AA`]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.progressFill, { width: `${Math.max(2, progress * 100)}%` }]}
                            />
                          </View>
                          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                            {goal.kind === "streak"
                              ? `${safeDays} / ${goal.target} gün`
                              : `${formatCurrency(savedAmount, "₺")} / ${formatCurrency(goal.target, "₺")}`}
                            {" · "}%{Math.round(progress * 100)}
                          </Text>
                        </>
                      ) : null}

                      <Button
                        title={progress >= 1 ? "Tamamlandı olarak işaretle" : "Tamamlandı"}
                        onPress={() => handleToggle(goal.id)}
                        variant={progress >= 1 ? "primary" : "secondary"}
                        leftIcon="checkmark-circle"
                        fullWidth
                        style={styles.goalAction}
                      />
                    </View>
                  );
                })}
              </View>
            </Card>
          ) : null}

          {/* Completed */}
          {completedGoals.length > 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Tamamlananlar"
                icon="checkmark-done"
                meta={`${completedGoals.length}`}
              />
              <View style={styles.completedList}>
                {completedGoals.map((goal) => {
                  const meta = KIND_META[goal.kind];
                  return (
                    <View
                      key={goal.id}
                      style={[
                        styles.completedRow,
                        { borderBottomColor: colors.cardBorder },
                      ]}
                    >
                      <View
                        style={[
                          styles.completedIcon,
                          { backgroundColor: `${colors.success}1F` },
                        ]}
                      >
                        <Ionicons name="checkmark" size={14} color={colors.success} />
                      </View>
                      <View style={styles.completedText}>
                        <Text style={[styles.completedTitle, { color: colors.text }]}>
                          {goal.title}
                        </Text>
                        <Text style={[styles.completedSub, { color: colors.textMuted }]}>
                          {meta.label}
                          {goal.completedAt
                            ? ` · ${new Date(goal.completedAt).toLocaleDateString("tr-TR")}`
                            : ""}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleToggle(goal.id)}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Yeniden aktifleştir"
                      >
                        <Ionicons name="refresh" size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </Card>
          ) : null}
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
    backgroundColor: "rgba(123,184,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(123,184,255,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#7BB8FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  heroStatsRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroStatValue: { color: "#FFFFFF", fontSize: 26, fontWeight: "900" },
  heroStatLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroStatDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.18)" },

  startBtn: { marginBottom: 14 },
  cardSpacing: { marginBottom: 14 },

  fieldLabel: { fontSize: 13, fontWeight: "800", marginBottom: 8 },
  kindGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  kindChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  kindLabel: { fontSize: 12, fontWeight: "700" },
  kindHint: { fontSize: 11, fontStyle: "italic", marginTop: 8 },

  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionPrimary: { flex: 1 },

  presetList: { gap: 8 },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  presetText: { flex: 1, fontSize: 13, fontWeight: "700" },

  goalList: { gap: 10 },
  goalCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  goalTitle: { flex: 1, fontSize: 14, fontWeight: "800" },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", borderRadius: 999 },
  progressLabel: { fontSize: 11, fontWeight: "700", marginBottom: 10 },
  goalAction: { marginTop: 4 },

  completedList: { gap: 0 },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  completedIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  completedText: { flex: 1 },
  completedTitle: { fontSize: 13, fontWeight: "800" },
  completedSub: { fontSize: 11, marginTop: 2 },
});

export default withPremiumGate(GoalsModule, {
  title: "Hedefler",
  subtitle: "Streak / birikim / alışkanlık",
});
