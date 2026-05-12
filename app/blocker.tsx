import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import GamblingBlocker from "@/react-native-bridge/GamblingBlockerModule";
import { SharedConfig } from "@/react-native-bridge/SharedConfigModule";
import {
  addWhitelistDomain,
  checkDomainBlocked,
  getBlockerState,
  removeWhitelistDomain,
  syncBlocklist,
} from "@/store/blockerStore";

export default function BlockerScreen() {
  const { colors } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [domainsCount, setDomainsCount] = useState(0);
  const [patternsCount, setPatternsCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelist, setNewWhitelist] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] =
    useState<{ blocked: boolean; domain: string | null } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadState = async () => {
    try {
      const state = await getBlockerState();
      setDomainsCount(state.domains.length);
      setPatternsCount(state.patterns.length);
      setLastSync(state.lastSync);
      setWhitelist(state.whitelist);
      await SharedConfig.saveBlocklist(state.domains);
      await SharedConfig.savePatterns(state.patterns);
      await SharedConfig.saveWhitelist(state.whitelist);
      try {
        const enabled = await GamblingBlocker.isProtectionEnabled();
        setProtectionEnabled(enabled);
      } catch {
        setProtectionEnabled(false);
      }
    } catch (error) {
      reportError(error, { scope: "blocker.load", level: "warning" });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      // The mobile app never edits the API URL — it ships with the server URL
      // baked in (or pulled from EXPO_PUBLIC_API_URL). The admin manages the
      // domain list via the Telegram bot; we just pull the latest signed list.
      const state = await syncBlocklist();
      setDomainsCount(state.domains.length);
      setPatternsCount(state.patterns.length);
      setLastSync(state.lastSync);
      try {
        await GamblingBlocker.syncBlocklist(state.apiUrl);
      } catch {
        // Native sync unavailable on this platform — JS state still updated.
      }
    } catch (error) {
      reportError(error, { scope: "blocker.sync", level: "warning" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadState();
      // Auto-sync on mount in the background. We don't surface errors here —
      // the user sees the cached list either way, and we log to Sentry.
      void handleAutoSync();
    })();
  }, []);

  const toggleProtection = async (value: boolean) => {
    haptics.selection();
    try {
      if (value) {
        await GamblingBlocker.startProtection();
      } else {
        await GamblingBlocker.stopProtection();
      }
      setProtectionEnabled(value);
      haptics.success();
    } catch (error) {
      reportError(error, { scope: "blocker.protection", level: "warning" });
      haptics.error();
      toast.error("Bu cihazda koruma açılıp kapatılamıyor.", "Hata");
      setProtectionEnabled(false);
    }
  };

  const handleManualSync = async () => {
    haptics.tapMedium();
    setSyncing(true);
    try {
      const state = await syncBlocklist();
      setDomainsCount(state.domains.length);
      setPatternsCount(state.patterns.length);
      setLastSync(state.lastSync);
      try {
        await GamblingBlocker.syncBlocklist(state.apiUrl);
      } catch {
        // No-op
      }
      haptics.success();
      toast.success("Engel listesi sunucuyla eşitlendi.", "Güncel");
    } catch (error) {
      reportError(error, { scope: "blocker.manualSync" });
      haptics.error();
      const message =
        error instanceof Error ? error.message : "Senkronizasyon başarısız.";
      toast.error(message, "Bağlantı Hatası");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddWhitelist = async () => {
    const trimmed = newWhitelist.trim();
    if (!trimmed) return;
    haptics.tapLight();
    try {
      const updated = await addWhitelistDomain(trimmed);
      setWhitelist(updated);
      setNewWhitelist("");
      haptics.success();
      toast.success(`${trimmed} bu cihazda izin listesine eklendi.`, "Eklendi");
    } catch (error) {
      reportError(error, { scope: "blocker.addWhitelist" });
      haptics.error();
    }
  };

  const handleRemoveWhitelist = async (domain: string) => {
    haptics.warning();
    try {
      const updated = await removeWhitelistDomain(domain);
      setWhitelist(updated);
    } catch (error) {
      reportError(error, { scope: "blocker.removeWhitelist" });
    }
  };

  const handleTestDomain = async () => {
    if (!testInput.trim()) return;
    haptics.tapLight();
    try {
      const result = await checkDomainBlocked(testInput.trim());
      setTestResult(result);
      if (result.blocked) haptics.warning();
      else haptics.success();
    } catch (error) {
      reportError(error, { scope: "blocker.test" });
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return "Hiç";
    return new Date(lastSync).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            accessibilityLabel="Geri"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          {/* Hero — admin-managed badge front and center */}
          <LinearGradient
            colors={["#2A6B6E", "#1F5A5D", "#194B4E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="shield-checkmark" size={120} color="rgba(255,255,255,0.14)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="server" size={12} color="#5EE0C7" />
              <Text style={styles.heroBadgeText}>SUNUCU YÖNETİMLİ</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Para Koruma
            </Text>
            <Text style={styles.heroSubtitle}>
              Kumar siteleri uzaktan yönetilen güvenli bir listeden engellenir.
              Kullanıcılar bu listeyi değiştiremez — sadece operatör ekleyip
              çıkarabilir.
            </Text>
          </LinearGradient>

          {/* Protection toggle */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Cihaz Koruması"
              icon="lock-closed"
              subtitle="DNS düzeyinde kumar alan adlarını engeller."
            />
            <View style={styles.protectionRow}>
              <View style={styles.protectionInfo}>
                <Text style={[styles.protectionLabel, { color: colors.text }]}>
                  Korumayı Etkinleştir
                </Text>
                {loading ? (
                  <Skeleton width={120} height={12} radius={6} style={styles.skelGap} />
                ) : (
                  <Text style={[styles.protectionHint, { color: colors.textMuted }]}>
                    {protectionEnabled ? "Koruma aktif" : "Koruma kapalı"}
                  </Text>
                )}
              </View>
              <Switch
                value={protectionEnabled}
                onValueChange={toggleProtection}
                disabled={loading}
                trackColor={{ false: colors.cardBorder, true: colors.success }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Koruma anahtarı"
              />
            </View>
          </Card>

          {/* VPN explanation */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Nasıl Çalışır?"
              icon="information-circle"
              subtitle="Uygulama, cihazda yerel bir VPN kullanır."
            />
            <View style={styles.bulletList}>
              <BulletPoint
                text="Gezinti verileri toplanmaz, yerelde işlenir."
                colors={colors}
              />
              <BulletPoint
                text="Liste sunucu tarafında imzalanır; cihaz imzayı doğrular."
                colors={colors}
              />
              <BulletPoint
                text="DoH ve uygulama içi tarayıcılar filtreyi aşabilir."
                colors={colors}
              />
              <BulletPoint
                text="En iyi koruma için VPN/Network Extension etkin olmalı."
                colors={colors}
              />
            </View>
            <View style={styles.linkRow}>
              {Platform.OS === "ios" ? (
                <Button
                  title="VPN Ayarları"
                  onPress={() => {
                    haptics.tapLight();
                    Linking.openURL("app-settings:");
                  }}
                  variant="secondary"
                  leftIcon="open-outline"
                />
              ) : null}
              <Button
                title="Sınırlamalar"
                onPress={() => {
                  haptics.tapLight();
                  router.push("/limitations");
                }}
                variant="secondary"
                leftIcon="information-circle-outline"
              />
              <Button
                title="Gizlilik"
                onPress={() => {
                  haptics.tapLight();
                  router.push("/privacy");
                }}
                variant="secondary"
                leftIcon="lock-closed-outline"
              />
            </View>
          </Card>

          {/* List status — read only */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Engel Listesi Durumu"
              icon="cloud-done"
              subtitle={`Son senkronizasyon: ${formatLastSync()}`}
            />

            <View style={[styles.statRow, { borderColor: colors.cardBorder }]}>
              <StatItem
                label="Alan Adları"
                value={loading ? null : String(domainsCount)}
                colors={colors}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
              <StatItem
                label="Kalıplar"
                value={loading ? null : String(patternsCount)}
                colors={colors}
              />
            </View>

            <Button
              title={syncing ? "Senkronize" : "Şimdi Senkronize Et"}
              onPress={handleManualSync}
              disabled={syncing}
              loading={syncing}
              variant="primary"
              fullWidth
              leftIcon="sync"
              style={styles.syncBtn}
            />

            <View
              style={[
                styles.adminNote,
                { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}55` },
              ]}
            >
              <Ionicons name="lock-closed" size={14} color={colors.warning} />
              <Text style={[styles.adminNoteText, { color: colors.text }]}>
                Liste sunucu tarafında yönetilir. Bu cihazdan domain
                eklenemez/çıkarılamaz.
              </Text>
            </View>
          </Card>

          {/* Personal whitelist — local only */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Kişisel İzin Listesi"
              icon="checkmark-done"
              subtitle="Sadece bu cihaz için belirli alan adlarına izin ver."
              meta={whitelist.length > 0 ? `${whitelist.length}` : undefined}
            />
            <View style={styles.formActions}>
              <TextInput
                style={[
                  styles.input,
                  styles.flexInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="example.com"
                placeholderTextColor={colors.textMuted}
                value={newWhitelist}
                onChangeText={setNewWhitelist}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="İzin listesi alan adı"
              />
              <Button
                title="Ekle"
                onPress={handleAddWhitelist}
                disabled={!newWhitelist.trim()}
                variant="primary"
                leftIcon="add"
              />
            </View>

            {whitelist.length > 0 ? (
              <View style={styles.tagList}>
                {whitelist.map((domain) => (
                  <TouchableOpacity
                    key={domain}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: `${colors.primary}14`,
                        borderColor: `${colors.primary}33`,
                      },
                    ]}
                    onPress={() => handleRemoveWhitelist(domain)}
                    accessibilityRole="button"
                    accessibilityLabel={`${domain} alan adını kaldır`}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>{domain}</Text>
                    <Ionicons name="close" size={12} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                İzin listesinde alan adı yok
              </Text>
            )}
          </Card>

          {/* Test tool */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Alan Adı Testi"
              icon="search"
              subtitle="Bir alan adının engellenip engellenmediğini kontrol et."
            />
            <View style={styles.formActions}>
              <TextInput
                style={[
                  styles.input,
                  styles.flexInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="bahis.com"
                placeholderTextColor={colors.textMuted}
                value={testInput}
                onChangeText={setTestInput}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Test alan adı"
              />
              <Button
                title="Kontrol"
                onPress={handleTestDomain}
                disabled={!testInput.trim()}
                variant="primary"
                leftIcon="checkmark-circle"
              />
            </View>

            {testResult ? (
              <View
                style={[
                  styles.resultBox,
                  {
                    backgroundColor: testResult.blocked
                      ? `${colors.danger}12`
                      : `${colors.success}12`,
                    borderColor: testResult.blocked
                      ? `${colors.danger}55`
                      : `${colors.success}55`,
                  },
                ]}
                accessibilityLiveRegion="polite"
              >
                <Ionicons
                  name={testResult.blocked ? "ban" : "checkmark-circle"}
                  size={20}
                  color={testResult.blocked ? colors.danger : colors.success}
                />
                <View style={styles.resultText}>
                  <Text style={[styles.resultDomain, { color: colors.text }]}>
                    {testResult.domain || "Bilinmiyor"}
                  </Text>
                  <Text
                    style={[
                      styles.resultStatus,
                      { color: testResult.blocked ? colors.danger : colors.success },
                    ]}
                  >
                    {testResult.blocked ? "Engellendi" : "İzin Verildi"}
                  </Text>
                </View>
              </View>
            ) : null}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function BulletPoint({
  text,
  colors,
}: {
  text: string;
  colors: { primary: string; text: string };
}) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.bulletText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function StatItem({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | null;
  colors: { primary: string; textMuted: string };
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      {value === null ? (
        <Skeleton width={40} height={20} radius={6} style={styles.skelGap} />
      ) : (
        <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      )}
    </View>
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
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecor: {
    position: "absolute",
    right: -18,
    bottom: -18,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(94, 224, 199, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(94, 224, 199, 0.35)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#5EE0C7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
  },

  cardSpacing: { marginBottom: 14 },
  protectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  protectionInfo: { flex: 1, minWidth: 0 },
  protectionLabel: { fontSize: 15, fontWeight: "700" },
  protectionHint: { fontSize: 12, marginTop: 2 },

  bulletList: { gap: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { fontSize: 13, lineHeight: 18, flex: 1 },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  statRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1 },
  statLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4, letterSpacing: 0.4 },
  statValue: { fontSize: 24, fontWeight: "900" },

  syncBtn: { marginBottom: 12 },
  adminNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  adminNoteText: { fontSize: 12, lineHeight: 16, flex: 1 },

  formActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  flexInput: { flex: 1 },
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 14,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: "700" },
  emptyText: { fontSize: 13, fontStyle: "italic", marginTop: 12 },

  resultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultText: { flex: 1 },
  resultDomain: { fontSize: 14, fontWeight: "700" },
  resultStatus: { fontSize: 12, fontWeight: "800", marginTop: 2 },
  skelGap: { marginTop: 4 },
});
