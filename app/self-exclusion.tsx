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
  formatRemaining,
  isLockoutActive,
  remainingMs,
  useLockoutStore,
} from "@/store/lockoutStore";

type Preset = {
  days: number;
  label: string;
  hint: string;
};

const PRESETS: Preset[] = [
  { days: 1, label: "24 saat", hint: "İlk soğuma — kısa bir nefes." },
  { days: 7, label: "7 gün", hint: "Bir hafta — dürtü pikleri belirginleşir." },
  { days: 30, label: "30 gün", hint: "Bir ay — beyin ödül sistemi yatışmaya başlar." },
  { days: 90, label: "90 gün", hint: "Üç ay — uyku, odak, ilişkiler düzelir." },
  { days: 180, label: "6 ay", hint: "Yarım yıl — yeni alışkanlıklar yerleşir." },
  { days: 365, label: "1 yıl", hint: "Kalıcı kimlik değişimi için en güçlü adım." },
];

const LOCKED_FEATURES = [
  "Kumar takibini kapatamazsın (En az bir bağımlılık seçili kalır).",
  "Streak sayacını sıfırlayamazsın.",
  "Bağımlılık verilerini silemezsin.",
  "Bu süreyi kısaltamazsın — verdiğin söz koruma altında.",
];

export default function SelfExclusionScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { state, hydrated, hydrate, activate, refresh } = useLockoutStore();

  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [activating, setActivating] = useState(false);

  // Hydrate once, then re-check expiry every minute so the countdown ticks
  // even when the user stays on the screen.
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!isLockoutActive(state)) return;
    const id = setInterval(() => refresh(), 60_000);
    return () => clearInterval(id);
  }, [state, refresh]);

  // Re-render every second so the remaining-time text updates smoothly.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isLockoutActive(state)) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  const remaining = useMemo(() => remainingMs(state), [state]);
  const remainingLabel = useMemo(() => formatRemaining(remaining), [remaining]);
  const progressPct = useMemo(() => {
    if (!state) return 0;
    const total = state.endsAt - state.startedAt;
    if (total <= 0) return 100;
    const elapsed = Date.now() - state.startedAt;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, [state, remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const formattedEnd = useMemo(() => {
    if (!state) return "";
    return new Date(state.endsAt).toLocaleString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [state]);

  const handleSelectPreset = (days: number) => {
    haptics.selection();
    setSelectedDays(days);
  };

  const handleStart = () => {
    if (note.trim().length < 8) {
      haptics.warning();
      toast.warning("En az 8 karakterlik bir niyet cümlesi yaz.", "Niyet eksik");
      return;
    }
    haptics.tapMedium();
    setConfirming(true);
  };

  const handleConfirmActivate = () => {
    Alert.alert(
      "Onayla: Öz-Kısıtlama",
      `${selectedDays} gün boyunca bazı işlemleri yapamayacaksın. Bu süre kısaltılamaz. Devam edilsin mi?`,
      [
        { text: "Vazgeç", style: "cancel", onPress: () => setConfirming(false) },
        {
          text: "Aktive Et",
          style: "destructive",
          onPress: async () => {
            setActivating(true);
            haptics.tapHeavy();
            try {
              await activate({ durationDays: selectedDays, note: note.trim() });
              haptics.success();
              toast.success(
                `${selectedDays} günlük koruma başlatıldı.`,
                "Aktif"
              );
            } catch (error) {
              reportError(error, { scope: "self-exclusion.activate" });
              haptics.error();
              toast.error("Aktive edilemedi.", "Hata");
            } finally {
              setActivating(false);
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  const showActiveScreen = isLockoutActive(state);

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
            Öz-Kısıtlama
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Krizde değil, sakin anında ver kararı. Seçtiğin süre boyunca
            uygulamadaki bazı işlemler kilitlenir — bu, kendine verdiğin sözün
            koruyucusudur.
          </Text>

          {showActiveScreen ? (
            <ActiveLockoutCard
              note={state!.note}
              durationDays={state!.durationDays}
              remainingLabel={remainingLabel}
              endsAtLabel={formattedEnd}
              progressPct={progressPct}
              colors={colors}
            />
          ) : (
            <>
              <Card style={styles.cardSpacing}>
                <SectionHeader
                  title="Süre seç"
                  icon="timer"
                  subtitle="Süre dolmadan değiştirilemez. Geri çevirme yok."
                />
                <View style={styles.presetGrid}>
                  {PRESETS.map((p) => {
                    const selected = p.days === selectedDays;
                    return (
                      <TouchableOpacity
                        key={p.days}
                        activeOpacity={0.85}
                        onPress={() => handleSelectPreset(p.days)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${p.label}: ${p.hint}`}
                        style={[
                          styles.presetCard,
                          {
                            backgroundColor: selected
                              ? `${colors.primary}14`
                              : colors.card,
                            borderColor: selected
                              ? colors.primary
                              : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.presetLabel, { color: colors.text }]}
                        >
                          {p.label}
                        </Text>
                        <Text
                          style={[
                            styles.presetHint,
                            { color: colors.textMuted },
                          ]}
                        >
                          {p.hint}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>

              <Card style={styles.cardSpacing}>
                <SectionHeader
                  title="Niyetin ne?"
                  icon="create"
                  subtitle="Krizde okuyacağın cümle — neden bu sözü verdiğini yaz."
                />
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Örn: Kızımın eğitimi için, kendime saygıyı geri kazanmak için."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.noteInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  accessibilityLabel="Niyet cümlesi"
                  maxLength={240}
                />
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {note.trim().length}/240
                </Text>
              </Card>

              <Card style={styles.cardSpacing}>
                <SectionHeader
                  title="Bu süre boyunca"
                  icon="lock-closed"
                  subtitle="Şu işlemler kilitli kalır:"
                />
                {LOCKED_FEATURES.map((line, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View
                      style={[
                        styles.bulletDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={[styles.bulletText, { color: colors.text }]}
                    >
                      {line}
                    </Text>
                  </View>
                ))}
              </Card>

              <Card
                style={[
                  styles.cardSpacing,
                  { backgroundColor: `${colors.warning}14` },
                ]}
              >
                <View style={styles.warningRow}>
                  <Ionicons
                    name="warning"
                    size={20}
                    color={colors.warning}
                  />
                  <Text
                    style={[styles.warningText, { color: colors.text }]}
                  >
                    Dürüst söyleyelim: bu özellik telefondaki bahis sitelerini
                    veya uygulamalarını engellemez. Uygulama içindeki kararları
                    önceden kilitler — kriz anında kendini durdurman için.
                  </Text>
                </View>
              </Card>

              <Button
                title={
                  activating
                    ? "Aktive ediliyor"
                    : confirming
                    ? "Onayla ve başlat"
                    : `${selectedDays} gün boyunca kilitle`
                }
                onPress={confirming ? handleConfirmActivate : handleStart}
                disabled={activating}
                loading={activating}
                variant="destructive"
                fullWidth
                size="lg"
                leftIcon="shield-checkmark"
                style={styles.activateBtn}
              />
              {confirming ? (
                <Button
                  title="Vazgeç"
                  onPress={() => setConfirming(false)}
                  variant="ghost"
                  fullWidth
                  style={styles.cancelBtn}
                />
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type ActiveLockoutProps = {
  note: string;
  durationDays: number;
  remainingLabel: string;
  endsAtLabel: string;
  progressPct: number;
  colors: ReturnType<typeof useTheme>["colors"];
};

function ActiveLockoutCard({
  note,
  durationDays,
  remainingLabel,
  endsAtLabel,
  progressPct,
  colors,
}: ActiveLockoutProps) {
  return (
    <>
      <Card variant="hero" padding={22} style={styles.heroCard}>
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.heroBadgeText}>AKTİF KORUMA</Text>
          </View>
        </View>
        <Text style={styles.heroRemaining}>{remainingLabel}</Text>
        <Text style={styles.heroSub}>kaldı</Text>

        <View style={styles.heroProgressTrack}>
          <View
            style={[
              styles.heroProgressFill,
              { width: `${progressPct}%` },
            ]}
          />
        </View>
        <Text style={styles.heroProgressMeta}>
          {progressPct}% tamamlandı · {durationDays} günlük taahhüt
        </Text>
      </Card>

      <Card style={styles.cardSpacing}>
        <SectionHeader
          title="Niyetin"
          icon="heart"
          subtitle={`Sona erecek: ${endsAtLabel}`}
        />
        <Text
          style={[styles.noteDisplay, { color: colors.text }]}
        >
          “{note || "Bugün kendime sözüm: temiz kalmak."}”
        </Text>
      </Card>

      <Card style={styles.cardSpacing}>
        <SectionHeader
          title="Kilitli işlemler"
          icon="lock-closed"
          subtitle="Süre dolana kadar bu işlemler kapalı."
        />
        {LOCKED_FEATURES.map((line, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <Ionicons name="lock-closed" size={14} color={colors.primary} />
            <Text
              style={[
                styles.bulletText,
                { color: colors.text, marginLeft: 8 },
              ]}
            >
              {line}
            </Text>
          </View>
        ))}
      </Card>

      <Card style={[styles.cardSpacing, { backgroundColor: `${colors.danger}10` }]}>
        <View style={styles.warningRow}>
          <Ionicons name="information-circle" size={18} color={colors.danger} />
          <Text style={[styles.warningText, { color: colors.text }]}>
            Süre dolmadan iptal yoktur. Krizde SOS&apos;a basabilir, kriz planını
            okuyabilir, destek hattını arayabilirsin.
          </Text>
        </View>
      </Card>

      <Button
        title="SOS'a Git"
        onPress={() => router.push("/sos")}
        variant="primary"
        fullWidth
        leftIcon="medkit"
        style={styles.activateBtn}
      />
    </>
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

  cardSpacing: { marginBottom: 14 },

  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  presetCard: {
    width: "47.5%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetLabel: { fontSize: 16, fontWeight: "800" },
  presetHint: { fontSize: 12, marginTop: 4, lineHeight: 16 },

  noteInput: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, marginTop: 6, textAlign: "right" },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: { fontSize: 13, lineHeight: 18, flex: 1 },

  warningRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  warningText: { fontSize: 12, lineHeight: 18, flex: 1 },

  activateBtn: { marginTop: 6 },
  cancelBtn: { marginTop: 8 },

  heroCard: {
    marginBottom: 14,
    alignItems: "center",
  },
  heroBadgeRow: {
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
  },
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
  heroRemaining: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  heroProgressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: 18,
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  heroProgressMeta: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  noteDisplay: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
    fontWeight: "600",
  },
});
