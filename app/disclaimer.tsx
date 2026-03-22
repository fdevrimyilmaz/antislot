import { Disclaimer } from "@/components/disclaimer";
import { Fonts, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

const DISCLAIMER_COPY = {
  tr: {
    acknowledgement: "Bu bilgileri okudugunuzu ve anladiginizi onayliyorsunuz.",
  },
  en: {
    acknowledgement: "You confirm that you have read and understood this information.",
  },
} as const;

export default function DisclaimerScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(DISCLAIMER_COPY);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>{`<- ${t.generalBack}`}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.disclaimerTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Disclaimer variant="full" showTitle={false} />

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>{copy.acknowledgement}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    paddingBottom: Spacing.base,
  },
  backBtn: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.display,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  footer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: Fonts.body,
  },
});
