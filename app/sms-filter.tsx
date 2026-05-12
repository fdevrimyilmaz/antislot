import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { FilterSettings, SpamDetectionResult } from "@/services/sms-filter/types";
import {
  getFilterSettings,
  updateFilterSettings,
  addCustomKeyword,
  removeCustomKeyword,
} from "@/store/smsFilterStore";
import { getAllKeywords } from "@/services/sms-filter/keywords";
import { SMSFilterService } from "@/services/sms-filter";
import {
  getFilterStats,
  incrementAllowed,
  incrementBlocked,
  resetFilterStats,
} from "@/store/smsFilterStatsStore";

/**
 * SMS spam recognizer — manual tester.
 *
 * What this screen IS:
 *   • A spam classifier you can paste a suspicious SMS into.
 *   • The classifier uses Turkish + English gambling/scam/ad keyword lists
 *     and regex patterns to score and label the message.
 *   • The user can extend it with custom keywords.
 *
 * What this screen is NOT (yet):
 *   • An automatic SMS filter that intercepts messages in the background.
 *     Background interception needs (1) a Kotlin SmsReceiver + default SMS
 *     app role on Android, and (2) an ILMessageFilterExtension target on iOS.
 *     Neither is wired up in this build; the prior UI implying otherwise was
 *     misleading and has been removed.
 *
 * Roadmap callout below ("Otomatik Engelleme — Yakında") sets expectations so
 * we never claim what we don't deliver.
 */

export default function SMSFilterScreen() {
  const { colors } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FilterSettings>({
    enabled: true,
    customKeywords: [],
    autoDeleteDays: null,
    strictMode: false,
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testSender, setTestSender] = useState("");
  const [testResult, setTestResult] = useState<SpamDetectionResult | null>(null);
  const [stats, setStats] = useState({ blocked: 0, allowed: 0 });

  useEffect(() => {
    (async () => {
      try {
        const loadedSettings = await getFilterSettings();
        setSettings(loadedSettings);
        const currentStats = await getFilterStats();
        setStats(currentStats);
      } catch (error) {
        reportError(error, { scope: "smsFilter.load" });
        toast.error("Ayarlar yüklenemedi.", "Hata");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleStrictMode = async (value: boolean) => {
    haptics.selection();
    try {
      await updateFilterSettings({ strictMode: value });
      setSettings({ ...settings, strictMode: value });
    } catch (error) {
      reportError(error, { scope: "smsFilter.toggleStrict" });
      haptics.error();
      toast.error("Ayar güncellenemedi.", "Hata");
    }
  };

  const handleAddKeyword = async () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed) {
      haptics.warning();
      toast.warning("Lütfen bir anahtar kelime girin.", "Geçersiz");
      return;
    }
    if (settings.customKeywords.includes(trimmed)) {
      haptics.warning();
      toast.warning("Bu anahtar kelime zaten var.", "Yinelenen");
      setNewKeyword("");
      return;
    }
    try {
      await addCustomKeyword(trimmed);
      setSettings({
        ...settings,
        customKeywords: [...settings.customKeywords, trimmed],
      });
      setNewKeyword("");
      haptics.success();
    } catch (error) {
      reportError(error, { scope: "smsFilter.addKeyword" });
      haptics.error();
      toast.error("Anahtar kelime eklenemedi.", "Hata");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    haptics.warning();
    Alert.alert(
      "Anahtar Kelimeyi Kaldır",
      `"${keyword}" listesinden çıkarılsın mı?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Kaldır",
          style: "destructive",
          onPress: async () => {
            try {
              await removeCustomKeyword(keyword);
              setSettings({
                ...settings,
                customKeywords: settings.customKeywords.filter((k) => k !== keyword),
              });
              haptics.success();
            } catch (error) {
              reportError(error, { scope: "smsFilter.removeKeyword" });
              haptics.error();
              toast.error("Anahtar kelime kaldırılamadı.", "Hata");
            }
          },
        },
      ]
    );
  };

  const handleTestMessage = async () => {
    if (!testMessage.trim()) {
      haptics.warning();
      toast.warning("Test etmek için bir mesaj yapıştırın.", "Boş Mesaj");
      return;
    }
    haptics.tapLight();
    const service = new SMSFilterService(settings.customKeywords, settings.strictMode);
    const result = service.classify({
      body: testMessage,
      sender: testSender.trim() || "Bilinmiyor",
    });
    setTestResult(result);
    if (result.isSpam) {
      await incrementBlocked();
      haptics.warning();
    } else {
      await incrementAllowed();
      haptics.success();
    }
    const updatedStats = await getFilterStats();
    setStats(updatedStats);
  };

  const handleResetStats = async () => {
    haptics.warning();
    try {
      await resetFilterStats();
      const updated = await getFilterStats();
      setStats(updated);
      haptics.success();
      toast.info("Test sayaçları sıfırlandı.");
    } catch (error) {
      reportError(error, { scope: "smsFilter.resetStats" });
      haptics.error();
    }
  };

  const totalKeywords = getAllKeywords().length + settings.customKeywords.length;
  const totalTests = stats.blocked + stats.allowed;
  const strengthLabel = useMemo(() => {
    if (settings.strictMode && totalKeywords > 150) return "Maksimum";
    if (settings.strictMode) return "Yüksek";
    if (totalKeywords > 150) return "Güçlü";
    return "Standart";
  }, [settings.strictMode, totalKeywords]);

  if (loading) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView
          style={styles.container}
          accessible
          accessibilityLabel="SMS tanıyıcı yükleniyor"
          accessibilityState={{ busy: true }}
        >
          <View style={styles.content}>
            <Skeleton width={60} height={16} radius={6} style={styles.skelBack} />
            <Skeleton width="60%" height={28} radius={8} style={styles.skelTitle} />
            <Card style={styles.cardSpacing}>
              <Skeleton width="50%" height={18} radius={6} />
              <Skeleton width="80%" height={12} radius={6} style={styles.skelGap} />
            </Card>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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

          {/* Hero — repositioned as "recognizer" */}
          <LinearGradient
            colors={["#4A5566", "#3F4858", "#353C49"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="mail-unread" size={120} color="rgba(255,255,255,0.14)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="flask" size={11} color="#9DAFC6" />
              <Text style={styles.heroBadgeText}>TANIYICI</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              SMS Spam Tanıyıcı
            </Text>
            <Text style={styles.heroSubtitle}>
              Şüpheli bir SMS aldığında içeriğini buraya yapıştır — kumar, bahis,
              dolandırıcılık veya reklam olup olmadığını tanır ve neden olduğunu açıklar.
            </Text>
          </LinearGradient>

          {/* "Coming soon" honesty banner */}
          <View
            style={[
              styles.roadmapBanner,
              {
                backgroundColor: `${colors.warning}12`,
                borderColor: `${colors.warning}55`,
              },
            ]}
          >
            <Ionicons name="time" size={18} color={colors.warning} />
            <View style={styles.roadmapText}>
              <Text style={[styles.roadmapTitle, { color: colors.text }]}>
                Otomatik engelleme — yakında
              </Text>
              <Text style={[styles.roadmapHint, { color: colors.textMuted }]}>
                Şu an SMS’leri otomatik silmek/engellemek yerine, sen yapıştırınca tanır.
                Arka planda engelleme yakında bir sürümde gelecek.
              </Text>
            </View>
          </View>

          {/* Test panel — main feature */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Mesajı Test Et"
              icon="flask"
              subtitle="Şüpheli mesajı yapıştır, sınıflandırıcı sonucu hemen söyler."
            />
            <TextInput
              style={[
                styles.testInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Mesaj içeriği..."
              placeholderTextColor={colors.textMuted}
              value={testMessage}
              onChangeText={setTestMessage}
              multiline
              accessibilityLabel="Test mesajı"
            />
            <TextInput
              style={[
                styles.testInput,
                styles.testInputSmall,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Gönderen (isteğe bağlı)"
              placeholderTextColor={colors.textMuted}
              value={testSender}
              onChangeText={setTestSender}
              accessibilityLabel="Gönderen"
            />
            <Button
              title="Testi Çalıştır"
              onPress={handleTestMessage}
              disabled={!testMessage.trim()}
              variant="primary"
              fullWidth
              leftIcon="play"
              style={styles.testBtn}
            />

            {testResult ? (
              <View
                style={[
                  styles.testResult,
                  {
                    backgroundColor: testResult.isSpam
                      ? `${colors.danger}12`
                      : `${colors.success}12`,
                    borderColor: testResult.isSpam
                      ? `${colors.danger}55`
                      : `${colors.success}55`,
                  },
                ]}
                accessibilityLiveRegion="polite"
              >
                <View style={styles.testResultHeader}>
                  <Ionicons
                    name={testResult.isSpam ? "ban" : "checkmark-circle"}
                    size={20}
                    color={testResult.isSpam ? colors.danger : colors.success}
                  />
                  <Text
                    style={[
                      styles.testResultTitle,
                      { color: testResult.isSpam ? colors.danger : colors.success },
                    ]}
                  >
                    {testResult.isSpam ? "Spam tespit edildi" : "Normal görünüyor"}
                  </Text>
                </View>
                <Text style={[styles.testResultText, { color: colors.text }]}>
                  Kategori: <Text style={styles.testResultEmphasis}>{testResult.category}</Text>
                </Text>
                <Text style={[styles.testResultText, { color: colors.text }]}>
                  Güven: <Text style={styles.testResultEmphasis}>{testResult.confidence}</Text>
                </Text>
                {testResult.reasons.length > 0 ? (
                  <View style={styles.reasonsList}>
                    <Text style={[styles.reasonsLabel, { color: colors.textMuted }]}>
                      Nedenler:
                    </Text>
                    {testResult.reasons.map((reason, index) => (
                      <View key={`${reason}-${index}`} style={styles.reasonRow}>
                        <View
                          style={[
                            styles.reasonDot,
                            { backgroundColor: testResult.isSpam ? colors.danger : colors.success },
                          ]}
                        />
                        <Text style={[styles.reasonText, { color: colors.text }]}>
                          {reason}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>

          {/* Test stats */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Test İstatistikleri"
              icon="bar-chart"
              meta={totalTests > 0 ? `${totalTests} test` : undefined}
            />
            <View style={styles.statRow}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: `${colors.danger}12`, borderColor: `${colors.danger}33` },
                ]}
              >
                <Ionicons name="ban" size={22} color={colors.danger} />
                <Text style={[styles.statNumber, { color: colors.danger }]}>{stats.blocked}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Spam Tespit</Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: `${colors.success}12`, borderColor: `${colors.success}33` },
                ]}
              >
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={[styles.statNumber, { color: colors.success }]}>{stats.allowed}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Normal</Text>
              </View>
            </View>
            {totalTests > 0 ? (
              <Button
                title="Sayaçları Sıfırla"
                onPress={handleResetStats}
                variant="secondary"
                fullWidth
                leftIcon="refresh"
                style={styles.resetStatsBtn}
              />
            ) : null}
          </Card>

          {/* Recognizer settings — affects test output only */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Tanıyıcı Ayarları"
              icon="options"
              subtitle="Bu ayarlar yalnızca test sonuçlarını etkiler."
            />
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Sıkı Mod</Text>
                <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                  Daha agresif sınıflandırma. Sınırdaki mesajları daha çok spam olarak işaretler.
                </Text>
              </View>
              <Switch
                value={settings.strictMode}
                onValueChange={handleToggleStrictMode}
                trackColor={{ false: colors.cardBorder, true: colors.warning }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Sıkı mod"
              />
            </View>
            <View style={[styles.strengthRow, { borderTopColor: colors.cardBorder }]}>
              <Text style={[styles.strengthLabel, { color: colors.textMuted }]}>
                Tanıyıcı Gücü
              </Text>
              <View style={[styles.strengthChip, { backgroundColor: `${colors.primary}14` }]}>
                <Ionicons name="shield" size={11} color={colors.primary} />
                <Text style={[styles.strengthValue, { color: colors.primary }]}>
                  {strengthLabel}
                </Text>
              </View>
            </View>
            <Text style={[styles.strengthMeta, { color: colors.textMuted }]}>
              {getAllKeywords().length} hazır anahtar kelime · {settings.customKeywords.length} özel
            </Text>
          </Card>

          {/* Custom keywords */}
          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Özel Anahtar Kelimeler"
              icon="filter"
              subtitle="Sınıflandırıcıya kendi tanıyıcı kelimelerinizi ekleyin."
              meta={
                settings.customKeywords.length > 0
                  ? `${settings.customKeywords.length}`
                  : undefined
              }
            />
            <View style={styles.keywordInputRow}>
              <TextInput
                style={[
                  styles.keywordInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="ör. casino, promo, bonus"
                placeholderTextColor={colors.textMuted}
                value={newKeyword}
                onChangeText={setNewKeyword}
                onSubmitEditing={handleAddKeyword}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Yeni anahtar kelime"
              />
              <Button
                title="Ekle"
                onPress={handleAddKeyword}
                disabled={!newKeyword.trim()}
                variant="primary"
                leftIcon="add"
              />
            </View>

            {settings.customKeywords.length > 0 ? (
              <View style={styles.keywordList}>
                {settings.customKeywords.map((keyword, index) => (
                  <TouchableOpacity
                    key={`${keyword}-${index}`}
                    style={[
                      styles.keywordChip,
                      {
                        backgroundColor: `${colors.primary}14`,
                        borderColor: `${colors.primary}33`,
                      },
                    ]}
                    onPress={() => handleRemoveKeyword(keyword)}
                    accessibilityRole="button"
                    accessibilityLabel={`${keyword} kelimesini kaldır`}
                  >
                    <Text style={[styles.keywordText, { color: colors.primary }]}>
                      {keyword}
                    </Text>
                    <Ionicons name="close" size={12} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Henüz özel anahtar kelime yok
              </Text>
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
    marginBottom: 14,
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
    backgroundColor: "rgba(157, 175, 198, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(157, 175, 198, 0.3)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#9DAFC6",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
  },

  roadmapBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  roadmapText: { flex: 1, minWidth: 0 },
  roadmapTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  roadmapHint: { fontSize: 12, lineHeight: 17 },

  cardSpacing: { marginBottom: 14 },

  testInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  testInputSmall: { minHeight: 0 },
  testBtn: { marginTop: 4 },
  testResult: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  testResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  testResultTitle: { fontSize: 15, fontWeight: "800" },
  testResultText: { fontSize: 13, lineHeight: 18 },
  testResultEmphasis: { fontWeight: "800" },
  reasonsList: { marginTop: 6, gap: 4 },
  reasonsLabel: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  reasonRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  reasonDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 7 },
  reasonText: { fontSize: 13, lineHeight: 18, flex: 1 },

  statRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statNumber: { fontSize: 28, fontWeight: "900" },
  statLabel: { fontSize: 12, fontWeight: "600" },
  resetStatsBtn: { marginTop: 12 },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    gap: 12,
  },
  toggleInfo: { flex: 1, minWidth: 0 },
  toggleLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  toggleHint: { fontSize: 12, lineHeight: 16 },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
  },
  strengthLabel: { fontSize: 13, fontWeight: "600" },
  strengthChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  strengthValue: { fontSize: 12, fontWeight: "800" },
  strengthMeta: { fontSize: 11, marginTop: 8 },

  keywordInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  keywordInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  keywordList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  keywordChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  keywordText: { fontSize: 12, fontWeight: "700" },
  emptyText: { fontSize: 13, fontStyle: "italic", marginTop: 12 },

  skelBack: { marginBottom: 10 },
  skelTitle: { marginBottom: 16 },
  skelGap: { marginTop: 8 },
});
