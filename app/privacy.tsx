import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

type PrivacySection = {
  title: string;
  bullets?: string[];
  paragraphs?: string[];
};

const PRIVACY_COPY: Record<
  "tr" | "en",
  {
    title: string;
    subtitle: string;
    updatedAtLabel: string;
    sections: PrivacySection[];
    contactTitle: string;
    contactSubtitle: string;
    email: string;
    emailSubject: string;
    emailOpenErrorTitle: string;
    emailOpenErrorBody: string;
  }
> = {
  tr: {
    title: "Gizlilik Politikasi",
    subtitle:
      "Bu metin KVKK/GDPR odakli pratik ozet sunar: hangi veri, ne kadar sure, nasil silme talebi.",
    updatedAtLabel: "Son Guncelleme",
    sections: [
      {
        title: "Veri Toplama ve Isleme",
        bullets: [
          "Uygulama ici surec verileri (durtu kayitlari, gunluk, ilerleme) cihazinizda tutulur.",
          "Tanilama ve cokme raporlama varsayilan olarak kapalidir; yalnizca siz acarsaniz gonderilir.",
          "AI sohbeti kullanirsaniz mesaj icerigi sunucumuz uzerinden OpenAI API'ye iletilir.",
        ],
      },
      {
        title: "Saklama Suresi",
        bullets: [
          "Cihaz verileri siz silene kadar veya uygulama kaldirilana kadar saklanir.",
          "AI sohbet gecmisini AI ekranindan temizleyebilirsiniz.",
          "Sunucu tarafinda sohbet icerigini kalici depolamamayi hedefleriz; guvenlik ve operasyon loglari sinirli sure tutulabilir.",
        ],
      },
      {
        title: "Silme Talebi Akisi",
        paragraphs: [
          "1) Uygulama icinden ilgili kaydi temizleyin (ornegin AI sohbet).",
          "2) Tum cihaz verisini kaldirmak icin uygulamayi kaldirabilirsiniz.",
          "3) Hesapli ozelliklerde silme talebi icin support@antislot.app adresine e-posta gonderin.",
          "4) Talebe en gec 30 gun icinde donus yapilir (SLA).",
        ],
      },
      {
        title: "Destek Sureci (SLA)",
        bullets: [
          "Destek talepleri (silme, erisim, duzeltme, itiraz) support@antislot.app uzerinden alinir.",
          "Konu satirinda KVKK-GDPR veya ilgili anahtar kelime kullanin.",
          "Ilk donus en gec 30 gun icinde yapilir; surec tamamlanana kadar takip edilir.",
          "Kullanim Sartlari ile ayni destek kanali ve SLA uygulanir.",
        ],
      },
      {
        title: "Ucuncu Taraflar ve DPA",
        bullets: [
          "Sentry: yalnizca izinli tanilama/cokme raporlari icin kullanilir.",
          "OpenAI: AI destek yanitlari icin sohbet icerigi islenir.",
          "Bu tedarikcilerle KVKK/GDPR kapsamina uygun veri isleme sozlesmesi (DPA) gereklilikleri hedeflenir.",
        ],
      },
      {
        title: "Hukuki Dayanak (KVKK/GDPR)",
        bullets: [
          "Acik riza: tanilama/cokme raporlama gibi istege bagli paylasimlar.",
          "Sozlesmenin ifasi: uygulama cekirdek fonksiyonlarinin calismasi.",
          "Mesru menfaat: guvenlik, suistimal onleme ve servis surekliligi.",
        ],
      },
      {
        title: "Guvenlik",
        bullets: [
          "Trafik TLS/HTTPS uzerinden iletilir.",
          "Engel listesi guncellemeleri HMAC imzasi ile dogrulanir.",
          "Veri minimizasyonu ve erisim sinirlama prensipleri uygulanir.",
        ],
      },
    ],
    contactTitle: "Iletisim",
    contactSubtitle: "Erisim, duzeltme, silme, itiraz veya veri isleme sorulari icin:",
    email: "support@antislot.app",
    emailSubject: "KVKK-GDPR Talebi",
    emailOpenErrorTitle: "Hata",
    emailOpenErrorBody: "E-posta uygulamasi acilamadi.",
  },
  en: {
    title: "Privacy Policy",
    subtitle:
      "This is a practical KVKK/GDPR-oriented summary: what data is processed, retention, and deletion workflow.",
    updatedAtLabel: "Last updated",
    sections: [
      {
        title: "Data Collection and Processing",
        bullets: [
          "In-app process data (urge logs, diary, progress) is stored on your device.",
          "Diagnostics and crash reporting are off by default and sent only if you enable them.",
          "If you use AI chat, message content is relayed to the OpenAI API through our server.",
        ],
      },
      {
        title: "Retention",
        bullets: [
          "Device data remains until you delete it or uninstall the app.",
          "AI chat history can be cleared from the AI screen.",
          "We aim not to keep persistent chat content server-side; security and operational logs may be retained for limited periods.",
        ],
      },
      {
        title: "Deletion Request Flow",
        paragraphs: [
          "1) Remove related records inside the app (for example, AI chat history).",
          "2) Uninstall the app to remove all device-side data.",
          "3) For account-based features, send deletion requests to support@antislot.app.",
          "4) Requests are answered within 30 days at the latest (SLA).",
        ],
      },
      {
        title: "Support Process (SLA)",
        bullets: [
          "Support requests (deletion, access, correction, objection) are handled through support@antislot.app.",
          "Use KVKK-GDPR or the relevant legal keyword in your email subject.",
          "First response is provided within 30 days at the latest and tracked until closure.",
          "The same support channel and SLA are aligned with Terms of Use.",
        ],
      },
      {
        title: "Third Parties and DPA",
        bullets: [
          "Sentry: only for user-enabled diagnostics/crash reporting.",
          "OpenAI: processes chat content for AI support responses.",
          "Data processing agreement (DPA) requirements are targeted for KVKK/GDPR alignment.",
        ],
      },
      {
        title: "Legal Basis (KVKK/GDPR)",
        bullets: [
          "Explicit consent: optional sharing such as diagnostics/crash reporting.",
          "Contract performance: operation of core app functionality.",
          "Legitimate interest: security, abuse prevention, and service continuity.",
        ],
      },
      {
        title: "Security",
        bullets: [
          "Traffic is transmitted over TLS/HTTPS.",
          "Blocklist updates are verified with HMAC signatures.",
          "Data minimization and access limitation principles are applied.",
        ],
      },
    ],
    contactTitle: "Contact",
    contactSubtitle: "For access, correction, deletion, objection, or data processing questions:",
    email: "support@antislot.app",
    emailSubject: "KVKK-GDPR Request",
    emailOpenErrorTitle: "Error",
    emailOpenErrorBody: "Email app could not be opened.",
  },
};

export default function PrivacyPolicy() {
  const { t, language, locale } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(PRIVACY_COPY);
  const currentDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleOpenEmail = async () => {
    try {
      const subject = encodeURIComponent(copy.emailSubject);
      await Linking.openURL(`mailto:${copy.email}?subject=${subject}`);
    } catch {
      Alert.alert(copy.emailOpenErrorTitle, copy.emailOpenErrorBody);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`\u2190 ${t.back}`}</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          {`${copy.updatedAtLabel}: ${currentDate}`}
        </Text>

        {copy.sections.map((section) => (
          <View
            key={section.title}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
            {section.bullets?.map((item) => (
              <Text key={item} style={[styles.bulletText, { color: colors.textSecondary }]}>{`- ${item}`}</Text>
            ))}
            {section.paragraphs?.map((item) => (
              <Text key={item} style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
            ))}
          </View>
        ))}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.cardTitle, { color: colors.text }]}>{copy.contactTitle}</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{copy.contactSubtitle}</Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: `${colors.primary}1A` }]}
            onPress={handleOpenEmail}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{copy.email}</Text>
          </TouchableOpacity>
        </View>
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
  subtitle: { fontSize: 14, marginBottom: 8, lineHeight: 20, fontFamily: Fonts.body },
  lastUpdated: { fontSize: 12, marginBottom: 18, fontFamily: Fonts.body },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 16, fontFamily: Fonts.bodySemiBold, marginBottom: 8 },
  cardSub: { fontSize: 13, marginBottom: 8, lineHeight: 18, fontFamily: Fonts.body },
  bulletText: { fontSize: 13, marginBottom: 6, lineHeight: 18, fontFamily: Fonts.body },
  secondaryButton: {
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  secondaryButtonText: { fontFamily: Fonts.bodySemiBold },
});

