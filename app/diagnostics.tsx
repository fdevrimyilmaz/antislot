import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { getFilterSettings } from "@/store/smsFilterStore";
import { getStorageStatus } from "@/lib/storage";
import * as SecureStore from "@/lib/secureStoreCompat";
import { useLanguage } from "@/contexts/LanguageContext";
import { ENABLE_IAP, ENABLE_NOTIFICATIONS, ENABLE_SMS_ROLE } from "@/constants/featureFlags";
import { getIapDiagnostics } from "@/services/iap";
import { getNotificationDiagnostics } from "@/services/notifications";
import { fetchBackendHealth } from "@/services/systemHealth";
import { clearBufferedAnalyticsEvents, getBufferedAnalyticsEvents } from "@/services/analytics";
import { getFilterStats, resetFilterStats } from "@/store/smsFilterStatsStore";
import { Fonts, Radius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

interface DiagnosticData {
  smsFilterEnabled: boolean;
  smsFilterStrictMode: boolean;
  smsFilterKeywords: number;
  smsFilterCustomKeywords: number;
  iapEnabled: boolean;
  iapStatus: string;
  iapProductsCount: number;
  notificationsEnabled: boolean;
  notificationPermission: string;
  notificationTokenPresent: boolean;
  lastBlocklistUpdate: string | null;
  lastPatternsUpdate: string | null;
  totalBlocked: number;
  totalAllowed: number;
  communityGuardBlocked: number;
  communityGuardRateLimited: number;
  communityGuardDuplicate: number;
  appVersion: string;
  storageLastErrorAt: number | null;
  storageLastBackendUsed: string;
  storageLastErrorCode: string | null;
  storageUsingFallback: boolean;
  backendHealthStatus: string;
  backendHealthReady: boolean | null;
  backendHealthDegraded: boolean | null;
  backendHealthLatencyMs: number | null;
  backendHealthCheckedAt: number | null;
  backendHealthErrorCode: string | null;
  backendHealthUptimeSec: number | null;
  backendCoreStatus: string | null;
  backendHealthBlockers: string[];
  backendHealthWarnings: string[];
}

export default function DiagnosticsScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const smsRoleEnabled = ENABLE_SMS_ROLE;
  const [data, setData] = useState<DiagnosticData>({
    smsFilterEnabled: false,
    smsFilterStrictMode: false,
    smsFilterKeywords: 0,
    smsFilterCustomKeywords: 0,
    iapEnabled: ENABLE_IAP,
    iapStatus: "disabled",
    iapProductsCount: 0,
    notificationsEnabled: ENABLE_NOTIFICATIONS,
    notificationPermission: "disabled",
    notificationTokenPresent: false,
    lastBlocklistUpdate: null,
    lastPatternsUpdate: null,
    totalBlocked: 0,
    totalAllowed: 0,
    communityGuardBlocked: 0,
    communityGuardRateLimited: 0,
    communityGuardDuplicate: 0,
    appVersion: "1.0.0",
    storageLastErrorAt: null,
    storageLastBackendUsed: "secure",
    storageLastErrorCode: null,
    storageUsingFallback: false,
    backendHealthStatus: "unknown",
    backendHealthReady: null,
    backendHealthDegraded: null,
    backendHealthLatencyMs: null,
    backendHealthCheckedAt: null,
    backendHealthErrorCode: null,
    backendHealthUptimeSec: null,
    backendCoreStatus: null,
    backendHealthBlockers: [],
    backendHealthWarnings: [],
  });
  const [loading, setLoading] = useState(true);

  const loadDiagnostics = useCallback(async () => {
    try {
      let smsFilterEnabled = false;
      let smsFilterStrictMode = false;
      let smsFilterKeywords = 0;
      let smsFilterCustomKeywords = 0;

      if (smsRoleEnabled) {
        const settings = await getFilterSettings();

        // Anahtar kelime sayımlarını al
        const { getAllKeywords } = await import("@/services/sms-filter/keywords");
        const defaultKeywords = getAllKeywords().length;

        smsFilterEnabled = settings.enabled;
        smsFilterStrictMode = settings.strictMode;
        smsFilterKeywords = defaultKeywords;
        smsFilterCustomKeywords = settings.customKeywords.length;
      }

      // Sayaçları yükle
      const filterStats = await getFilterStats();
      const analyticsEvents = getBufferedAnalyticsEvents();
      const blocklistUpdate = await SecureStore.getItemAsync("antislot_blocklist_update");
      const patternsUpdate = await SecureStore.getItemAsync("antislot_patterns_update");

      let communityGuardBlocked = 0;
      let communityGuardRateLimited = 0;
      let communityGuardDuplicate = 0;

      for (const event of analyticsEvents) {
        if (event.name !== "community_send_guard_triggered") continue;
        const reason = (event.payload as { reason?: string })?.reason;
        if (reason === "rate_limited") {
          communityGuardRateLimited += 1;
          continue;
        }
        if (reason === "duplicate") {
          communityGuardDuplicate += 1;
          continue;
        }
        communityGuardBlocked += 1;
      }

      // Storage status
      const storageStatus = getStorageStatus();

      const [iapDiagnostics, notificationDiagnostics, backendHealth] = await Promise.all([
        getIapDiagnostics(true),
        getNotificationDiagnostics(),
        fetchBackendHealth(),
      ]);

      setData({
        smsFilterEnabled,
        smsFilterStrictMode,
        smsFilterKeywords,
        smsFilterCustomKeywords,
        iapEnabled: iapDiagnostics.enabled,
        iapStatus: iapDiagnostics.connectionStatus,
        iapProductsCount: iapDiagnostics.productsCount,
        notificationsEnabled: notificationDiagnostics.enabled,
        notificationPermission: String(notificationDiagnostics.permissionStatus),
        notificationTokenPresent: notificationDiagnostics.tokenPresent,
        lastBlocklistUpdate: blocklistUpdate || null,
        lastPatternsUpdate: patternsUpdate || null,
        totalBlocked: filterStats.blocked,
        totalAllowed: filterStats.allowed,
        communityGuardBlocked,
        communityGuardRateLimited,
        communityGuardDuplicate,
        appVersion:
          Constants.expoConfig?.version ||
          (Constants.manifest as { version?: string } | undefined)?.version ||
          "1.0.0",
        storageLastErrorAt: storageStatus.lastErrorAt,
        storageLastBackendUsed: storageStatus.lastBackendUsed,
        storageLastErrorCode: storageStatus.lastErrorCode,
        storageUsingFallback: storageStatus.usingFallback,
        backendHealthStatus: backendHealth.status,
        backendHealthReady: backendHealth.ready,
        backendHealthDegraded: backendHealth.degraded,
        backendHealthLatencyMs: backendHealth.latencyMs,
        backendHealthCheckedAt: backendHealth.checkedAt,
        backendHealthErrorCode: backendHealth.errorCode,
        backendHealthUptimeSec: backendHealth.uptimeSec,
        backendCoreStatus: backendHealth.coreBackendStatus,
        backendHealthBlockers: backendHealth.blockers,
        backendHealthWarnings: backendHealth.warnings,
      });
    } catch (error) {
      console.error("Diagnostics loading error:", error);
    } finally {
      setLoading(false);
    }
  }, [smsRoleEnabled]);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return t.diagnosticsNever;
    try {
      const date = new Date(parseInt(timestamp, 10));
      return date.toLocaleString();
    } catch {
      return t.diagnosticsInvalid;
    }
  };

  const formatBool = (value: boolean | null) => {
    if (value === null) return "-";
    return value ? "yes" : "no";
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loader}>
          <Text>{t.diagnosticsLoading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>← {t.generalBack}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t.diagnosticsTitle}</Text>
        </View>

        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.diagnosticsAppInfo}</Text>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsVersion}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.appVersion}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderInline}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Backend Health</Text>
            <TouchableOpacity
              style={[styles.refreshButton, { borderColor: colors.border }]}
              onPress={loadDiagnostics}
            >
              <Text style={[styles.refreshButtonText, { color: colors.primary }]}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.backendHealthStatus}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Ready</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatBool(data.backendHealthReady)}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Degraded</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatBool(data.backendHealthDegraded)}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Latency</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {typeof data.backendHealthLatencyMs === "number" ? `${data.backendHealthLatencyMs}ms` : "-"}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Core Backend</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.backendCoreStatus ?? "-"}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Uptime</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {typeof data.backendHealthUptimeSec === "number"
                ? `${Math.floor(data.backendHealthUptimeSec / 60)}m`
                : "-"}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Check</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatTimestamp(
                data.backendHealthCheckedAt ? String(data.backendHealthCheckedAt) : null
              )}
            </Text>
          </View>

          {data.backendHealthErrorCode && (
            <Text style={[styles.hintText, { color: colors.warning ?? "#D97706" }]}>
              Health error: {data.backendHealthErrorCode}
            </Text>
          )}
          {data.backendHealthBlockers.length > 0 && (
            <Text style={[styles.hintText, { color: colors.warning ?? "#D97706" }]}>
              Blockers: {data.backendHealthBlockers.join(", ")}
            </Text>
          )}
          {data.backendHealthWarnings.length > 0 && (
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Warnings: {data.backendHealthWarnings.join(", ")}
            </Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Developer</Text>
          <TouchableOpacity
            style={[styles.infoRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/native-modules-test")}
          >
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Native Modules Test</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Store & Notifications</Text>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>IAP Enabled</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.iapEnabled ? "yes" : "no"}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>IAP Status</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.iapStatus}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>IAP Products</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.iapProductsCount}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Notifications Enabled</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.notificationsEnabled ? "yes" : "no"}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Notification Permission</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.notificationPermission}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Push Token</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{data.notificationTokenPresent ? "present" : "missing"}</Text>
          </View>
          {data.notificationPermission === "denied" && (
            <Text style={[styles.hintText, { color: colors.warning ?? "#D97706" }]}>
              Bildirimler kapali. Ayarlardan izin verebilirsiniz.
            </Text>
          )}
        </View>

        {/* SMS Filter Status */}
        {smsRoleEnabled && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.diagnosticsSmsFilterStatus}</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t.diagnosticsFilterEnabled}</Text>
              </View>
              <Switch value={data.smsFilterEnabled} disabled trackColor={{ false: colors.border, true: colors.primary }} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t.diagnosticsStrictMode}</Text>
              </View>
              <Switch value={data.smsFilterStrictMode} disabled trackColor={{ false: colors.border, true: colors.warning ?? "#D97706" }} />
            </View>

            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsDefaultKeywords}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{data.smsFilterKeywords}</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsCustomKeywords}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{data.smsFilterCustomKeywords}</Text>
            </View>
          </View>
        )}

        {/* Last Updates */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.diagnosticsLastUpdates}</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsBlocklist}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatTimestamp(data.lastBlocklistUpdate)}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsPatterns}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatTimestamp(data.lastPatternsUpdate)}</Text>
          </View>
        </View>

        {/* Counters */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.diagnosticsMessageStats}</Text>
          
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{data.totalBlocked}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.diagnosticsBlocked}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{data.totalAllowed}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.diagnosticsAllowed}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.diagnosticsCommunityGuard}</Text>

          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{data.communityGuardBlocked}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.diagnosticsGuardBlocked}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{data.communityGuardRateLimited}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.diagnosticsGuardRateLimited}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{data.communityGuardDuplicate}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.diagnosticsGuardDuplicate}</Text>
            </View>
          </View>
        </View>

        {/* Storage Status */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.diagnosticsStorageStatus}</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsLastBackend}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {data.storageLastBackendUsed === 'secure' ? 'SecureStore' :
               data.storageLastBackendUsed === 'async' ? 'AsyncStorage' :
               'Memory (Fallback)'}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsFallbackMode}</Text>
            <Text style={[styles.infoValue, data.storageUsingFallback && { color: colors.warning ?? "#D97706" }]}>
              {data.storageUsingFallback ? t.diagnosticsActive : t.diagnosticsPassive}
            </Text>
          </View>

          {data.storageLastErrorAt && (
            <>
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsLastErrorTime}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formatTimestamp(String(data.storageLastErrorAt))}</Text>
              </View>

              {data.storageLastErrorCode && (
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.diagnosticsLastErrorCode}</Text>
                  <Text style={[styles.infoValue, { fontSize: 12, color: colors.text }]}>{data.storageLastErrorCode}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Reset button */}
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.warning ?? "#D97706" }]}
          onPress={async () => {
            await resetFilterStats();
            clearBufferedAnalyticsEvents();
            await loadDiagnostics();
          }}
        >
          <Text style={styles.resetButtonText}>{t.diagnosticsResetCounters}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    marginBottom: 8,
  },
  section: {
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeaderInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshButtonText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 15,
    fontFamily: Fonts.body,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  hintText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    marginTop: 4,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: Fonts.display,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  resetButton: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 8,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
});



