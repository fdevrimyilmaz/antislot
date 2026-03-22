import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CrisisChoiceScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.urgeCrisisChoiceTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.urgeCrisisChoiceSubtitle}</Text>
        </View>

        <View style={styles.choices}>
          <TouchableOpacity
            style={[styles.primaryChoice, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/urge/crisis")}
            activeOpacity={0.82}
          >
            <View style={[styles.primaryBadge, { borderColor: "rgba(255,255,255,0.5)" }]}>
              <Text style={styles.primaryBadgeText}>SOS</Text>
            </View>
            <Text style={styles.primaryTitle}>{t.urgeCrisisChoicePrimary}</Text>
            <Text style={styles.primaryDesc}>{t.urgeCrisisChoicePrimaryDesc}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryChoice, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/urge/intervene")}
            activeOpacity={0.82}
          >
            <Text style={[styles.secondaryTitle, { color: colors.text }]}>{t.urgeCrisisChoiceSecondary}</Text>
            <Text style={[styles.secondaryDesc, { color: colors.textSecondary }]}>
              {t.urgeCrisisChoiceSecondaryDesc}
            </Text>
          </TouchableOpacity>
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
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.display,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  choices: {
    gap: 14,
  },
  primaryChoice: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadows.button,
  },
  primaryBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  primaryBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 14,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.4,
  },
  primaryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
    textAlign: "center",
  },
  primaryDesc: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
    textAlign: "center",
    opacity: 0.95,
  },
  secondaryChoice: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.base,
    ...Shadows.card,
  },
  secondaryTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
    textAlign: "center",
  },
  secondaryDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
});
