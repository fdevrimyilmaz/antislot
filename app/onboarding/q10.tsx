import { Disclaimer } from "@/components/disclaimer";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { setOnboardingDone } from "@/store/onboardingFlag";
import { setAnswer } from "@/store/onboardingStore";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ONBOARDING_CONTENT, localize } from "@/data/onboardingContent";

const DISCLAIMER_CONSENT_ID = "disclaimer_read";

export default function OnboardingQ10() {
  const router = useRouter();
  const { language } = useLanguage();
  const { colors } = useTheme();

  const common = ONBOARDING_CONTENT.common;
  const q10 = ONBOARDING_CONTENT.q10;

  const [consents, setConsents] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(q10.consents.map((consent) => [consent.id, false])) as Record<string, boolean>
  );
  const [isBusy, setIsBusy] = useState(false);

  const standardConsents = q10.consents.filter((consent) => consent.id !== DISCLAIMER_CONSENT_ID);
  const disclaimerConsent = q10.consents.find((consent) => consent.id === DISCLAIMER_CONSENT_ID);

  const canFinish = useMemo(
    () => q10.consents.every((consent) => consents[consent.id]),
    [consents, q10.consents]
  );

  function toggleConsent(id: string) {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function finish() {
    if (!canFinish || isBusy) return;

    setIsBusy(true);
    try {
      await setAnswer("q10", "consents_accepted");
      await setOnboardingDone();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Onboarding q10 finish error:", error);
      Alert.alert(localize(language, common.saveErrorTitle), localize(language, common.saveErrorBody));
    } finally {
      setIsBusy(false);
    }
  }

  const disabled = !canFinish || isBusy;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${localize(language, common.back)}`}</Text>
        </TouchableOpacity>
        <Text style={[styles.stepText, { color: colors.textSecondary }]}>10 / 10</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{localize(language, q10.title)}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{localize(language, q10.subtitle)}</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.cardTitle, { color: colors.text }]}>{localize(language, q10.consentTitle)}</Text>

          {standardConsents.map((consent) => {
            const selected = consents[consent.id];
            return (
              <TouchableOpacity
                key={consent.id}
                style={styles.consentRow}
                onPress={() => toggleConsent(consent.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.primary,
                      backgroundColor: selected ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {selected ? <Text style={styles.checkboxText}>OK</Text> : null}
                </View>
                <Text style={[styles.consentText, { color: colors.text }]}>
                  {localize(language, consent.text)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.warningCard, { borderColor: `${colors.warning ?? "#B45309"}66`, backgroundColor: `${colors.warning ?? "#B45309"}14` }]}>
            <Text style={[styles.warningTitle, { color: colors.warning ?? "#B45309" }]}>{localize(language, q10.crisisTitle)}</Text>
            <Text style={[styles.warningBody, { color: colors.textSecondary }]}>{localize(language, q10.crisisBody)}</Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Disclaimer variant="compact" />
            {disclaimerConsent ? (
              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => toggleConsent(disclaimerConsent.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.primary,
                      backgroundColor: consents[disclaimerConsent.id] ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {consents[disclaimerConsent.id] ? <Text style={styles.checkboxText}>OK</Text> : null}
                </View>
                <View style={styles.disclaimerCopy}>
                  <Text style={[styles.consentText, { color: colors.text }]}>{localize(language, disclaimerConsent.text)}</Text>
                  <TouchableOpacity onPress={() => router.push("/disclaimer")}>
                    <Text style={[styles.linkText, { color: colors.primary }]}>{localize(language, q10.links.disclaimerDetails)}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => router.push("/limitations")}> 
              <Text style={[styles.linkText, { color: colors.primary }]}>{localize(language, q10.links.limitations)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/privacy")}> 
              <Text style={[styles.linkText, { color: colors.primary }]}>{localize(language, q10.links.privacy)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/terms")}> 
              <Text style={[styles.linkText, { color: colors.primary }]}>{localize(language, q10.links.terms)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("mailto:support@antislot.app")}> 
              <Text style={[styles.linkText, { color: colors.primary }]}>{localize(language, q10.links.contact)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}> 
        <TouchableOpacity
          style={[
            styles.finishButton,
            { backgroundColor: colors.primary },
            disabled && styles.finishButtonDisabled,
          ]}
          onPress={finish}
          disabled={disabled}
          activeOpacity={0.9}
        >
          <Text style={styles.finishButtonText}>{localize(language, common.finish)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  stepText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.body,
    marginBottom: 16,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 12,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: Fonts.bodySemiBold,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
  },
  warningCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  warningBody: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  disclaimerSection: {
    marginBottom: 8,
  },
  disclaimerCopy: {
    flex: 1,
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  linkText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    textDecorationLine: "underline",
  },
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    borderTopWidth: 1,
  },
  finishButton: {
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  finishButtonDisabled: {
    opacity: 0.5,
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
  },
});
