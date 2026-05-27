import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
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
import { SharedConfig } from "@/react-native-bridge/SharedConfigModule";
import {
  addWhitelistDomain,
  checkDomainBlocked,
  getBlockerState,
  removeWhitelistDomain,
  syncBlocklist,
} from "@/store/blockerStore";
import {
  buildContentBlockerRules,
  serializeRules,
} from "@/services/content-blocker/rule-builder";
import type { BlocklistPattern } from "@/services/gambling-blocker/domain-matcher";

const IOS_SAFARI_STEPS = [
  "iPhone'un Ayarlar uygulamasını aç.",
  "Aşağı kaydır ve Safari'ye dokun.",
  "Uzantılar (Extensions) seçeneğine dokun.",
  "Listede AntiSlot Block'u bul ve aç.",
  "Bu ekrana geri dön — durum 'aktif' olarak görünecek.",
];

export default function BlockerScreen() {
  const { colors } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [domainsCount, setDomainsCount] = useState(0);
  const [patternsCount, setPatternsCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelist, setNewWhitelist] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] =
    useState<{ blocked: boolean; domain: string | null } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [safariEnabled, setSafariEnabled] = useState<boolean | null>(null);

  /**
   * Push the current blocklist into the Safari Content Blocker. The native
   * module both writes the rule JSON to the App Group AND asks Safari to
   * reload it; we surface the result so the UI can show whether the user
   * has the extension enabled yet.
   */
  const pushSafariRules = async (
    domains: string[],
    whitelistDomains: string[],
    patterns: BlocklistPattern[]
  ) => {
    if (Platform.OS !== "ios") return;
    const rules = buildContentBlockerRules(domains, whitelistDomains, patterns);
    const result = await SharedConfig.saveSafariContentBlockerRules(
      serializeRules(rules)
    );
    if (result.reason === "extension_not_enabled") {
      setSafariEnabled(false);
    } else if (result.reloaded) {
      setSafariEnabled(true);
    }
  };

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
      if (Platform.OS === "ios") {
        try {
          const status = await SharedConfig.getSafariContentBlockerStatus();
          setSafariEnabled(status.available ? status.enabled : null);
        } catch {
          setSafariEnabled(null);
        }
        try {
          await pushSafariRules(state.domains, state.whitelist, state.patterns);
        } catch (error) {
          reportError(error, { scope: "blocker.safariPush", level: "warning" });
        }
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
        await pushSafariRules(state.domains, state.whitelist, state.patterns);
      } catch (error) {
        reportError(error, { scope: "blocker.safariPushAutoSync", level: "warning" });
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
    // Both helpers are stable closures over local setters; depending on them
    // would re-run sync on every render. Mount-only is intentional here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSync = async () => {
    haptics.tapMedium();
    setSyncing(true);
    try {
      const state = await syncBlocklist();
      setDomainsCount(state.domains.length);
      setPatternsCount(state.patterns.length);
      setLastSync(state.lastSync);
      try {
        await pushSafariRules(state.domains, state.whitelist, state.patterns);
      } catch (error) {
        reportError(error, { scope: "blocker.safariPushManual", level: "warning" });
      }
      haptics.success();
      toast.success("Engel listesi güncellendi.", "Güncel");
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

          {/* Platform-specific blocking — Safari Content Blocker (iOS) /
              Private DNS (Android). VPN-based protection was intentionally
              removed for App Store / Play Store policy compliance. */}
          {Platform.OS === "ios" ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Safari'de Engelleme"
                icon="logo-apple"
                subtitle="Safari içi içerik engelleyici ile kumar alan adlarını engelle."
              />
              <View style={styles.bulletList}>
                <BulletPoint
                  text="Engelleme yalnızca Safari'de geçerlidir; diğer tarayıcılar etkilenmez."
                  colors={colors}
                />
                <BulletPoint
                  text="Liste sunucudan otomatik güncellenir; sen ekleme/çıkarma yapamazsın."
                  colors={colors}
                />
                <BulletPoint
                  text="Gezinme verisi toplanmaz; eşleştirme tamamen cihazda yapılır."
                  colors={colors}
                />
              </View>

              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      safariEnabled === true
                        ? `${colors.success}14`
                        : `${colors.warning}14`,
                    borderColor:
                      safariEnabled === true
                        ? `${colors.success}55`
                        : `${colors.warning}55`,
                  },
                ]}
              >
                <Ionicons
                  name={safariEnabled === true ? "checkmark-circle" : "alert-circle"}
                  size={16}
                  color={safariEnabled === true ? colors.success : colors.warning}
                />
                <Text style={[styles.statusPillText, { color: colors.text }]}>
                  {safariEnabled === true
                    ? "Safari engelleyici aktif."
                    : "Safari engelleyici henüz açık değil — aşağıdaki adımları izle."}
                </Text>
              </View>

              {safariEnabled !== true ? (
                <View style={styles.stepsList}>
                  {IOS_SAFARI_STEPS.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View
                        style={[
                          styles.stepBadge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={styles.stepBadgeText}>{i + 1}</Text>
                      </View>
                      <Text style={[styles.stepText, { color: colors.text }]}>
                        {step}
                      </Text>
                    </View>
                  ))}
                  <Text style={[styles.stepsFooter, { color: colors.textMuted }]}>
                    iOS, Safari Uzantılar sayfasına doğrudan bir bağlantı
                    sunmuyor; bu yüzden uygulamadan tek tuşla açılamıyor.
                    Adımları el ile izlemen gerekir.
                  </Text>
                </View>
              ) : null}
            </Card>
          ) : Platform.OS === "android" ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader
                title="Android Sistem Genelinde"
                icon="logo-android"
                subtitle="Özel DNS (Private DNS) ile tüm uygulamalarda alan adı engellemesi."
              />
              <View style={styles.bulletList}>
                <BulletPoint
                  text="DoT (DNS-over-TLS) tabanlı; tüm Android sürümlerinde Ayarlar'dan açılır."
                  colors={colors}
                />
                <BulletPoint
                  text="AntiSlot ayarı senin için değiştirmez — sadece rehberi gösterir."
                  colors={colors}
                />
                <BulletPoint
                  text="Mağaza politikaları nedeniyle VPN tabanlı koruma yoktur."
                  colors={colors}
                />
              </View>
              <Button
                title="Özel DNS Kurulumunu Aç"
                onPress={() => {
                  haptics.tapMedium();
                  router.push("/android-dns-setup");
                }}
                variant="primary"
                fullWidth
                leftIcon="globe"
                style={styles.platformBtn}
              />
            </Card>
          ) : null}

          {/* Honesty banner — applies on both platforms. */}
          <View
            style={[
              styles.policyBanner,
              {
                backgroundColor: `${colors.warning}10`,
                borderColor: `${colors.warning}40`,
              },
            ]}
          >
            <Ionicons name="information-circle" size={16} color={colors.warning} />
            <Text style={[styles.policyBannerText, { color: colors.text }]}>
              iOS&apos;ta Safari içi engelleme, Android&apos;de güvenli Özel DNS kurulumu
              desteklenir. VPN tabanlı cihaz koruması mağaza politikaları
              nedeniyle kullanılmaz.
            </Text>
          </View>

          <View style={styles.linkRow}>
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
  platformBtn: { marginTop: 14 },
  statusPill: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  statusPillText: { fontSize: 13, lineHeight: 18, flex: 1, fontWeight: "600" },
  stepsList: { marginTop: 14, gap: 10 },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: { flex: 1, fontSize: 13, lineHeight: 19 },
  stepsFooter: { fontSize: 11, lineHeight: 15, fontStyle: "italic", marginTop: 6 },
  policyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  policyBannerText: { fontSize: 12, lineHeight: 17, flex: 1 },

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
