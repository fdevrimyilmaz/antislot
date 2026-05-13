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

type TimeBucket = "sabah" | "ogle" | "aksam" | "gece";
type LocationBucket = "ev" | "is" | "disari" | "yatakta";
type EmotionBucket = "stres" | "sikinti" | "kayip" | "ofke" | "yalniz";
type ReasonBucket = "telafi" | "eglence" | "para" | "aliskanlik";

type TriggerProfile = {
  times: TimeBucket[];
  locations: LocationBucket[];
  emotions: EmotionBucket[];
  reasons: ReasonBucket[];
};

const TIME_OPTIONS: { id: TimeBucket; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "sabah", label: "Sabah", icon: "sunny" },
  { id: "ogle", label: "Öğle", icon: "partly-sunny" },
  { id: "aksam", label: "Akşam", icon: "moon" },
  { id: "gece", label: "Gece geç", icon: "star" },
];

const LOCATION_OPTIONS: { id: LocationBucket; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "ev", label: "Ev", icon: "home" },
  { id: "is", label: "İş / Okul", icon: "briefcase" },
  { id: "disari", label: "Dışarı", icon: "walk" },
  { id: "yatakta", label: "Yatakta", icon: "bed" },
];

const EMOTION_OPTIONS: { id: EmotionBucket; label: string; emoji: string }[] = [
  { id: "stres", label: "Stres", emoji: "😰" },
  { id: "sikinti", label: "Sıkıntı", emoji: "😩" },
  { id: "kayip", label: "Kayıp acısı", emoji: "💸" },
  { id: "ofke", label: "Öfke", emoji: "😡" },
  { id: "yalniz", label: "Yalnızlık", emoji: "😔" },
];

const REASON_OPTIONS: { id: ReasonBucket; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "telafi", label: "Kaybı telafi", icon: "repeat" },
  { id: "eglence", label: "Eğlence", icon: "happy" },
  { id: "para", label: "Para kazanmak", icon: "cash" },
  { id: "aliskanlik", label: "Alışkanlık", icon: "infinite" },
];

const STORE_KEY = "antislot_trigger_profile";

const COPING_TIPS: Record<string, string> = {
  // Time
  sabah:
    "Sabah dürtüsü için: telefonu yataktan uzakta tut, ilk 30 dk güneş ışığı + su.",
  ogle:
    "Öğle dürtüsü için: yemek sırasında ekranı kapat, 10 dk yürüyüş.",
  aksam:
    "Akşam dürtüsü için: yemek sonrası tetikleyici uygulamaları gizle, kitap/dizi alternatifi koy.",
  gece:
    "Gece geç dürtüsü için: ekranları 22:00'de kapat, oda ısısı 18-20°C, melatonin saatini koru.",
  // Location
  ev:
    "Evde tetikleniyorsan: koltuk değiştir, oturma odasını 15 dk düzenle, oda terapisi yap.",
  is:
    "İşte tetikleniyorsan: dürtü geldiğinde dışarı 5 dk çık, su + 10 derin nefes.",
  disari:
    "Dışarıda tetikleniyorsan: yanına meşgul edici şey al (podcast, kitap), bahis sitesi açma alışkanlığını kırmak için telefonu çantanda tut.",
  yatakta:
    "Yatakta tetikleniyorsan: yatağı sadece uyku için kullan; telefon yatak odasında kalmasın.",
  // Emotion
  stres:
    "Stres tetikleyici ise: kumar geçici rahatlama verir, sonra stresi 2x yükseltir. 60 sn nefes + 1 fincan su = aynı etkinin 1/10'u, kaybı yok.",
  sikinti:
    "Sıkıntı dürtü kapısıdır. Boş zaman planı yap: hafta sonu için 3 küçük plan + 1 büyük amaç.",
  kayip:
    "Kayıp peşinde koşmak, kayıp tuzağıdır. Bir önceki kayıp bir sonraki bahsi etkilemez. Bir kişi ile konuş.",
  ofke:
    "Öfke + kumar = kaybedilmiş hafta. Önce öfkeyi indir: 20 şınav, soğuk yüz duşu, sesli nefes.",
  yalniz:
    "Yalnızlık dopamin açlığını taklit eder. Bir kişiye ulaş. Tek bir mesaj bile yeter.",
  // Reason
  telafi:
    "Kumara 'kaybı telafi' için dönmek matematiksel olarak en pahalı stratejidir. Önceki kayıplar batık maliyettir.",
  eglence:
    "Aynı dopamin atışı için: takım sporu, hızlı yürüyüş, soğuk şok, ağır müzik + dans. Hepsi kayıpsız.",
  para:
    "Para kazanmak için kumar = pazarlık şansı %0. Aynı saatte yarı pasif gelir: borsa endeksi, freelance, ikinci dil.",
  aliskanlik:
    "Alışkanlık tetikleyici-rutin-ödül üçlüsüdür. Tetikleyici aynı kalsa bile rutin değiştir: dürtü → 10 derin nefes → su iç.",
};

export default function TriggerMapModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const [premiumActive, setPremiumActive] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<TriggerProfile>({
    times: [],
    locations: [],
    emotions: [],
    reasons: [],
  });
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const state = await getPremiumState();
        setPremiumActive(state.isActive);
        const raw = await SecureStore.getItemAsync(STORE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as TriggerProfile;
          if (parsed && typeof parsed === "object") {
            setProfile({
              times: Array.isArray(parsed.times) ? parsed.times : [],
              locations: Array.isArray(parsed.locations) ? parsed.locations : [],
              emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
              reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
            });
            if (
              parsed.times.length +
                parsed.locations.length +
                parsed.emotions.length +
                parsed.reasons.length >
              0
            ) {
              setDone(true);
            }
          }
        }
      } catch (error) {
        reportError(error, { scope: "triggerMap.load", level: "warning" });
        setPremiumActive(false);
      }
    })();
  }, []);

  const toggle = <K extends keyof TriggerProfile>(category: K, id: TriggerProfile[K][number]) => {
    haptics.selection();
    setProfile((prev) => {
      const existing = prev[category] as string[];
      const next = existing.includes(id as string)
        ? existing.filter((x) => x !== (id as string))
        : [...existing, id as string];
      return { ...prev, [category]: next } as TriggerProfile;
    });
  };

  const totalSelected = useMemo(
    () =>
      profile.times.length +
      profile.locations.length +
      profile.emotions.length +
      profile.reasons.length,
    [profile]
  );

  const handleSave = async () => {
    if (totalSelected === 0) {
      haptics.warning();
      toast.warning("En az bir tetikleyici seç.", "Eksik");
      return;
    }
    haptics.tapMedium();
    try {
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(profile));
      haptics.success();
      setDone(true);
      toast.success("Tetikleyici haritan güncellendi.", "Kaydedildi");
    } catch (error) {
      reportError(error, { scope: "triggerMap.save" });
      haptics.error();
      toast.error("Kayıt yapılamadı.", "Hata");
    }
  };

  const handleReset = async () => {
    haptics.warning();
    try {
      await SecureStore.deleteItemAsync(STORE_KEY);
      setProfile({ times: [], locations: [], emotions: [], reasons: [] });
      setDone(false);
    } catch (error) {
      reportError(error, { scope: "triggerMap.reset" });
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
                Tetikleyici Haritası
              </Text>
              <Text style={styles.heroSubtitle}>
                Saat · Mekân · Duygu · Sebep — kişisel tetikleyici profilini çıkar,
                her tetikleyici için özel baş etme önerisi al.
              </Text>
            </LinearGradient>

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
            colors={["#8B6614", "#7A580F", "#5A4108"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="git-network" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="map" size={11} color="#FFD074" />
              <Text style={styles.heroBadgeText}>HARİTA</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Tetikleyici Haritası
            </Text>
            <Text style={styles.heroSubtitle}>
              Senin için en riskli saat, yer, duygu ve sebep kombinasyonunu işaretle.
              Her birine özel öneri alacaksın.
            </Text>
          </LinearGradient>

          {/* Time */}
          <Card style={styles.cardSpacing}>
            <SectionHeader title="Hangi saatlerde?" icon="time" />
            <View style={styles.optionGrid}>
              {TIME_OPTIONS.map((opt) => (
                <ChipOption
                  key={opt.id}
                  active={profile.times.includes(opt.id)}
                  onPress={() => toggle("times", opt.id)}
                  icon={opt.icon}
                  label={opt.label}
                  primary={colors.primary}
                  textColor={colors.text}
                  border={colors.cardBorder}
                  card={colors.card}
                  muted={colors.textMuted}
                />
              ))}
            </View>
          </Card>

          {/* Location */}
          <Card style={styles.cardSpacing}>
            <SectionHeader title="Hangi yerlerde?" icon="location" />
            <View style={styles.optionGrid}>
              {LOCATION_OPTIONS.map((opt) => (
                <ChipOption
                  key={opt.id}
                  active={profile.locations.includes(opt.id)}
                  onPress={() => toggle("locations", opt.id)}
                  icon={opt.icon}
                  label={opt.label}
                  primary={colors.primary}
                  textColor={colors.text}
                  border={colors.cardBorder}
                  card={colors.card}
                  muted={colors.textMuted}
                />
              ))}
            </View>
          </Card>

          {/* Emotion */}
          <Card style={styles.cardSpacing}>
            <SectionHeader title="Hangi duygularda?" icon="heart" />
            <View style={styles.optionGrid}>
              {EMOTION_OPTIONS.map((opt) => {
                const isActive = profile.emotions.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => toggle("emotions", opt.id)}
                    style={[
                      styles.emotionChip,
                      {
                        backgroundColor: isActive ? `${colors.primary}14` : colors.card,
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isActive }}
                  >
                    <Text style={styles.emotionEmoji}>{opt.emoji}</Text>
                    <Text
                      style={[
                        styles.emotionLabel,
                        { color: isActive ? colors.primary : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Reason */}
          <Card style={styles.cardSpacing}>
            <SectionHeader title="Sebep nedir?" icon="help-circle" />
            <View style={styles.optionGrid}>
              {REASON_OPTIONS.map((opt) => (
                <ChipOption
                  key={opt.id}
                  active={profile.reasons.includes(opt.id)}
                  onPress={() => toggle("reasons", opt.id)}
                  icon={opt.icon}
                  label={opt.label}
                  primary={colors.primary}
                  textColor={colors.text}
                  border={colors.cardBorder}
                  card={colors.card}
                  muted={colors.textMuted}
                />
              ))}
            </View>
          </Card>

          {/* Save */}
          <Button
            title={done ? "Güncelle" : "Haritayı Kaydet"}
            onPress={handleSave}
            disabled={totalSelected === 0}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon="save"
            style={styles.saveBtn}
          />

          {/* Personalised tips */}
          {done && totalSelected > 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Sana özel baş etme önerileri"
                icon="bulb"
                subtitle={`${totalSelected} tetikleyici için kişisel rehber.`}
              />
              <View style={styles.tipList}>
                {[
                  ...profile.times,
                  ...profile.locations,
                  ...profile.emotions,
                  ...profile.reasons,
                ].map((id) => (
                  <View key={id} style={styles.tipRow}>
                    <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.tipText, { color: colors.text }]}>
                      {COPING_TIPS[id] ?? id}
                    </Text>
                  </View>
                ))}
              </View>
              <Button
                title="Haritayı Sıfırla"
                onPress={handleReset}
                variant="secondary"
                fullWidth
                leftIcon="refresh"
                style={styles.resetBtn}
              />
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ChipOption({
  active,
  onPress,
  icon,
  label,
  primary,
  textColor,
  border,
  card,
  muted,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  primary: string;
  textColor: string;
  border: string;
  card: string;
  muted: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? `${primary}14` : card,
          borderColor: active ? primary : border,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={active ? primary : muted} />
      <Text
        style={[
          styles.chipLabel,
          { color: active ? primary : textColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
    backgroundColor: "rgba(255,208,116,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,208,116,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FFD074",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 19 },

  unlockBtn: { marginTop: 4 },

  cardSpacing: { marginBottom: 14 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: { fontSize: 13, fontWeight: "700" },
  emotionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emotionEmoji: { fontSize: 18 },
  emotionLabel: { fontSize: 13, fontWeight: "700" },

  saveBtn: { marginBottom: 14 },
  tipList: { gap: 10 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  tipText: { fontSize: 13, lineHeight: 19, flex: 1 },
  resetBtn: { marginTop: 14 },
});
