import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  computeStats,
  getUrgeLog,
  logUrge,
  removeUrge,
  type UrgeEntry,
  type UrgeTrigger,
} from "@/store/urgeLogStore";

const TRIGGER_META: Record<
  UrgeTrigger,
  { label: string; emoji: string; color: string }
> = {
  stres: { label: "Stres", emoji: "😰", color: "#F87171" },
  sikinti: { label: "Sıkıntı", emoji: "😩", color: "#FBBF24" },
  yalniz: { label: "Yalnızlık", emoji: "😔", color: "#A7AEFF" },
  kayip: { label: "Kayıp acısı", emoji: "💸", color: "#FF8A66" },
  ofke: { label: "Öfke", emoji: "😡", color: "#E11D48" },
  alkol: { label: "Alkol/madde", emoji: "🍷", color: "#9F7AEA" },
  reklam: { label: "Reklam gördüm", emoji: "📺", color: "#7BB8FF" },
  diger: { label: "Diğer", emoji: "❓", color: "#9DAFC6" },
};

const TRIGGER_ORDER: UrgeTrigger[] = [
  "stres",
  "sikinti",
  "yalniz",
  "kayip",
  "ofke",
  "alkol",
  "reklam",
  "diger",
];

export default function UrgeLogModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const [entries, setEntries] = useState<UrgeEntry[]>([]);
  const [composing, setComposing] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState<UrgeTrigger>("stres");
  const [resisted, setResisted] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setEntries(await getUrgeLog());
      } catch (error) {
        reportError(error, { scope: "urgeLog.load", level: "warning" });
      }
    })();
  }, []);

  const stats = useMemo(() => computeStats(entries), [entries]);
  const peakHour = useMemo(() => {
    const max = Math.max(...stats.byHour, 0);
    if (max === 0) return null;
    return stats.byHour.indexOf(max);
  }, [stats.byHour]);
  const topTrigger = useMemo<UrgeTrigger | null>(() => {
    const entriesByTrigger = Object.entries(stats.byTrigger) as [UrgeTrigger, number][];
    let max = 0;
    let best: UrgeTrigger | null = null;
    for (const [k, v] of entriesByTrigger) {
      if (v > max) {
        max = v;
        best = k;
      }
    }
    return best;
  }, [stats.byTrigger]);

  const handleStartCompose = () => {
    haptics.tapLight();
    setComposing(true);
    setIntensity(5);
    setTrigger("stres");
    setResisted(null);
    setNote("");
  };

  const handleSave = async () => {
    if (resisted === null) {
      haptics.warning();
      toast.warning("Dürtüye direndin mi yoksa oynadın mı?", "Eksik bilgi");
      return;
    }
    setSaving(true);
    haptics.tapMedium();
    try {
      const updated = await logUrge({
        intensity,
        trigger,
        resisted,
        note: note.trim() || undefined,
      });
      setEntries(updated);
      setComposing(false);
      haptics.success();
      toast.success(
        resisted ? "Dürtüye direndin. Bu sayılır." : "Kayıt alındı — bilgi her zaman güçtür.",
        "Kaydedildi"
      );
    } catch (error) {
      reportError(error, { scope: "urgeLog.save" });
      haptics.error();
      toast.error("Kayıt yapılamadı.", "Hata");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (id: string) => {
    haptics.warning();
    Alert.alert("Kaydı Sil", "Bu dürtü kaydını silmek istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await removeUrge(id);
            setEntries(updated);
            haptics.success();
          } catch (error) {
            reportError(error, { scope: "urgeLog.remove" });
            haptics.error();
          }
        },
      },
    ]);
  };

  const maxHourValue = Math.max(...stats.byHour, 1);

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

          {/* Hero */}
          <LinearGradient
            colors={["#B14040", "#A03838", "#8E2F2F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="pulse" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="pulse" size={11} color="#FF8A66" />
              <Text style={styles.heroBadgeText}>DÜRTÜ DEFTERİ</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Bir dürtü mü hissettin?
            </Text>
            <Text style={styles.heroSubtitle}>
              Hemen kaydet. Zamanla saatler, tetikleyiciler ve direniş oranın
              görünür hale gelir — kişisel patern çıkar.
            </Text>
          </LinearGradient>

          {/* Quick log CTA */}
          {!composing ? (
            <Button
              title="Yeni Dürtü Kaydet"
              onPress={handleStartCompose}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon="add-circle"
              style={styles.startBtn}
            />
          ) : null}

          {/* Compose */}
          {composing ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Yeni Kayıt"
                icon="create"
                subtitle="Bir cümleyle: ne kadar güçlüydü, ne tetikledi, ne yaptın?"
              />

              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Yoğunluk: <Text style={{ color: colors.primary, fontWeight: "900" }}>{intensity}</Text>/10
              </Text>
              <View style={styles.intensityRow}>
                {Array.from({ length: 11 }).map((_, i) => {
                  const isActive = i === intensity;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        haptics.selection();
                        setIntensity(i);
                      }}
                      style={[
                        styles.intensityPip,
                        {
                          backgroundColor: isActive ? colors.primary : `${colors.primary}1F`,
                        },
                      ]}
                      accessibilityRole="adjustable"
                      accessibilityLabel={`Yoğunluk ${i}`}
                    >
                      <Text
                        style={[
                          styles.intensityText,
                          { color: isActive ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {i}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16 }]}>
                Tetikleyici
              </Text>
              <View style={styles.triggerGrid}>
                {TRIGGER_ORDER.map((t) => {
                  const isActive = trigger === t;
                  const meta = TRIGGER_META[t];
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => {
                        haptics.selection();
                        setTrigger(t);
                      }}
                      style={[
                        styles.triggerChip,
                        {
                          backgroundColor: isActive ? `${meta.color}1F` : colors.card,
                          borderColor: isActive ? meta.color : colors.cardBorder,
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={meta.label}
                    >
                      <Text style={styles.triggerEmoji}>{meta.emoji}</Text>
                      <Text
                        style={[
                          styles.triggerLabel,
                          { color: isActive ? meta.color : colors.text },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16 }]}>
                Sonuç
              </Text>
              <View style={styles.resistRow}>
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    setResisted(true);
                  }}
                  style={[
                    styles.resistOption,
                    {
                      backgroundColor: resisted === true ? `${colors.success}1F` : colors.card,
                      borderColor: resisted === true ? colors.success : colors.cardBorder,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: resisted === true }}
                >
                  <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                  <Text style={[styles.resistText, { color: colors.text }]}>Direndim</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    setResisted(false);
                  }}
                  style={[
                    styles.resistOption,
                    {
                      backgroundColor: resisted === false ? `${colors.danger}1F` : colors.card,
                      borderColor: resisted === false ? colors.danger : colors.cardBorder,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: resisted === false }}
                >
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <Text style={[styles.resistText, { color: colors.text }]}>Oynadım</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16 }]}>
                Not (isteğe bağlı)
              </Text>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Ne oldu, neredeydin, ne hissettin?"
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={280}
                accessibilityLabel="Not"
              />

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
                  title={saving ? "Kaydediliyor" : "Kaydet"}
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving || resisted === null}
                  variant="primary"
                  leftIcon="checkmark"
                  style={styles.actionPrimary}
                />
              </View>
            </Card>
          ) : null}

          {/* Stats */}
          {entries.length > 0 ? (
            <>
              <Card style={styles.cardSpacing}>
                <SectionHeader title="Genel Görünüm" icon="analytics" />
                <View style={styles.statRow}>
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Toplam</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: colors.success }]}>
                      %{Math.round(stats.resistanceRate * 100)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Direniş</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {stats.avgIntensity.toFixed(1)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Ort. Yoğ.</Text>
                  </View>
                </View>
              </Card>

              {/* Hour pattern */}
              <Card style={styles.cardSpacing}>
                <SectionHeader
                  title="Saatlik Dağılım"
                  icon="time"
                  subtitle={
                    peakHour !== null
                      ? `En yoğun saat: ${String(peakHour).padStart(2, "0")}:00`
                      : "Veri toplanıyor"
                  }
                />
                <View style={styles.hourChart}>
                  {stats.byHour.map((v, h) => {
                    const ratio = v / maxHourValue;
                    return (
                      <View key={h} style={styles.hourCol}>
                        <View
                          style={[
                            styles.hourBar,
                            {
                              backgroundColor: v > 0 ? colors.primary : `${colors.cardBorder}AA`,
                              height: `${Math.max(4, ratio * 100)}%`,
                              opacity: v > 0 ? 1 : 0.5,
                            },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
                <View style={styles.hourLabels}>
                  <Text style={[styles.hourLabelText, { color: colors.textMuted }]}>00</Text>
                  <Text style={[styles.hourLabelText, { color: colors.textMuted }]}>06</Text>
                  <Text style={[styles.hourLabelText, { color: colors.textMuted }]}>12</Text>
                  <Text style={[styles.hourLabelText, { color: colors.textMuted }]}>18</Text>
                  <Text style={[styles.hourLabelText, { color: colors.textMuted }]}>24</Text>
                </View>
              </Card>

              {/* Top trigger */}
              {topTrigger ? (
                <Card style={styles.cardSpacing}>
                  <SectionHeader title="En Sık Tetikleyici" icon="git-network" />
                  <View style={styles.topTriggerRow}>
                    <View
                      style={[
                        styles.topTriggerBubble,
                        { backgroundColor: `${TRIGGER_META[topTrigger].color}1F` },
                      ]}
                    >
                      <Text style={styles.topTriggerEmoji}>
                        {TRIGGER_META[topTrigger].emoji}
                      </Text>
                    </View>
                    <View style={styles.topTriggerText}>
                      <Text style={[styles.topTriggerLabel, { color: colors.text }]}>
                        {TRIGGER_META[topTrigger].label}
                      </Text>
                      <Text style={[styles.topTriggerCount, { color: colors.textMuted }]}>
                        {stats.byTrigger[topTrigger]} kayıt
                      </Text>
                    </View>
                  </View>
                </Card>
              ) : null}

              {/* History */}
              <Card style={styles.cardSpacing}>
                <SectionHeader title="Geçmiş" icon="list" meta={`${entries.length}`} />
                <View style={styles.historyList}>
                  {entries.slice(0, 20).map((entry) => {
                    const meta = TRIGGER_META[entry.trigger];
                    const date = new Date(entry.createdAt);
                    return (
                      <View
                        key={entry.id}
                        style={[
                          styles.historyRow,
                          { borderBottomColor: colors.cardBorder },
                        ]}
                      >
                        <Text style={styles.historyEmoji}>{meta.emoji}</Text>
                        <View style={styles.historyMain}>
                          <View style={styles.historyTopLine}>
                            <Text style={[styles.historyTrigger, { color: colors.text }]}>
                              {meta.label} · {entry.intensity}/10
                            </Text>
                            <View
                              style={[
                                styles.outcomeChip,
                                {
                                  backgroundColor: entry.resisted
                                    ? `${colors.success}1A`
                                    : `${colors.danger}1A`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.outcomeText,
                                  { color: entry.resisted ? colors.success : colors.danger },
                                ]}
                              >
                                {entry.resisted ? "DİRENDİM" : "OYNADIM"}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                            {date.toLocaleString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                          {entry.note ? (
                            <Text style={[styles.historyNote, { color: colors.text }]}>
                              {entry.note}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemove(entry.id)}
                          style={styles.historyDelete}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel="Sil"
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </Card>
            </>
          ) : null}

          {entries.length === 0 && !composing ? (
            <Card style={styles.cardSpacing}>
              <View style={styles.emptyState}>
                <Ionicons name="pulse-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  İlk kaydını bekliyoruz
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  Dürtü hissettiğinde — direnmiş olsan da olmasan da — kısa bir kayıt al.
                  Bir aylık verin patern görünür hale getirir.
                </Text>
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
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 19 },

  startBtn: { marginBottom: 14 },
  cardSpacing: { marginBottom: 14 },

  fieldLabel: { fontSize: 13, fontWeight: "800", marginBottom: 8 },
  intensityRow: { flexDirection: "row", gap: 4 },
  intensityPip: {
    flex: 1,
    aspectRatio: 1,
    minWidth: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  intensityText: { fontSize: 12, fontWeight: "800" },

  triggerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  triggerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  triggerEmoji: { fontSize: 16 },
  triggerLabel: { fontSize: 12, fontWeight: "700" },

  resistRow: { flexDirection: "row", gap: 10 },
  resistOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resistText: { fontSize: 14, fontWeight: "800" },

  noteInput: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    minHeight: 70,
    borderWidth: 1,
    textAlignVertical: "top",
  },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionPrimary: { flex: 1 },

  statRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  statBox: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  statDivider: { width: 1, height: 32 },

  hourChart: {
    flexDirection: "row",
    height: 100,
    alignItems: "flex-end",
    gap: 2,
    marginTop: 8,
  },
  hourCol: { flex: 1, height: "100%", justifyContent: "flex-end" },
  hourBar: { width: "100%", borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  hourLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 2,
  },
  hourLabelText: { fontSize: 10, fontWeight: "700" },

  topTriggerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  topTriggerBubble: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  topTriggerEmoji: { fontSize: 30 },
  topTriggerText: { flex: 1 },
  topTriggerLabel: { fontSize: 18, fontWeight: "900" },
  topTriggerCount: { fontSize: 12, fontWeight: "700", marginTop: 2 },

  historyList: { gap: 0 },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyEmoji: { fontSize: 22, marginTop: 2 },
  historyMain: { flex: 1 },
  historyTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  historyTrigger: { fontSize: 13, fontWeight: "800", flex: 1 },
  outcomeChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  outcomeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  historyDate: { fontSize: 11, fontWeight: "600" },
  historyNote: { fontSize: 12, lineHeight: 17, marginTop: 4, fontStyle: "italic" },
  historyDelete: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800" },
  emptyHint: { fontSize: 13, lineHeight: 18, textAlign: "center", maxWidth: 300 },
});
