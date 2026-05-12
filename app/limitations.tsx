import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

type LimitationItem = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  body: string;
  tips: string[];
};

const LIMITATIONS: LimitationItem[] = [
  {
    title: "DNS over HTTPS (DoH)",
    icon: "lock-closed",
    body: "DoH trafiği şifreli olduğu için DNS filtresi tarafından yakalanamayabilir.",
    tips: ["Safari DoH ayarlarını kapatın", "Mümkünse standart DNS kullanın"],
  },
  {
    title: "Uygulama İçi Tarayıcılar",
    icon: "browsers",
    body: "Bazı uygulamalar kendi tarayıcılarını kullandığı için filtreyi aşabilir.",
    tips: ["Kritik içerikler için Safari/Chrome tercih edin"],
  },
  {
    title: "Captive Portal (Ağ Girişi)",
    icon: "wifi",
    body: "Halka açık WiFi giriş sayfalarında VPN geçici olarak devre dışı kalabilir.",
    tips: ["Giriş tamamlandıktan sonra VPN durumunu kontrol edin"],
  },
  {
    title: "VPN Etkinleştirme",
    icon: "shield",
    body: "VPN kullanıcı onayı olmadan otomatik açılamaz.",
    tips: ["Ayarlar > VPN bölümünden manuel etkinleştirme yapın"],
  },
];

export default function Limitations() {
  const { colors } = useTheme();

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
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Sınırlamalar
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Bu sınırlamalar platform seviyesindedir. Uygulama içinden açık şekilde paylaşılır.
          </Text>

          {LIMITATIONS.map((item) => (
            <Card key={item.title} style={styles.cardSpacing}>
              <SectionHeader title={item.title} icon={item.icon} subtitle={item.body} />
              <View style={styles.tipList}>
                {item.tips.map((tip) => (
                  <View key={tip} style={styles.tipRow}>
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                    <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
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
    marginBottom: 10,
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  cardSpacing: { marginBottom: 14 },
  tipList: { gap: 8, marginTop: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipText: { fontSize: 13, lineHeight: 18, flex: 1 },
});
