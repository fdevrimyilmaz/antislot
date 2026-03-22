import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePrivacyStore } from "@/store/privacyStore";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIVACY_DATA_COPY = {
  tr: {
    telemetryToggle: "Telemetriye izin ver",
    telemetryToggleHint: "Kapaliysa telemetri ve cokme raporlari gonderilmez.",
    dataMinimization: "Veri minimizasyonu",
    dataMinimizationHint:
      "Yalnizca uygulama isleyisi icin gereken minimum teknik veri paylasilir.",
    retentionTitle: "Telemetri saklama suresi",
    retentionDay: (day: number) => `${day} gun`,
    deleteRequest: "Veri Silme Talebi",
    deleteRequestSubject: "Veri Silme Talebi",
    deleteRequestBody:
      "Merhaba,\n\nHesabimdaki ve verilerimdeki silme talebimi isleme almanizi rica ediyorum.\n\nIsim:\nE-posta:\n",
    emailFallbackTitle: "E-posta",
    emailFallbackBody: "support@antislot.app adresine Veri Silme Talebi konulu bir e-posta gonderin.",
    loading: "Yukleniyor...",
  },
  en: {
    telemetryToggle: "Allow telemetry",
    telemetryToggleHint: "If disabled, telemetry and crash reports are not sent.",
    dataMinimization: "Data minimization",
    dataMinimizationHint:
      "Only the minimum technical data required for operation is shared.",
    retentionTitle: "Telemetry retention period",
    retentionDay: (day: number) => `${day} days`,
    deleteRequest: "Data Deletion Request",
    deleteRequestSubject: "Data Deletion Request",
    deleteRequestBody:
      "Hello,\n\nPlease process my request to delete my account data and related records.\n\nName:\nEmail:\n",
    emailFallbackTitle: "Email",
    emailFallbackBody: "Send an email to support@antislot.app with subject Data Deletion Request.",
    loading: "Loading...",
  },
} as const;

export default function PrivacyDataScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(PRIVACY_DATA_COPY);
  const { preferences, hydrated, updatePreferences, hydrate } = usePrivacyStore();

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
    }
  }, [hydrated, hydrate]);

  async function openDeletionEmail() {
    const email = "support@antislot.app";
    const subject = encodeURIComponent(copy.deleteRequestSubject);
    const body = encodeURIComponent(copy.deleteRequestBody);
    try {
      await Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert(copy.emailFallbackTitle, copy.emailFallbackBody);
    }
  }

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>{copy.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.generalBack}`}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t.privacyDataTitle}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.privacyDataLocalStorage}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t.privacyDataLocalStorageSubtitle}</Text>

          <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.primary }]}> 
            <Text style={[styles.infoTitle, { color: colors.text }]}>{t.privacyDataUrgeLogs}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t.privacyDataUrgeLogsDesc}</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.primary }]}> 
            <Text style={[styles.infoTitle, { color: colors.text }]}>{t.privacyDataUrgePatterns}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t.privacyDataUrgePatternsDesc}</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.primary }]}> 
            <Text style={[styles.infoTitle, { color: colors.text }]}>{t.privacyDataOtherLocalData}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t.privacyDataOtherLocalDataDesc}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.privacyDataTelemetry}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t.privacyDataTelemetrySubtitle}</Text>

          <TouchableOpacity
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
            onPress={() => void updatePreferences({ telemetryEnabled: !preferences.telemetryEnabled })}
            activeOpacity={0.85}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{copy.telemetryToggle}</Text>
              <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>{copy.telemetryToggleHint}</Text>
            </View>
            <Switch
              value={preferences.telemetryEnabled}
              onValueChange={(value) => void updatePreferences({ telemetryEnabled: value })}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
            onPress={() => void updatePreferences({ shareDiagnostics: !preferences.shareDiagnostics })}
            activeOpacity={0.85}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{t.privacyDataDiagnosticsToggle}</Text>
              <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>{t.privacyDataDiagnosticsHint}</Text>
            </View>
            <Switch
              value={preferences.shareDiagnostics}
              onValueChange={(value) => void updatePreferences({ shareDiagnostics: value })}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor="#FFFFFF"
              disabled={!preferences.telemetryEnabled}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleRow, { borderBottomColor: colors.border }]}
            onPress={() => void updatePreferences({ crashReporting: !preferences.crashReporting })}
            activeOpacity={0.85}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{t.privacyDataCrashReporting}</Text>
              <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>{t.privacyDataCrashReportingHint}</Text>
            </View>
            <Switch
              value={preferences.crashReporting}
              onValueChange={(value) => void updatePreferences({ crashReporting: value })}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor="#FFFFFF"
              disabled={!preferences.telemetryEnabled}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleRow, styles.lastToggleRow, { borderBottomColor: colors.border }]}
            onPress={() => void updatePreferences({ dataMinimization: !preferences.dataMinimization })}
            activeOpacity={0.85}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{copy.dataMinimization}</Text>
              <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>{copy.dataMinimizationHint}</Text>
            </View>
            <Switch
              value={preferences.dataMinimization}
              onValueChange={(value) => void updatePreferences({ dataMinimization: value })}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={[styles.retentionTitle, { color: colors.text }]}>{copy.retentionTitle}</Text>
          <View style={styles.retentionRow}>
            {[7, 30, 90].map((days) => {
              const selected = preferences.retentionDays === days;
              return (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.retentionChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => void updatePreferences({ retentionDays: days as 7 | 30 | 90 })}
                >
                  <Text style={[styles.retentionChipText, { color: selected ? "#FFFFFF" : colors.text }]}>
                    {copy.retentionDay(days)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.privacyDataPolicies}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t.privacyDataPoliciesSubtitle}</Text>

          <TouchableOpacity
            style={[styles.linkRow, styles.deletionRow, { borderBottomColor: colors.border, borderLeftColor: colors.primary }]}
            onPress={openDeletionEmail}
          >
            <Text style={[styles.linkLabel, { color: colors.primary }]}>{copy.deleteRequest}</Text>
            <Text style={[styles.linkArrow, { color: colors.primary }]}>-&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/privacy")}
          >
            <Text style={[styles.linkLabel, { color: colors.text }]}>{t.privacyDataPrivacyPolicy}</Text>
            <Text style={[styles.linkArrow, { color: colors.primary }]}>-&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/terms")}
          >
            <Text style={[styles.linkLabel, { color: colors.text }]}>{t.privacyDataTerms}</Text>
            <Text style={[styles.linkArrow, { color: colors.primary }]}>-&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/disclaimer")}
          >
            <Text style={[styles.linkLabel, { color: colors.text }]}>{t.privacyDataImportantInfo}</Text>
            <Text style={[styles.linkArrow, { color: colors.primary }]}>-&gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.privacyDataSecurity}</Text>
          <Text style={[styles.sectionSubtitle, styles.noSectionBottom, { color: colors.textSecondary }]}>
            {t.privacyDataSecuritySubtitle}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loaderText: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.base,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
  },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
    marginBottom: 14,
  },
  noSectionBottom: {
    marginBottom: 0,
  },
  infoBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastToggleRow: {
    marginBottom: 12,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  toggleHint: {
    fontSize: 12,
    fontFamily: Fonts.body,
    marginTop: 2,
    lineHeight: 17,
  },
  retentionTitle: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  retentionRow: {
    flexDirection: "row",
    gap: 8,
  },
  retentionChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  retentionChipText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  deletionRow: {
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  linkLabel: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  linkArrow: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
});