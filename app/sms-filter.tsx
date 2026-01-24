import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { FilterSettings, SpamDetectionResult } from "@/services/sms-filter/types";
import {
  getFilterSettings,
  updateFilterSettings,
  addCustomKeyword,
  removeCustomKeyword,
  toggleFilter,
} from "@/store/smsFilterStore";
import { getAllKeywords } from "@/services/sms-filter/keywords";
import { SMSFilterService } from "@/services/sms-filter";
import { getFilterStats, incrementAllowed, incrementBlocked, resetFilterStats } from "@/store/smsFilterStatsStore";
import { isDefaultSmsApp, requestDefaultSmsRole } from "@/react-native-bridge/SmsRoleModule";

export default function SMSFilterScreen() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FilterSettings>({
    enabled: true,
    customKeywords: [],
    autoDeleteDays: null,
    strictMode: false,
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testSender, setTestSender] = useState("Bilinmiyor");
  const [testResult, setTestResult] = useState<SpamDetectionResult | null>(null);
  const [stats, setStats] = useState({ blocked: 0, allowed: 0 });
  const [defaultSms, setDefaultSms] = useState<boolean | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await getFilterSettings();
      setSettings(loadedSettings);
      const currentStats = await getFilterStats();
      setStats(currentStats);
      if (Platform.OS === "android") {
        const isDefault = await isDefaultSmsApp();
        setDefaultSms(isDefault);
      }
    } catch (error) {
      console.error("Ayarlar yüklenirken hata:", error);
      Alert.alert("Hata", "Ayarlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDefaultSms = async () => {
    if (Platform.OS !== "android") return;
    try {
      setRoleLoading(true);
      const granted = await requestDefaultSmsRole();
      setDefaultSms(granted);
      if (!granted) {
        Alert.alert("Varsayılan SMS Gerekli", "SMS filtreleme için varsayılan SMS uygulaması olmalısın.");
      }
    } finally {
      setRoleLoading(false);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    try {
      if (Platform.OS === "android" && value && defaultSms === false) {
        Alert.alert(
          "Varsayılan SMS Gerekli",
          "Filtreyi açmak için AntiSlot'u varsayılan SMS uygulaması yapmalısın."
        );
        return;
      }
      await toggleFilter(value);
      setSettings({ ...settings, enabled: value });
    } catch {
      Alert.alert("Hata", "Ayarlar güncellenemedi.");
    }
  };

  const handleToggleStrictMode = async (value: boolean) => {
    try {
      await updateFilterSettings({ strictMode: value });
      setSettings({ ...settings, strictMode: value });
    } catch {
      Alert.alert("Hata", "Ayarlar güncellenemedi.");
    }
  };

  const handleAddKeyword = async () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert("Geçersiz", "Lütfen bir anahtar kelime girin.");
      return;
    }

    if (settings.customKeywords.includes(trimmed)) {
      Alert.alert("Yinelenen", "Bu anahtar kelime zaten var.");
      setNewKeyword("");
      return;
    }

    try {
      await addCustomKeyword(trimmed);
      setSettings({ ...settings, customKeywords: [...settings.customKeywords, trimmed] });
      setNewKeyword("");
    } catch {
      Alert.alert("Hata", "Anahtar kelime eklenemedi.");
    }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    Alert.alert(
      "Anahtar Kelimeyi Kaldır",
      `"${keyword}" anahtar kelimesi engel listesinden çıkarılsın mı?`,
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
                customKeywords: settings.customKeywords.filter(k => k !== keyword),
              });
            } catch {
              Alert.alert("Hata", "Anahtar kelime kaldırılamadı.");
            }
          },
        },
      ]
    );
  };

  const handleAutoDeleteChange = async (days: number | null) => {
    try {
      await updateFilterSettings({ autoDeleteDays: days });
      setSettings({ ...settings, autoDeleteDays: days });
    } catch {
      Alert.alert("Hata", "Otomatik silme ayarı güncellenemedi.");
    }
  };

  const totalKeywords = getAllKeywords().length + settings.customKeywords.length;
  const strengthLabel = useMemo(() => {
    if (settings.strictMode && totalKeywords > 150) return "Maksimum";
    if (settings.strictMode) return "Yüksek";
    if (totalKeywords > 150) return "Güçlü";
    return "Standart";
  }, [settings.strictMode, totalKeywords]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const handleTestMessage = async () => {
    if (!testMessage.trim()) {
      Alert.alert("Boş Mesaj", "Test etmek için bir mesaj girin.");
      return;
    }
    const service = new SMSFilterService(settings.customKeywords, settings.strictMode);
    const result = service.classify({ body: testMessage, sender: testSender });
    setTestResult(result);
    if (result.isSpam) {
      await incrementBlocked();
    } else {
      await incrementAllowed();
    }
    const updatedStats = await getFilterStats();
    setStats(updatedStats);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>SMS Spam Filtresi</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🛡️ Koruma Etkin</Text>
          <Text style={styles.infoText}>
            Kumar, bahis, dolandırıcılık ve istenmeyen reklamları içeren spam mesajları engeller.
          </Text>
          <Text style={styles.infoStats}>
            {totalKeywords} anahtar kelime • {settings.customKeywords.length} özel • Güç: {strengthLabel}
          </Text>
        </View>

        {Platform.OS === "android" && defaultSms === false && (
          <View style={styles.roleCard}>
            <Text style={styles.roleTitle}>Varsayılan SMS Uygulaması</Text>
            <Text style={styles.roleText}>
              Android&apos;de SMS filtreleme için AntiSlot&apos;u varsayılan SMS uygulaması olarak ayarlamalısın.
            </Text>
            <TouchableOpacity
              style={styles.roleButton}
              onPress={handleRequestDefaultSms}
              disabled={roleLoading}
            >
              <Text style={styles.roleButtonText}>
                {roleLoading ? "İşleniyor..." : "Varsayılan Yap"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.blocked}</Text>
            <Text style={styles.statLabel}>Engellendi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.allowed}</Text>
            <Text style={styles.statLabel}>İzin Verildi</Text>
          </View>
          <TouchableOpacity
            style={styles.resetStatsBtn}
            onPress={async () => {
              await resetFilterStats();
              const updated = await getFilterStats();
              setStats(updated);
            }}
          >
            <Text style={styles.resetStatsText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>

        {/* Etkinleştirme/Devre dışı bırakma anahtarı */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Spam Filtresini Etkinleştir</Text>
              <Text style={styles.settingDescription}>
                Tespit edilen spam mesajları otomatik engeller
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: "#ccc", true: "#1E7A55" }}
              thumbColor="#fff"
              disabled={Platform.OS === "android" && defaultSms === false}
            />
          </View>
        </View>

        {/* Strict Mode */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Sıkı Mod</Text>
              <Text style={styles.settingDescription}>
                Daha agresif filtreleme (daha fazla spam yakalayabilir, fakat daha fazla yanlış pozitif de olabilir)
              </Text>
            </View>
            <Switch
              value={settings.strictMode}
              onValueChange={handleToggleStrictMode}
              trackColor={{ false: "#ccc", true: "#D06B5C" }}
              thumbColor="#fff"
              disabled={!settings.enabled}
            />
          </View>
        </View>

        {/* Custom Keywords */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Özel Anahtar Kelimeler</Text>
          <Text style={styles.sectionDescription}>
            Engellemek için kendi anahtar kelimelerinizi ekleyin. Bu kelimeleri içeren mesajlar filtrelenir.
          </Text>

          {/* Anahtar kelime girişi ekle */}
          <View style={styles.keywordInputContainer}>
            <TextInput
              style={styles.keywordInput}
              placeholder="Anahtar kelime girin (ör. 'casino', 'promo')"
              value={newKeyword}
              onChangeText={setNewKeyword}
              onSubmitEditing={handleAddKeyword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddKeyword}
            >
              <Text style={styles.addButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>

          {/* Keyword List */}
          {settings.customKeywords.length > 0 ? (
            <View style={styles.keywordList}>
              {settings.customKeywords.map((keyword, index) => (
                <View key={index} style={styles.keywordTag}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveKeyword(keyword)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Henüz özel anahtar kelime eklenmedi</Text>
          )}
        </View>

        {/* Otomatik silme ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engellenen Mesajları Otomatik Sil</Text>
          <Text style={styles.sectionDescription}>
            Engellenen mesajları belirli bir gün sayısından sonra otomatik sil
          </Text>

          <View style={styles.autoDeleteOptions}>
            {[null, 7, 14, 30].map((days) => (
              <TouchableOpacity
                key={days || 0}
                style={[
                  styles.autoDeleteOption,
                  settings.autoDeleteDays === days && styles.autoDeleteOptionActive,
                ]}
                onPress={() => handleAutoDeleteChange(days)}
              >
                <Text
                  style={[
                    styles.autoDeleteOptionText,
                    settings.autoDeleteDays === days && styles.autoDeleteOptionTextActive,
                  ]}
                >
                  {days === null ? "Hiçbir zaman" : `${days} gün`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMS Filtresini Test Et</Text>
          <Text style={styles.sectionDescription}>
            Sınıflandırıcının nasıl tepki verdiğini görmek için bir mesaj yapıştırın.
          </Text>
          <TextInput
            style={styles.testInput}
            placeholder="Mesaj içeriği..."
            value={testMessage}
            onChangeText={setTestMessage}
            multiline
          />
          <TextInput
            style={styles.testInput}
            placeholder="Gönderen (isteğe bağlı)"
            value={testSender}
            onChangeText={setTestSender}
          />
          <TouchableOpacity style={styles.testButton} onPress={handleTestMessage}>
            <Text style={styles.testButtonText}>Testi Çalıştır</Text>
          </TouchableOpacity>
          {testResult && (
            <View style={styles.testResult}>
              <Text style={styles.testResultTitle}>
                Sonuç: {testResult.isSpam ? "Engellendi" : "İzin Verildi"}
              </Text>
              <Text style={styles.testResultText}>Kategori: {testResult.category}</Text>
              <Text style={styles.testResultText}>Güven: {testResult.confidence}</Text>
              <Text style={styles.testResultText}>Nedenler:</Text>
              {testResult.reasons.map((reason, index) => (
                <Text key={`${reason}-${index}`} style={styles.testResultText}>• {reason}</Text>
              ))}
            </View>
          )}
        </View>

        {/* iOS Native Integration Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>ℹ️ iOS Entegrasyonu</Text>
          <Text style={styles.noteText}>
            iOS&apos;ta otomatik SMS filtreleme için ILMessageFilterExtension ve yerel kurulum gerekir.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F9FF",
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
    color: "#1D4C72",
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1D4C72",
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: "#1E7A55",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 8,
    lineHeight: 20,
  },
  infoStats: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1D4C72",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  resetStatsBtn: {
    backgroundColor: "#D06B5C",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  resetStatsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D4C72",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D4C72",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  keywordInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  keywordInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#1D4C72",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  keywordList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  keywordTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4F0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  keywordText: {
    fontSize: 14,
    color: "#1E7A55",
    fontWeight: "500",
    marginRight: 6,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1E7A55",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
  },
  autoDeleteOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  autoDeleteOption: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    marginBottom: 8,
  },
  autoDeleteOptionActive: {
    backgroundColor: "#1D4C72",
  },
  autoDeleteOptionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  autoDeleteOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  noteCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: "#E65100",
    lineHeight: 18,
  },
  roleCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FB923C",
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 6,
  },
  roleText: {
    fontSize: 13,
    color: "#9A3412",
    lineHeight: 18,
    marginBottom: 10,
  },
  roleButton: {
    backgroundColor: "#FB923C",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  roleButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  testInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: "#1D4C72",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  testResult: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
  },
  testResultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4C72",
    marginBottom: 6,
  },
  testResultText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
});
