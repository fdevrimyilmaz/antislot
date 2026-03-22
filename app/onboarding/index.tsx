import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ONBOARDING_CONTENT, localize } from "@/data/onboardingContent";

export default function OnboardingIntro() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const intro = ONBOARDING_CONTENT.intro;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={[styles.logoWrap, { backgroundColor: `${colors.primary}14` }]}> 
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Antislot icon"
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{localize(language, intro.title)}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{localize(language, intro.subtitle)}</Text>

        <Link href="/onboarding/q1" asChild>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} activeOpacity={0.9}>
            <Text style={styles.buttonText}>{localize(language, intro.button)}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.display,
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: Fonts.body,
    marginBottom: 26,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
  },
});