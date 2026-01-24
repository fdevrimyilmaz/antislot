import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import * as SecureStore from "expo-secure-store";

interface DiagnosticData {
  smsFilterEnabled: boolean;
  smsFilterStrictMode: boolean;
  smsFilterKeywords: number;
  smsFilterCustomKeywords: number;
  lastBlocklistUpdate: string | null;
  lastPatternsUpdate: string | null;
  totalBlocked: number;
  totalAllowed: number;
  appVersion: string;
}

export default function DiagnosticsScreen() {
  const [data, setData] = useState<DiagnosticData>({
    smsFilterEnabled: false,
    smsFilterStrictMode: false,
    smsFilterKeywords: 0,
    smsFilterCustomKeywords: 0,
    lastBlocklistUpdate: null,
    lastPatternsUpdate: null,
    totalBlocked: 0,
    totalAllowed: 0,
    appVersion: "1.0.0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      const settings = await getFilterSettings();
      
      // Sayaçları yükle
      const blockedStr = await SecureStore.getItemAsync("antislot_blocked_count") || "0";
      const allowedStr = await SecureStore.getItemAsync("antislot_allowed_count") || "0";
      const blocklistUpdate = await SecureStore.getItemAsync("antislot_blocklist_update");
      const patternsUpdate = await SecureStore.getItemAsync("antislot_patterns_update");

      // Anahtar kelime sayımlarını al
      const { getAllKeywords } = await import("@/services/sms-filter/keywords");
      const defaultKeywords = getAllKeywords().length;

      setData({
        smsFilterEnabled: settings.enabled,
        smsFilterStrictMode: settings.strictMode,
        smsFilterKeywords: defaultKeywords,
        smsFilterCustomKeywords: settings.customKeywords.length,
        lastBlocklistUpdate: blocklistUpdate || null,
        lastPatternsUpdate: patternsUpdate || null,
        totalBlocked: parseInt(blockedStr, 10),
        totalAllowed: parseInt(allowedStr, 10),
        appVersion:
          Constants.expoConfig?.version ||
          (Constants.manifest as { version?: string } | undefined)?.version ||
          "1.0.0",
      });
    } catch (error) {
      console.error("Tanılama bilgileri yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "Hiç";
    try {
      const date = new Date(parseInt(timestamp, 10));
      return date.toLocaleString();
    } catch {
      return "Geçersiz";
    }
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
          <Text style={styles.title}>Tanılamalar</Text>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama Bilgileri</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sürüm</Text>
            <Text style={styles.infoValue}>{data.appVersion}</Text>
          </View>
        </View>

        {/* SMS Filter Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMS Filtre Durumu</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Filtre Etkin</Text>
            </View>
            <Switch value={data.smsFilterEnabled} disabled trackColor={{ false: "#ccc", true: "#1E7A55" }} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Sıkı Mod</Text>
            </View>
            <Switch value={data.smsFilterStrictMode} disabled trackColor={{ false: "#ccc", true: "#D06B5C" }} />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Varsayılan Anahtar Kelimeler</Text>
            <Text style={styles.infoValue}>{data.smsFilterKeywords}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Özel Anahtar Kelimeler</Text>
            <Text style={styles.infoValue}>{data.smsFilterCustomKeywords}</Text>
          </View>
        </View>

        {/* Zaman damgalarını güncelle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Güncellemeler</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Engel Listesi</Text>
            <Text style={styles.infoValue}>{formatTimestamp(data.lastBlocklistUpdate)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kalıplar</Text>
            <Text style={styles.infoValue}>{formatTimestamp(data.lastPatternsUpdate)}</Text>
          </View>
        </View>

        {/* Counters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mesaj İstatistikleri</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{data.totalBlocked}</Text>
              <Text style={styles.statLabel}>Engellendi</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{data.totalAllowed}</Text>
              <Text style={styles.statLabel}>İzin Verildi</Text>
            </View>
          </View>
        </View>

        {/* Sıfırlama düğmesi */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={async () => {
            await SecureStore.deleteItemAsync("antislot_blocked_count");
            await SecureStore.deleteItemAsync("antislot_allowed_count");
            await loadDiagnostics();
          }}
        >
          <Text style={styles.resetButtonText}>Sayaçları Sıfırla</Text>
        </TouchableOpacity>
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
    fontWeight: "600",
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D4C72",
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1D4C72",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  resetButton: {
    backgroundColor: "#D06B5C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 8,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
