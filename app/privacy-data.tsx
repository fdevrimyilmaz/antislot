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
import { usePrivacyStore } from "@/store/privacyStore";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyDataScreen() {
  const { t } = useLanguage();
  const { preferences, hydrated, updatePreferences, hydrate } = usePrivacyStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  const handleDiagnosticsToggle = (value: boolean) => {
    updatePreferences({ shareDiagnostics: value });
  };

  const handleCrashReportingToggle = (value: boolean) => {
    updatePreferences({ crashReporting: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← {t.generalBack}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.privacyDataTitle}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.privacyDataLocalStorage}</Text>
          <Text style={styles.sectionSubtitle}>
            {t.privacyDataLocalStorageSubtitle}
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t.privacyDataUrgeLogs}</Text>
            <Text style={styles.infoText}>
              {t.privacyDataUrgeLogsDesc}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t.privacyDataUrgePatterns}</Text>
            <Text style={styles.infoText}>
              {t.privacyDataUrgePatternsDesc}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t.privacyDataOtherLocalData}</Text>
            <Text style={styles.infoText}>
              {t.privacyDataOtherLocalDataDesc}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.privacyDataTelemetry}</Text>
          <Text style={styles.sectionSubtitle}>
            {t.privacyDataTelemetrySubtitle}
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>{t.privacyDataDiagnosticsToggle}</Text>
              <Text style={styles.toggleHint}>
                {t.privacyDataDiagnosticsHint}
              </Text>
            </View>
            <Switch
              value={preferences.shareDiagnostics}
              onValueChange={handleDiagnosticsToggle}
              trackColor={{ false: "#CBD5E1", true: "#1D4C72" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>{t.privacyDataCrashReporting}</Text>
              <Text style={styles.toggleHint}>
                {t.privacyDataCrashReportingHint}
              </Text>
            </View>
            <Switch
              value={preferences.crashReporting}
              onValueChange={handleCrashReportingToggle}
              trackColor={{ false: "#CBD5E1", true: "#1D4C72" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.privacyDataPolicies}</Text>
          <Text style={styles.sectionSubtitle}>
            {t.privacyDataPoliciesSubtitle}
          </Text>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/privacy")}>
            <Text style={styles.linkLabel}>{t.privacyDataPrivacyPolicy}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/terms")}>
            <Text style={styles.linkLabel}>{t.privacyDataTerms}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/disclaimer")}>
            <Text style={styles.linkLabel}>{t.privacyDataImportantInfo}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.privacyDataSecurity}</Text>
          <Text style={styles.sectionSubtitle}>
            {t.privacyDataSecuritySubtitle}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 10 },
  backText: { fontSize: 16, color: "#1D4C72" },
  title: { fontSize: 28, fontWeight: "900", color: "#1D4C72" },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1D4C72", marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 18 },
  infoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#1D4C72",
  },
  infoTitle: { fontSize: 15, fontWeight: "700", color: "#222", marginBottom: 6 },
  infoText: { fontSize: 13, color: "#666", lineHeight: 18 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: "#222" },
  toggleHint: { fontSize: 12, color: "#777", marginTop: 2 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  linkLabel: { fontSize: 14, fontWeight: "700", color: "#222" },
  linkArrow: { fontSize: 16, color: "#1D4C72", fontWeight: "700" },
});
