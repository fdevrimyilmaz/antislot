import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { useUrgeStore } from "@/store/urgeStore";
import { router, type Href } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_OPTIONS = {
  tr: [
    { id: "sos", badge: "SOS", label: "SOS Kaynaklari", description: "Acil iletisim ve yardim hatlari", route: "/sos" },
    { id: "contacts", badge: "CONTACT", label: "Guvendigin Kisiler", description: "Ulasabilecegin kisiler", route: "/sos" },
    { id: "ai", badge: "AI", label: "AI Destegi", description: "AI destek sohbeti", route: "/ai" },
    { id: "content", badge: "GUIDE", label: "Destek Icerikleri", description: "Yardimci kaynaklar ve basliklar", route: "/community" },
  ],
  en: [
    { id: "sos", badge: "SOS", label: "SOS Resources", description: "Emergency contacts and helplines", route: "/sos" },
    { id: "contacts", badge: "CONTACT", label: "Trusted Contacts", description: "People you can reach out to", route: "/sos" },
    { id: "ai", badge: "AI", label: "AI Support", description: "Chat with AI support", route: "/ai" },
    { id: "content", badge: "GUIDE", label: "Support Topics", description: "Helpful resources and topics", route: "/community" },
  ],
} as const;

export default function SupportScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { addIntervention, completeIntervention } = useUrgeStore();

  const options = useLocalizedCopy(SUPPORT_OPTIONS);

  const handleSelect = async (route: string) => {
    await addIntervention("support");
    await completeIntervention("helpful");
    router.push(route as Href);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.text }]}>{`<- ${t.urgeBack}`}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>{t.urgeInterventionLabels.support}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.urgeInterveneSubtitle}</Text>
        </View>

        <View style={styles.grid}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => void handleSelect(option.route)}
              activeOpacity={0.82}
            >
              <View style={[styles.badge, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{option.badge}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{option.label}</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <SOSQuickAccess variant="floating" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: { marginBottom: Spacing.base },
  backButton: { alignSelf: "flex-start" },
  backText: { fontSize: 16, lineHeight: 20, fontFamily: Fonts.bodySemiBold },
  section: { marginBottom: Spacing.lg },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: "47%",
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: "center",
    ...Shadows.card,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    fontFamily: Fonts.bodySemiBold,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
    textAlign: "center",
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
});
