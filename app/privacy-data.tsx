import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { haptics } from "@/services/haptics";
import { usePrivacyStore } from "@/store/privacyStore";

export default function PrivacyDataScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { preferences, hydrated, updatePreferences, hydrate } = usePrivacyStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  const handleDiagnosticsToggle = (value: boolean) => {
    haptics.selection();
    updatePreferences({ shareDiagnostics: value });
  };

  const handleCrashReportingToggle = (value: boolean) => {
    haptics.selection();
    updatePreferences({ crashReporting: value });
  };

  const handleLinkPress = (route: string) => {
    haptics.tapLight();
    router.push(route as never);
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
            accessibilityLabel={t.generalBack}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.backText, { color: colors.text }]}>{t.generalBack}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {t.privacyDataTitle}
          </Text>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title={t.privacyDataLocalStorage}
              icon="phone-portrait"
              subtitle={t.privacyDataLocalStorageSubtitle}
            />
            <View style={styles.infoList}>
              <InfoBlock
                title={t.privacyDataUrgeLogs}
                text={t.privacyDataUrgeLogsDesc}
                colors={colors}
              />
              <InfoBlock
                title={t.privacyDataUrgePatterns}
                text={t.privacyDataUrgePatternsDesc}
                colors={colors}
              />
              <InfoBlock
                title={t.privacyDataOtherLocalData}
                text={t.privacyDataOtherLocalDataDesc}
                colors={colors}
              />
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title={t.privacyDataTelemetry}
              icon="analytics"
              subtitle={t.privacyDataTelemetrySubtitle}
            />
            <View style={styles.toggleList}>
              <View
                style={[
                  styles.toggleRow,
                  { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
                ]}
              >
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    {t.privacyDataDiagnosticsToggle}
                  </Text>
                  <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                    {t.privacyDataDiagnosticsHint}
                  </Text>
                </View>
                <Switch
                  value={preferences.shareDiagnostics}
                  onValueChange={handleDiagnosticsToggle}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={t.privacyDataDiagnosticsToggle}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    {t.privacyDataCrashReporting}
                  </Text>
                  <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                    {t.privacyDataCrashReportingHint}
                  </Text>
                </View>
                <Switch
                  value={preferences.crashReporting}
                  onValueChange={handleCrashReportingToggle}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={t.privacyDataCrashReporting}
                />
              </View>
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title={t.privacyDataPolicies}
              icon="document-text"
              subtitle={t.privacyDataPoliciesSubtitle}
            />
            <View style={styles.linkList}>
              <LinkRow
                label={t.privacyDataPrivacyPolicy}
                icon="lock-closed"
                onPress={() => handleLinkPress("/privacy")}
                colors={colors}
                divider
              />
              <LinkRow
                label={t.privacyDataTerms}
                icon="reader"
                onPress={() => handleLinkPress("/terms")}
                colors={colors}
                divider
              />
              <LinkRow
                label={t.privacyDataImportantInfo}
                icon="information-circle"
                onPress={() => handleLinkPress("/limitations")}
                colors={colors}
              />
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title={t.privacyDataSecurity}
              icon="shield-checkmark"
              subtitle={t.privacyDataSecuritySubtitle}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function InfoBlock({
  title,
  text,
  colors,
}: {
  title: string;
  text: string;
  colors: { primary: string; text: string; textMuted: string; cardBorder: string };
}) {
  return (
    <View
      style={[
        styles.infoBox,
        { backgroundColor: `${colors.primary}08`, borderLeftColor: colors.primary },
      ]}
    >
      <Text style={[styles.infoTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.infoText, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

function LinkRow({
  label,
  icon,
  onPress,
  colors,
  divider,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  colors: { primary: string; text: string; textMuted: string; cardBorder: string };
  divider?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.linkRow,
        divider && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.linkLeft}>
        <View style={[styles.linkIcon, { backgroundColor: `${colors.primary}14` }]}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.linkLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
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
  title: { fontSize: 28, fontWeight: "900", marginBottom: 18 },
  cardSpacing: { marginBottom: 14 },
  infoList: { gap: 10 },
  infoBox: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  infoTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  infoText: { fontSize: 13, lineHeight: 18 },
  toggleList: { width: "100%" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "700" },
  toggleHint: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  linkList: { width: "100%" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  linkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  linkIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  linkLabel: { fontSize: 14, fontWeight: "700", flex: 1 },
});
