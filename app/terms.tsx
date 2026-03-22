import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

type TermsSection = {
  title: string;
  bullets?: string[];
  paragraph?: string;
  showPrivacyLink?: boolean;
};

const TERMS_COPY: Record<
  "tr" | "en",
  {
    title: string;
    subtitle: string;
    sections: TermsSection[];
    privacyLink: string;
    contactEmail: string;
    contactSubject: string;
    backLabel: string;
    emailOpenErrorTitle: string;
    emailOpenErrorBody: string;
  }
> = {
  tr: {
    title: "Kullanim Sartlari",
    subtitle:
      "Antislot destekleyici araclar sunar. Bu sartlar uygulama kullanimina iliskin temel cerceveyi aciklar.",
    sections: [
      {
        title: "Temel Kosullar",
        bullets: [
          "Bu uygulama profesyonel tibbi/psikolojik hizmetin yerine gecmez.",
          "Kumar engelleme %100 garanti edilemez (DoH, uygulama ici tarayici, platform limitleri).",
          "VPN/Network Extension yalnizca kullanici onayi ile etkinlesir.",
          "Kullanici kendi kararlarindan sorumludur.",
        ],
      },
      {
        title: "Yas Politikasi",
        bullets: [
          "Uygulama 18 yas ve uzeri kullanicilar icin tasarlanmistir.",
          "18 yas alti bireyler uygulamayi ebeveyn/yasal temsilci yonlendirmesi olmadan kullanmamalidir.",
          "18 yas alti veri islendigine dair tespit olursa makul surede silme sureci baslatilir.",
        ],
      },
      {
        title: "Kriz ve Guvenlik Uyarisi",
        bullets: [
          "Kendine zarar, baskasina zarar veya acil risk durumunda uygulama yerine acil yardim hatlarini kullanin.",
          "Turkiye icin 112, ABD icin 988 gibi yerel kriz hatlari onceliklidir.",
          "Uygulama kriz yonlendirmesi sunar ancak acil mudahale hizmeti degildir.",
        ],
      },
      {
        title: "Veri Saklama ve Destek Sureci",
        bullets: [
          "Veri saklama sureleri, silme talebi akisi ve destek sureci Gizlilik Politikasi'nda detaylandirilir.",
          "Silme ve KVKK/GDPR talepleri icin support@antislot.app adresine e-posta gonderin.",
          "Taleplere en gec 30 gun icinde donus yapilir (SLA).",
          "Gizlilik Politikasini inceleyerek guncel bilgileri goruntuleyebilirsiniz.",
        ],
        showPrivacyLink: true,
      },
      {
        title: "Iletisim",
        paragraph: "Yasal veya guvenlik konulari icin support@antislot.app adresine ulasabilirsiniz.",
      },
    ],
    privacyLink: "Gizlilik Politikasini Goster",
    contactEmail: "support@antislot.app",
    contactSubject: "Terms Question",
    backLabel: "Geri",
    emailOpenErrorTitle: "Hata",
    emailOpenErrorBody: "E-posta uygulamasi acilamadi.",
  },
  en: {
    title: "Terms of Use",
    subtitle:
      "Antislot provides supportive tools. These terms describe the baseline framework for app usage.",
    sections: [
      {
        title: "Core Conditions",
        bullets: [
          "This app does not replace professional medical or psychological care.",
          "Gambling blocking cannot be guaranteed 100% (DoH, in-app browsers, platform limits).",
          "VPN/Network Extension can only be enabled with user consent.",
          "Users are responsible for their own decisions.",
        ],
      },
      {
        title: "Age Policy",
        bullets: [
          "The app is designed for users aged 18 and above.",
          "Users under 18 should not use the app without parent/legal guardian guidance.",
          "If under-18 data processing is detected, deletion workflows are initiated within reasonable time.",
        ],
      },
      {
        title: "Crisis and Safety Notice",
        bullets: [
          "For self-harm, harm-to-others, or urgent risk, use emergency services instead of the app.",
          "Local crisis lines such as 112 (Turkey) or 988 (US) must be prioritized.",
          "The app provides crisis guidance but is not an emergency intervention service.",
        ],
      },
      {
        title: "Data Retention and Support Process",
        bullets: [
          "Retention periods, deletion flow, and support process are detailed in the Privacy Policy.",
          "For deletion and KVKK/GDPR requests, email support@antislot.app.",
          "Requests are answered within 30 days at the latest (SLA).",
          "Refer to the Privacy Policy for the latest version.",
        ],
        showPrivacyLink: true,
      },
      {
        title: "Contact",
        paragraph: "For legal or security issues, contact support@antislot.app.",
      },
    ],
    privacyLink: "Open Privacy Policy",
    contactEmail: "support@antislot.app",
    contactSubject: "Terms Question",
    backLabel: "Back",
    emailOpenErrorTitle: "Error",
    emailOpenErrorBody: "Email app could not be opened.",
  },
};

export default function TermsOfService() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(TERMS_COPY);

  const handleOpenEmail = async () => {
    try {
      const subject = encodeURIComponent(copy.contactSubject);
      await Linking.openURL(`mailto:${copy.contactEmail}?subject=${subject}`);
    } catch {
      Alert.alert(copy.emailOpenErrorTitle, copy.emailOpenErrorBody);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`← ${t.back}`}</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>

        {copy.sections.map((section) => (
          <View
            key={section.title}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
            {section.bullets?.map((item) => (
              <Text key={item} style={[styles.bulletText, { color: colors.textSecondary }]}>{`- ${item}`}</Text>
            ))}
            {section.paragraph ? (
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>{section.paragraph}</Text>
            ) : null}
            {section.showPrivacyLink ? (
              <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/privacy")}> 
                <Text style={[styles.linkButtonText, { color: colors.primary }]}>{copy.privacyLink}</Text>
              </TouchableOpacity>
            ) : null}
            {section.title === copy.sections[copy.sections.length - 1]?.title ? (
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: `${colors.primary}1A` }]}
                onPress={handleOpenEmail}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.contactEmail}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  backBtn: { alignSelf: "flex-start", marginBottom: 10 },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 28, fontFamily: Fonts.display, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 18, lineHeight: 20, fontFamily: Fonts.body },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 16, fontFamily: Fonts.bodySemiBold, marginBottom: 8 },
  cardText: { fontSize: 13, lineHeight: 18, marginBottom: 12, fontFamily: Fonts.body },
  bulletText: { fontSize: 13, marginBottom: 6, lineHeight: 18, fontFamily: Fonts.body },
  secondaryButton: {
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  secondaryButtonText: { fontFamily: Fonts.bodySemiBold },
  linkButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  linkButtonText: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },
});
