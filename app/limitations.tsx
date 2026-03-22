import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

type LimitationItem = {
  title: string;
  body: string;
  tips: string[];
};

const LIMITATIONS_COPY: Record<
  "tr" | "en",
  {
    title: string;
    subtitle: string;
    sections: LimitationItem[];
  }
> = {
  tr: {
    title: "Sinirlamalar",
    subtitle: "Bu sinirlamalar platform seviyesindedir ve acik sekilde paylasilir.",
    sections: [
      {
        title: "DNS over HTTPS (DoH)",
        body: "DoH trafigi sifreli oldugu icin DNS filtresi tarafindan yakalanamayabilir.",
        tips: ["Safari DoH ayarlarini kapatin", "Mumkunse standart DNS kullanin"],
      },
      {
        title: "Uygulama Ici Tarayicilar",
        body: "Bazi uygulamalar kendi tarayicilarini kullandigi icin filtreyi asabilir.",
        tips: ["Kritik icerikler icin Safari/Chrome tercih edin"],
      },
      {
        title: "Captive Portal (Ag Girisi)",
        body: "Halka acik Wi-Fi giris sayfalarinda VPN gecici olarak devre disi kalabilir.",
        tips: ["Giris tamamlandiktan sonra VPN durumunu kontrol edin"],
      },
      {
        title: "VPN Etkinlestirme",
        body: "VPN kullanici onayi olmadan otomatik acilamaz.",
        tips: ["Ayarlar > VPN bolumunden manuel etkinlestirme yapin"],
      },
    ],
  },
  en: {
    title: "Limitations",
    subtitle: "These are platform-level limits and are shown transparently.",
    sections: [
      {
        title: "DNS over HTTPS (DoH)",
        body: "DoH traffic may bypass DNS filtering because it is encrypted.",
        tips: ["Disable DoH in Safari if enabled", "Use standard DNS when possible"],
      },
      {
        title: "In-App Browsers",
        body: "Some apps use their own browser layers, which may bypass filtering.",
        tips: ["Use Safari/Chrome for high-risk browsing contexts"],
      },
      {
        title: "Captive Portals (Network Login)",
        body: "Public Wi-Fi login flows can temporarily interrupt VPN filtering.",
        tips: ["Check VPN status after network login completes"],
      },
      {
        title: "VPN Activation",
        body: "VPN cannot be enabled automatically without user consent.",
        tips: ["Activate manually from Settings > VPN when needed"],
      },
    ],
  },
};

export default function Limitations() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(LIMITATIONS_COPY);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`← ${t.back}`}</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.subtitle}</Text>

        {copy.sections.map((item) => (
          <View
            key={item.title}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>{item.body}</Text>
            <View style={styles.tipList}>
              {item.tips.map((tip) => (
                <Text key={tip} style={[styles.bulletText, { color: colors.textSecondary }]}>{`• ${tip}`}</Text>
              ))}
            </View>
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
  cardText: { fontSize: 13, lineHeight: 18, marginBottom: 8, fontFamily: Fonts.body },
  tipList: { gap: 6 },
  bulletText: { fontSize: 13, fontFamily: Fonts.body },
});
