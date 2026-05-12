import { router } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
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
import { haptics } from "@/services/haptics";

const DATA_POINTS = [
  "Gezinme geçmişi toplanmaz",
  "DNS sorguları kaydedilmez veya iletilmez",
  "Kişisel bilgi toplanmaz",
  "Cihaz tanımlayıcıları toplanmaz",
  "Analitik veya izleme yoktur",
  "Çökme ve hata raporları anonim ve isteğe bağlı (Sentry ile)",
];

const LOCAL_STORAGE = [
  "Engel listesi ve kalıp kuralları",
  "İzin listesi (whitelist)",
  "Yerel istatistikler (engellenen/izin verilen sayıları)",
  "Seans ve günlük kayıtları",
];

const NETWORK_USAGE = [
  "Yalnızca engel listesi güncellemeleri indirilir",
  "Güncelleme istekleri kullanıcı verisi içermez",
  "AI destek mesajları cihaz içinde saklanır",
];

const SECURITY_POINTS = [
  "Engel listesi güncellemeleri HMAC imzası ile doğrulanır",
  "Senkronizasyonlar TLS/HTTPS üzerinden yapılır",
  "Geçersiz imza veya sürüm geri düşürme kabul edilmez",
];

type BulletSectionProps = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  subtitle?: string;
  items: string[];
  primaryColor: string;
  textColor: string;
};

function BulletSection({
  title,
  icon,
  subtitle,
  items,
  primaryColor,
  textColor,
}: BulletSectionProps) {
  return (
    <Card style={styles.cardSpacing}>
      <SectionHeader title={title} icon={icon} subtitle={subtitle} />
      <View style={styles.bulletList}>
        {items.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: primaryColor }]} />
            <Text style={[styles.bulletText, { color: textColor }]}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export default function PrivacyPolicy() {
  const { colors } = useTheme();

  const handleEmail = () => {
    haptics.tapLight();
    Linking.openURL("mailto:support@antislot.app");
  };

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
            Gizlilik Politikası
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Antislot, kullanıcı gizliliğini temel alır. Aşağıdaki veriler toplanmaz ve
            paylaşılmaz.
          </Text>

          <BulletSection
            title="Veri Toplama"
            icon="shield-checkmark"
            items={DATA_POINTS}
            primaryColor={colors.primary}
            textColor={colors.text}
          />

          <BulletSection
            title="Yerel Depolama"
            icon="phone-portrait"
            subtitle="Bu veriler yalnızca cihazınızda saklanır:"
            items={LOCAL_STORAGE}
            primaryColor={colors.primary}
            textColor={colors.text}
          />

          <BulletSection
            title="Ağ Kullanımı"
            icon="cloud"
            items={NETWORK_USAGE}
            primaryColor={colors.primary}
            textColor={colors.text}
          />

          <BulletSection
            title="Bütünlük ve Güvenlik"
            icon="lock-closed"
            items={SECURITY_POINTS}
            primaryColor={colors.primary}
            textColor={colors.text}
          />

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="İletişim"
              icon="mail"
              subtitle="Gizlilik sorularınız için bize yazabilirsiniz."
            />
            <Button
              title="support@antislot.app"
              onPress={handleEmail}
              variant="secondary"
              leftIcon="mail"
            />
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
    marginBottom: 10,
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  cardSpacing: { marginBottom: 14 },
  bulletList: { gap: 10 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletText: { fontSize: 14, lineHeight: 20, flex: 1 },
});
