import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import {
  getPledgeStreak,
  getTodayPledge,
  savePledge,
  type PledgeRecord,
} from "@/store/pledgeStore";

const SUGGESTIONS = [
  "Bugün kumar oynamayacağım.",
  "Dürtü gelirse 60 saniye nefes alacağım.",
  "Bahis sitelerini açmayacağım, telefonu uzak tutacağım.",
  "Bugün ailemle birlikte vakit geçireceğim.",
  "Stres geldiğinde yürüyüşe çıkacağım.",
  "Bugünkü kazancım: 1 gün daha temiz olmak.",
];

export default function PledgeModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const [todayPledge, setTodayPledge] = useState<PledgeRecord | null>(null);
  const [streak, setStreak] = useState(0);
  const [intention, setIntention] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const pledge = await getTodayPledge();
        const s = await getPledgeStreak();
        setTodayPledge(pledge);
        setStreak(s);
        if (pledge) setIntention(pledge.intention);
      } catch (error) {
        reportError(error, { scope: "pledge.load", level: "warning" });
      }
    })();
  }, []);

  const handleSave = async () => {
    const trimmed = intention.trim();
    if (trimmed.length < 5) {
      haptics.warning();
      toast.warning("Daha kararlı bir cümle yaz.", "Çok kısa");
      return;
    }
    setSaving(true);
    haptics.tapMedium();
    try {
      const { pledge, streak: nextStreak } = await savePledge(trimmed);
      setTodayPledge(pledge);
      setStreak(nextStreak);
      setEditing(false);
      haptics.success();
      toast.success("Bugünkü sözünü verdin. Buradayız.", "Söz Verildi");
    } catch (error) {
      reportError(error, { scope: "pledge.save" });
      haptics.error();
      toast.error("Söz kaydedilemedi.", "Hata");
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestion = (text: string) => {
    haptics.selection();
    setIntention(text);
  };

  const showForm = !todayPledge || editing;
  const formattedDate = useMemo(() => {
    const date = todayPledge ? new Date(todayPledge.createdAt) : new Date();
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [todayPledge]);

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
              <Ionicons name="hand-right" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="hand-right" size={11} color="#7BB8FF" />
              <Text style={styles.heroBadgeText}>GÜNLÜK SÖZ</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Bugün için söz ver
            </Text>
            <Text style={styles.heroSubtitle}>
              Her sabah küçük, somut bir niyet — büyük değişimin en sağlam
              başlangıcı. Sadece bugün.
            </Text>
            {streak > 0 ? (
              <View style={styles.heroStreak}>
                <Ionicons name="flame" size={14} color="#FF8A66" />
                <Text style={styles.heroStreakText}>
                  {streak} gün üst üste söz verdin
                </Text>
              </View>
            ) : null}
          </LinearGradient>

          {/* Today's pledge (already saved) */}
          {todayPledge && !editing ? (
            <Card style={styles.cardSpacing}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar" size={14} color={colors.primary} />
                <Text style={[styles.dateText, { color: colors.primary }]}>
                  {formattedDate}
                </Text>
                <View style={styles.completedPill}>
                  <Ionicons name="checkmark" size={12} color={colors.success} />
                  <Text style={[styles.completedText, { color: colors.success }]}>
                    SÖZ VERİLDİ
                  </Text>
                </View>
              </View>
              <Text style={[styles.pledgeQuote, { color: colors.text }]}>
                “{todayPledge.intention}”
              </Text>
              <View style={styles.actionRow}>
                <Button
                  title="Sözü Düzenle"
                  onPress={() => {
                    haptics.tapLight();
                    setEditing(true);
                  }}
                  variant="secondary"
                  leftIcon="create"
                />
                <Button
                  title="Günlüğe Ekle"
                  onPress={() => {
                    haptics.tapLight();
                    router.push("/diary");
                  }}
                  variant="primary"
                  rightIcon="arrow-forward"
                  style={styles.actionPrimary}
                />
              </View>
            </Card>
          ) : null}

          {/* Pledge form */}
          {showForm ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Bugünün sözü"
                icon="create"
                subtitle="Tek bir cümle. Ne yapacağına / yapmayacağına dair."
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Bugün kumar oynamayacağım..."
                placeholderTextColor={colors.textMuted}
                value={intention}
                onChangeText={setIntention}
                multiline
                maxLength={200}
                accessibilityLabel="Bugünkü niyet"
              />
              <Text style={[styles.counter, { color: colors.textMuted }]}>
                {intention.length} / 200
              </Text>

              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Hazır örnekler:
              </Text>
              <View style={styles.suggestionList}>
                {SUGGESTIONS.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    onPress={() => handleSuggestion(suggestion)}
                    style={[
                      styles.suggestionChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Örnek: ${suggestion}`}
                  >
                    <Text style={[styles.suggestionText, { color: colors.text }]}>
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title={saving ? "Kaydediliyor" : "Sözümü ver"}
                onPress={handleSave}
                disabled={saving || intention.trim().length < 5}
                loading={saving}
                variant="primary"
                size="lg"
                fullWidth
                leftIcon="hand-right"
                style={styles.saveBtn}
              />
            </Card>
          ) : null}

          <Card style={styles.cardSpacing}>
            <View style={styles.tipRow}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                Neden bir cümle bu kadar güçlü?
              </Text>
            </View>
            <Text style={[styles.tipBody, { color: colors.text }]}>
              Açık niyet, kararı bahse oynayan beynin önüne getirir. Karar
              anında “söz vermiştim” cümlesi, dürtüden 1 saniye önce
              tetiklenir — bu 1 saniye, çoğu zaman yeterlidir.
            </Text>
          </Card>
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
    marginBottom: 12,
  },
  heroStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,138,102,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,138,102,0.36)",
    alignSelf: "flex-start",
  },
  heroStreakText: { color: "#FF8A66", fontSize: 12, fontWeight: "800" },

  cardSpacing: { marginBottom: 14 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dateText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3, flex: 1 },
  completedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(52,211,153,0.16)",
  },
  completedText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  pledgeQuote: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 27,
    fontStyle: "italic",
    marginBottom: 16,
  },
  actionRow: { flexDirection: "row", gap: 10 },
  actionPrimary: { flex: 1 },

  input: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    minHeight: 110,
    borderWidth: 1,
    lineHeight: 22,
    textAlignVertical: "top",
    marginBottom: 4,
  },
  counter: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 14,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  suggestionList: { gap: 6, marginBottom: 14 },
  suggestionChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 13, lineHeight: 18 },
  saveBtn: { marginTop: 4 },

  tipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 15, fontWeight: "800" },
  tipBody: { fontSize: 13, lineHeight: 19 },
});
