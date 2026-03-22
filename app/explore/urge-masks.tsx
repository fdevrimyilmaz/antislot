import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MaskItem = {
  id: string;
  badge: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  moveTr: string;
  moveEn: string;
};

const MASKS: MaskItem[] = [
  {
    id: "boredom",
    badge: "BORED",
    titleTr: "Sikilma maskesi",
    titleEn: "Boredom mask",
    descTr:
      "Bazen durtu, bosluk hissini kapatmanin hizli yolu gibi gelir. Asil ihtiyac, uyarici ve anlamli bir aktivite olabilir.",
    descEn:
      "Sometimes the urge feels like a fast way to fill emptiness. The real need may be stimulation and meaningful activity.",
    moveTr: "5 dakikalik fiziksel aktivite veya kisa yuruyus dene.",
    moveEn: "Try 5 minutes of movement or a short walk.",
  },
  {
    id: "stress",
    badge: "STRESS",
    titleTr: "Stres maskesi",
    titleEn: "Stress mask",
    descTr:
      "Yuksek gerilimde beyin hizli rahatlama arar. Durtu, rahatlama ihtiyacinin gorunen yuzu olabilir.",
    descEn:
      "Under high tension, the brain looks for fast relief. The urge may be the visible face of that need.",
    moveTr: "60 saniye nefes egzersizi + omuzlari gevset.",
    moveEn: "Do 60 seconds of breathing and release shoulder tension.",
  },
  {
    id: "escape",
    badge: "ESCAPE",
    titleTr: "Kacis maskesi",
    titleEn: "Escape mask",
    descTr:
      "Zor duygu ve sorumluluklardan uzaklasma istegi, durtuyu tetikleyebilir. Konu kumar degil, kacma ihtiyaci olabilir.",
    descEn:
      "The need to avoid difficult emotions or responsibilities can trigger urges. The core issue may be escape, not gambling.",
    moveTr: "Kacindigin tek gorevi sec, sadece 2 dakika basla.",
    moveEn: "Pick one avoided task and start it for just 2 minutes.",
  },
  {
    id: "reward",
    badge: "REWARD",
    titleTr: "Odul maskesi",
    titleEn: "Reward mask",
    descTr:
      "Beyin hizli odul beklediginde riskli secenekler daha cekici gorunur. Bu durum ozellikle yorgunlukta artar.",
    descEn:
      "When the brain expects quick reward, risky choices look more attractive. This often rises with fatigue.",
    moveTr: "Kucuk bir guvenli odul sec: muzik, dus, kahve molasi.",
    moveEn: "Choose a safe mini-reward: music, shower, coffee break.",
  },
  {
    id: "control",
    badge: "CONTROL",
    titleTr: "Kontrol illuzyonu maskesi",
    titleEn: "Control illusion mask",
    descTr:
      "'Bu sefer kontrol bende' dusuncesi karar kalitesini dusurebilir. Sonuclarin sans tabanli oldugunu hatirlamak denge getirir.",
    descEn:
      "The thought 'I control it this time' can lower decision quality. Remembering outcomes are chance-based restores balance.",
    moveTr: "Kisa gercek kontrol sorusu sor: 'Neyi gercekten kontrol edebilirim?'",
    moveEn: "Ask a control check: 'What can I truly control right now?'",
  },
];

export default function UrgeMasksScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.exploreModules.urgeMasks.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.exploreModules.urgeMasks.subtitle}</Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {isTr
              ? "Durtu cogu zaman tek bir duygu degildir. Hangi maskeyi tasidigini anlarsan, daha dogru bir karsilik secebilirsin."
              : "An urge is rarely a single feeling. If you identify its mask, you can choose a better response."}
          </Text>
        </View>

        <View style={styles.cardList}>
          {MASKS.map((mask) => (
            <View key={mask.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHead}>
                <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{mask.badge}</Text>
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{isTr ? mask.titleTr : mask.titleEn}</Text>
              </View>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                {isTr ? mask.descTr : mask.descEn}
              </Text>
              <View style={[styles.actionBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.actionLabel, { color: colors.primary }]}>{isTr ? "Hemen dene" : "Try now"}</Text>
                <Text style={[styles.actionBody, { color: colors.textSecondary }]}>
                  {isTr ? mask.moveTr : mask.moveEn}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {isTr
              ? "Bu ekran farkindalik icindir. Eger kendini cok zorlanmis hissediyorsan SOS ekranina gec."
              : "This screen is for awareness. If you feel heavily overwhelmed, switch to SOS."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  cardList: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.3,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  actionBox: {
    // borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginTop: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  actionBody: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 19,
  },
  footer: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});
