import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Topic = {
  id: string;
  titleTr: string;
  titleEn: string;
  whatHappensTr: string;
  whatHappensEn: string;
  watchForTr: string;
  watchForEn: string;
  responseTr: string;
  responseEn: string;
};

const TOPICS: Topic[] = [
  {
    id: "variable-reward",
    titleTr: "Degisken odul dongusu",
    titleEn: "Variable reward loop",
    whatHappensTr:
      "Kazanc aralikli gelince beyin bir sonraki denemeyi daha cazip algilar. Belirsizlik, davranisi daha uzun sure devam ettirebilir.",
    whatHappensEn:
      "When rewards are intermittent, the brain treats the next try as more attractive. Uncertainty can keep behavior going longer.",
    watchForTr: "Kendini surekli bir sonraki denemeyi dusunurken yakalamak.",
    watchForEn: "Catching yourself constantly thinking about the next attempt.",
    responseTr: "3 dakikalik gecikme koy ve tetikleyici ekrandan fiziksel olarak uzaklas.",
    responseEn: "Add a 3-minute delay and physically move away from the trigger screen.",
  },
  {
    id: "near-miss",
    titleTr: "Yakin kazanma etkisi",
    titleEn: "Near-miss effect",
    whatHappensTr:
      "Neredeyse kazanma hissi, beyin icin gercek kazanca benzer bir sinyal uretebilir. Bu durum tekrar deneme istegini artirir.",
    whatHappensEn:
      "An almost-win can send a reward-like signal in the brain. That increases the urge to try again.",
    watchForTr: "Bir sonuctan sonra icinden 'az kaldi' demen.",
    watchForEn: "Noticing the thought 'I was close' right after an outcome.",
    responseTr: "Sonucun sans oldugunu yuksek sesle adlandir: 'Bu kontrol edilebilir degil.'",
    responseEn: "Name chance out loud: 'This outcome is not controllable.'",
  },
  {
    id: "time-distortion",
    titleTr: "Zaman algisi kaymasi",
    titleEn: "Time distortion",
    whatHappensTr:
      "Yuksek uyaran ve hizli gecisler zaman hissini zayiflatir. Kisa sure gibi gelen deneyim gercekte daha uzundur.",
    whatHappensEn:
      "High stimulation and rapid transitions weaken time awareness. A short-feeling session is often much longer.",
    watchForTr: "Planladigindan gec saatlere sarkmak.",
    watchForEn: "Running past your planned end time.",
    responseTr: "Baslamadan once cikis saati belirle ve sesli alarm kur.",
    responseEn: "Set an end time before you start and use an audible alarm.",
  },
  {
    id: "personalized-triggers",
    titleTr: "Kisisel tetikleyici tasarimi",
    titleEn: "Personalized trigger design",
    whatHappensTr:
      "Platformlar davranis kaliplariyla uyumlu icerik ve teklif sunabilir. Bu, otomatik tepkiyi hizlandirabilir.",
    whatHappensEn:
      "Platforms may align content and offers with behavior patterns. This can speed up automatic reactions.",
    watchForTr: "Ayni saatlerde veya ayni duygu durumunda benzer teklifler gormek.",
    watchForEn: "Seeing similar offers at the same times or emotional states.",
    responseTr: "Riskli saatlerde bildirimleri kapat ve ana ekrani sade tut.",
    responseEn: "Disable notifications in risk windows and keep your home screen minimal.",
  },
];

const CHECKLIST = {
  tr: [
    "Tetikleyiciyi adlandir.",
    "Sureyi sinirla.",
    "Duyguyu not et.",
    "Alternatif eylem sec.",
  ],
  en: [
    "Name the trigger.",
    "Limit the time.",
    "Note the emotion.",
    "Choose an alternative action.",
  ],
};

export default function BrainMapScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.exploreModules.brainMap.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.exploreModules.brainMap.subtitle}</Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {isTr
              ? "Bu ekran, davranisi guclendiren temel psikolojik mekanizmalari sade sekilde gosterir. Hedef sucluluk degil, farkindalik ve kontrol."
              : "This screen maps core psychological mechanisms that reinforce behavior. The goal is not guilt, but awareness and control."}
          </Text>
        </View>

        <View style={styles.cardList}>
          {TOPICS.map((topic) => (
            <View key={topic.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{isTr ? topic.titleTr : topic.titleEn}</Text>

              <Text style={[styles.metaLabel, { color: colors.primary }]}>{isTr ? "Neler oluyor?" : "What happens?"}</Text>
              <Text style={[styles.metaBody, { color: colors.textSecondary }]}>
                {isTr ? topic.whatHappensTr : topic.whatHappensEn}
              </Text>

              <Text style={[styles.metaLabel, { color: colors.primary }]}>{isTr ? "Neye dikkat et?" : "Watch for"}</Text>
              <Text style={[styles.metaBody, { color: colors.textSecondary }]}>
                {isTr ? topic.watchForTr : topic.watchForEn}
              </Text>

              <Text style={[styles.metaLabel, { color: colors.primary }]}>{isTr ? "Hemen yanit" : "Immediate response"}</Text>
              <Text style={[styles.metaBody, { color: colors.textSecondary }]}>
                {isTr ? topic.responseTr : topic.responseEn}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.checklistCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.checklistTitle, { color: colors.text }]}>
            {isTr ? "30 saniyelik kontrol listesi" : "30-second control checklist"}
          </Text>
          {(isTr ? CHECKLIST.tr : CHECKLIST.en).map((item) => (
            <Text key={item} style={[styles.checklistItem, { color: colors.textSecondary }]}>
              {`- ${item}`}
            </Text>
          ))}
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {isTr
              ? "Bu bilgiler egitim amaclidir; tibbi tani veya tedavi yerine gecmez."
              : "This content is educational and does not replace clinical diagnosis or treatment."}
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
    fontFamily: Fonts.bodyMedium,
    lineHeight: 22,
    marginBottom: 12,
  },
  intro: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 20,
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
  cardTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  metaBody: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 20,
    marginBottom: 8,
  },
  checklistCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  checklistTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  checklistItem: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 20,
    marginBottom: 4,
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
