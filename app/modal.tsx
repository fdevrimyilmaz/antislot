import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";

const MODAL_COPY = {
  tr: {
    title: "Bilgi Ekrani",
    body: "Bu modal ekranini kapatip ana ekrana donebilirsiniz.",
    cta: "Ana ekrana don",
  },
  en: {
    title: "Info Screen",
    body: "You can close this modal screen and return to home.",
    cta: "Back to home",
  },
} as const;

export default function ModalScreen() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(MODAL_COPY);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{copy.body}</Text>
        <Link href="/" dismissTo style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>{copy.cta}</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 16,
  },
  link: {
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
});
