import { SOSQuickAccess } from "@/components/sos-quick-access";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trackEvent } from "@/services/analytics";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  CRISIS_ACTION_PLAN,
  CRISIS_CONTACTS,
  CRISIS_PROTOCOL_VERSION,
  OFFLINE_CRISIS_FALLBACK,
} from "@/services/crisisProtocol";
import { openExternalUrlWithFallback } from "@/services/safeLinking";
import { useAccessibilityStore } from "@/store/accessibilityStore";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CRISIS_COPY = {
  tr: {
    call: "Ara",
    sms: "SMS",
    actionPlan: "Acil eylem plani",
    breathingAction: "60 sn nefes egzersizini baslat",
    sosA11y: "SOS ekranina git",
  },
  en: {
    call: "Call",
    sms: "SMS",
    actionPlan: "Emergency action plan",
    breathingAction: "Start 60-second breathing",
    sosA11y: "Open SOS screen",
  },
} as const;

const CONTACT_LOCAL = {
  emergency_112: {
    tr: { title: "112 Acil", label: "Hayati risk durumlari" },
    en: { title: "112 Emergency", label: "Life-threatening emergency" },
  },
  yedam_115: {
    tr: { title: "YEDAM 115", label: "Bagimlilik destegi ve danismanlik" },
    en: { title: "YEDAM 115", label: "Addiction support and counseling" },
  },
  alo183: {
    tr: { title: "Alo 183", label: "7/24 sosyal destek" },
    en: { title: "Alo 183", label: "24/7 social support" },
  },
} as const;

const PLAN_LOCAL = {
  pause: {
    tr: {
      title: "Dur ve guvende kal",
      description: "Acil risk varsa 112'yi ara. Arac kullanma ve yalniz kalmamaya calis.",
    },
    en: {
      title: "Pause and stay safe",
      description: "If there is immediate risk, call emergency services. Avoid driving and try not to stay alone.",
    },
  },
  breathe: {
    tr: {
      title: "60 saniye nefes duzenleme",
      description: "4 saniye al, 4 saniye tut, 6 saniye ver. En az 5 tur tekrar et.",
    },
    en: {
      title: "60-second breathing reset",
      description: "Inhale 4s, hold 4s, exhale 6s. Repeat at least 5 rounds.",
    },
  },
  safe_distance: {
    tr: {
      title: "Tetikleyiciden uzaklas",
      description: "Riskli uygulamayi kapat, ortam degistir ve dikkat dagitici guvenli bir aktivite ac.",
    },
    en: {
      title: "Create distance from trigger",
      description: "Close risky apps, change environment, and switch to a safe distracting activity.",
    },
  },
  reach_out: {
    tr: {
      title: "Hemen birine ulas",
      description: "YEDAM 115 veya Alo 183'u ara. Mumkunse guvendigin bir kisiye kisa mesaj at.",
    },
    en: {
      title: "Reach out now",
      description: "Call YEDAM 115 or Alo 183. If possible, send a short message to a trusted person.",
    },
  },
} as const;

export default function CrisisScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { preferences } = useAccessibilityStore();
  const fontScale = preferences.fontScale;
  const headingScale = Math.min(fontScale, 1.2);
  const crisisMode = preferences.crisisMode;
  const copy = useLocalizedCopy(CRISIS_COPY);
  const contactsByLanguage = useMemo(
    () => ({
      tr: {
        emergency_112: CONTACT_LOCAL.emergency_112.tr,
        yedam_115: CONTACT_LOCAL.yedam_115.tr,
        alo183: CONTACT_LOCAL.alo183.tr,
      },
      en: {
        emergency_112: CONTACT_LOCAL.emergency_112.en,
        yedam_115: CONTACT_LOCAL.yedam_115.en,
        alo183: CONTACT_LOCAL.alo183.en,
      },
    }),
    []
  );
  const planByLanguage = useMemo(
    () => ({
      tr: {
        pause: PLAN_LOCAL.pause.tr,
        breathe: PLAN_LOCAL.breathe.tr,
        safe_distance: PLAN_LOCAL.safe_distance.tr,
        reach_out: PLAN_LOCAL.reach_out.tr,
      },
      en: {
        pause: PLAN_LOCAL.pause.en,
        breathe: PLAN_LOCAL.breathe.en,
        safe_distance: PLAN_LOCAL.safe_distance.en,
        reach_out: PLAN_LOCAL.reach_out.en,
      },
    }),
    []
  );
  const localizedContacts = useLocalizedCopy(contactsByLanguage);
  const localizedPlan = useLocalizedCopy(planByLanguage);

  useEffect(() => {
    trackEvent("crisis_screen_viewed", { protocolVersion: CRISIS_PROTOCOL_VERSION });
  }, []);

  const handleCall = async (phone: string) => {
    const contact = CRISIS_CONTACTS.find((item) => item.phone === phone);
    if (contact) {
      trackEvent("crisis_call_tapped", { contactId: contact.id });
    }
    await openExternalUrlWithFallback({
      url: `tel:${phone}`,
      fallbackTitle: OFFLINE_CRISIS_FALLBACK.title,
      fallbackMessage: `${OFFLINE_CRISIS_FALLBACK.description}\n\n${phone}`,
    });
  };

  const handleSMS = async (number: string) => {
    const contact = CRISIS_CONTACTS.find((item) => item.sms === number);
    if (contact) {
      trackEvent("crisis_sms_tapped", { contactId: contact.id });
    }
    await openExternalUrlWithFallback({
      url: `sms:${number}`,
      fallbackTitle: OFFLINE_CRISIS_FALLBACK.title,
      fallbackMessage: `${OFFLINE_CRISIS_FALLBACK.description}\n\n${number}`,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header} accessible accessibilityRole="header">
          <Text style={[styles.title, { color: colors.text, fontSize: 32 * headingScale }]}>{t.urgeCrisisTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: 17 * headingScale }]}>
            {t.urgeCrisisSubtitle}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.urgeCrisisImmediate}</Text>
          {CRISIS_CONTACTS.map((line) => {
            const local = localizedContacts[line.id];
            return (
              <View key={line.id} style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactTitle, { color: colors.text }]}>{local.title}</Text>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>{local.label}</Text>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={() => void handleCall(line.phone)}
                    accessibilityRole="button"
                    accessibilityLabel={`${local.title} ${copy.call}`}
                  >
                    <Text style={styles.primaryButtonText}>{copy.call}</Text>
                  </TouchableOpacity>
                  {line.sms ? (
                    <TouchableOpacity
                      style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={() => void handleSMS(line.sms!)}
                      accessibilityRole="button"
                      accessibilityLabel={`${local.title} ${copy.sms}`}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{copy.sms}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.actionPlan}</Text>
          {(crisisMode ? CRISIS_ACTION_PLAN.slice(0, 2) : CRISIS_ACTION_PLAN).map((step, index) => {
            const local = localizedPlan[step.id];
            return (
              <View key={step.id} style={[styles.planRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.planIndex, { color: colors.primary }]}>{index + 1}</Text>
                <View style={styles.planText}>
                  <Text style={[styles.planTitle, { color: colors.text }]}>{local.title}</Text>
                  <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{local.description}</Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity
            style={[styles.breathingButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push("/urge/breathing")}
            activeOpacity={0.82}
          >
            <Text style={[styles.breathingButtonText, { color: colors.text }]}>{copy.breathingAction}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.sosButton, { backgroundColor: preferences.highContrast ? "#B42318" : colors.warning || "#D97706" }]}
            onPress={() => router.push("/sos")}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={copy.sosA11y}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.continueButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => {
              trackEvent("crisis_continue_tapped", { from: "crisis" });
              router.push("/urge/intervene");
            }}
            accessibilityRole="button"
            accessibilityLabel={t.urgeCrisisContinue}
          >
            <Text style={[styles.continueButtonText, { color: colors.text }]}>{t.urgeCrisisContinue}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <SOSQuickAccess variant="floating" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.display,
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: Fonts.body,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  contactCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    ...Shadows.card,
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  contactTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 2,
  },
  contactLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
  },
  contactActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
  },
  primaryButton: {
    borderRadius: Radius.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minWidth: 62,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minWidth: 62,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  planRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
  },
  planIndex: {
    width: 22,
    fontSize: 17,
    lineHeight: 21,
    fontFamily: Fonts.bodySemiBold,
  },
  planText: {
    flex: 1,
  },
  planTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 2,
  },
  planDesc: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
  },
  breathingButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 4,
  },
  breathingButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
    textAlign: "center",
  },
  sosButton: {
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: "center",
    ...Shadows.button,
  },
  sosButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 21,
    fontFamily: Fonts.bodySemiBold,
  },
  continueButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Fonts.bodySemiBold,
    textAlign: "center",
  },
});
