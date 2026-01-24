import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import GamblingBlocker from "@/react-native-bridge/GamblingBlockerModule";
import { SharedConfig } from "@/react-native-bridge/SharedConfigModule";
import {
  addWhitelistDomain,
  checkDomainBlocked,
  getBlockerState,
  removeWhitelistDomain,
  saveApiUrl,
  syncBlocklist,
} from "@/store/blockerStore";

export default function BlockerScreen() {
  const [loading, setLoading] = useState(true);
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [domainsCount, setDomainsCount] = useState(0);
  const [patternsCount, setPatternsCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelist, setNewWhitelist] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<{ blocked: boolean; domain: string | null } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const state = await getBlockerState();
      setApiUrl(state.apiUrl);
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
      console.error("Engelleyici durumu yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProtection = async (value: boolean) => {
    try {
      if (value) {
        await GamblingBlocker.startProtection();
      } else {
        await GamblingBlocker.stopProtection();
      }
      setProtectionEnabled(value);
    } catch {
      Alert.alert("Hata", "Bu cihazda koruma açılıp kapatılamıyor.");
      setProtectionEnabled(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const state = await syncBlocklist(apiUrl);
      setApiUrl(state.apiUrl);
      setDomainsCount(state.domains.length);
      setPatternsCount(state.patterns.length);
      setLastSync(state.lastSync);
      try {
        await GamblingBlocker.syncBlocklist(apiUrl);
      } catch {
        // Yerel senkronizasyon mevcut değil
      }
      Alert.alert("Senkronizasyon Tamamlandı", "Engel listesi başarıyla güncellendi.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Engel listesi senkronize edilemedi.";
      Alert.alert("Senkronizasyon Başarısız", message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert("Geçersiz URL", "Lütfen geçerli bir API URL'si girin.");
      return;
    }
    try {
      const normalized = await saveApiUrl(apiUrl.trim());
      setApiUrl(normalized);
      Alert.alert("Kaydedildi", "API URL'si güncellendi.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "API URL'si kaydedilemedi.";
      Alert.alert("Hata", message);
    }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelist.trim()) return;
    const updated = await addWhitelistDomain(newWhitelist.trim());
    setWhitelist(updated);
    setNewWhitelist("");
  };

  const handleRemoveWhitelist = async (domain: string) => {
    const updated = await removeWhitelistDomain(domain);
    setWhitelist(updated);
  };

  const handleTestDomain = async () => {
    if (!testInput.trim()) return;
    const result = await checkDomainBlocked(testInput.trim());
    setTestResult(result);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <Text>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Web Engelleyici</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Koruma</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Korumayı Etkinleştir</Text>
            <Switch
              value={protectionEnabled}
              onValueChange={toggleProtection}
              trackColor={{ false: "#ccc", true: "#1E7A55" }}
              thumbColor="#fff"
            />
          </View>
          <Text style={styles.sectionSubtext}>
            Desteklendiğinde cihaz düzeyi koruma ile kumar alan adlarını engeller.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VPN Bilgilendirme</Text>
          <Text style={styles.sectionSubtext}>
            Uygulama, DNS düzeyinde engelleme için cihazda yerel VPN kullanır. Koruma etkinleşmesi için
            VPN&apos;i Ayarlar bölümünden onaylamanız gerekebilir.
          </Text>
          <Text style={styles.bulletText}>• Gezinti verileri toplanmaz, yerelde işlenir</Text>
          <Text style={styles.bulletText}>• DoH / uygulama içi tarayıcılar filtreyi aşabilir</Text>
          <Text style={styles.bulletText}>• En iyi koruma için VPN aktif olmalıdır</Text>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => Linking.openURL("app-settings:")}
            >
              <Text style={styles.secondaryButtonText}>VPN Ayarlarına Git</Text>
            </TouchableOpacity>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/limitations")}>
              <Text style={styles.secondaryButtonText}>Sınırlamalar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/privacy")}>
              <Text style={styles.secondaryButtonText}>Gizlilik</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engel Listesi Senkronizasyonu</Text>
          <TextInput
            style={styles.input}
            placeholder="API URL (ör. https://api.antislot.app veya http://localhost:3000)"
            value={apiUrl}
            onChangeText={setApiUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveApiUrl}>
              <Text style={styles.secondaryButtonText}>URL&apos;yi Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSync} disabled={syncing}>
              <Text style={styles.primaryButtonText}>{syncing ? "Senkronize ediliyor..." : "Şimdi Senkronize Et"}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alan Adları</Text>
            <Text style={styles.infoValue}>{domainsCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kalıplar</Text>
            <Text style={styles.infoValue}>{patternsCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Son Senkronizasyon</Text>
            <Text style={styles.infoValue}>
              {lastSync ? new Date(lastSync).toLocaleString() : "Hiç"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İzin Listesi</Text>
          <TextInput
            style={styles.input}
            placeholder="İzin listesine alan adı ekle"
            value={newWhitelist}
            onChangeText={setNewWhitelist}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddWhitelist}>
            <Text style={styles.secondaryButtonText}>İzin Listesine Ekle</Text>
          </TouchableOpacity>
          {whitelist.length > 0 ? (
            <View style={styles.tagList}>
              {whitelist.map((domain) => (
                <TouchableOpacity
                  key={domain}
                  style={styles.tag}
                  onPress={() => handleRemoveWhitelist(domain)}
                >
                  <Text style={styles.tagText}>{domain} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>İzin listesinde alan adı yok</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alan Adı Testi</Text>
          <TextInput
            style={styles.input}
            placeholder="Test etmek için URL veya alan adı girin"
            value={testInput}
            onChangeText={setTestInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleTestDomain}>
            <Text style={styles.primaryButtonText}>Kontrol Et</Text>
          </TouchableOpacity>
          {testResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                Alan adı: {testResult.domain || "Bilinmiyor"}
              </Text>
              <Text style={[styles.resultText, testResult.blocked ? styles.blocked : styles.allowed]}>
                {testResult.blocked ? "Engellendi" : "İzin Verildi"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backButton: { marginBottom: 12 },
  backButtonText: { fontSize: 16, color: "#1D4C72", fontWeight: "600" },
  title: { fontSize: 32, fontWeight: "900", color: "#1D4C72" },
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
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1D4C72", marginBottom: 12 },
  sectionSubtext: { fontSize: 13, color: "#666", marginTop: 8, lineHeight: 18 },
  bulletText: { fontSize: 13, color: "#444", marginTop: 6 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  settingLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  buttonRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  primaryButton: {
    backgroundColor: "#1D4C72",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flex: 1,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#E8F0F8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flex: 1,
  },
  secondaryButtonText: { color: "#1D4C72", fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: { color: "#666", fontSize: 14 },
  infoValue: { color: "#1D4C72", fontSize: 14, fontWeight: "600" },
  tagList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: "#E8F4F0", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14 },
  tagText: { color: "#1E7A55", fontSize: 13, fontWeight: "600" },
  emptyText: { fontSize: 13, color: "#999", fontStyle: "italic" },
  resultBox: { marginTop: 12, padding: 12, backgroundColor: "#F0F4F8", borderRadius: 12 },
  resultText: { fontSize: 14, color: "#333", marginBottom: 4 },
  blocked: { color: "#D06B5C", fontWeight: "700" },
  allowed: { color: "#1E7A55", fontWeight: "700" },
});
