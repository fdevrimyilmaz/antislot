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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { getFilterSettings } from "@/store/smsFilterStore";

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

const INITIAL_DATA: DiagnosticData = {
  smsFilterEnabled: false,
  smsFilterStrictMode: false,
  smsFilterKeywords: 0,
  smsFilterCustomKeywords: 0,
  lastBlocklistUpdate: null,
  lastPatternsUpdate: null,
  totalBlocked: 0,
  totalAllowed: 0,
  appVersion: "1.0.0",
};

export default function DiagnosticsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [data, setData] = useState<DiagnosticData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  const loadDiagnostics = async () => {
    try {
      const settings = await getFilterSettings();
      const blockedStr = (await SecureStore.getItemAsync("antislot_blocked_count")) || "0";
      const allowedStr = (await SecureStore.getItemAsync("antislot_allowed_count")) || "0";
      const blocklistUpdate = await SecureStore.getItemAsync("antislot_blocklist_update");
      const patternsUpdate = await SecureStore.getItemAsync("antislot_patterns_update");

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
      reportError(error, { scope: "diagnostics.load", level: "warning" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "Hiç";
    try {
      const date = new Date(parseInt(timestamp, 10));
      return date.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Geçersiz";
    }
  };

  const handleReset = async () => {
    haptics.warning();
    try {
      await SecureStore.deleteItemAsync("antislot_blocked_count");
      await SecureStore.deleteItemAsync("antislot_allowed_count");
      await loadDiagnostics();
      haptics.success();
      toast.success("Sayaçlar sıfırlandı.", "Tamam");
    } catch (error) {
      reportError(error, { scope: "diagnostics.reset" });
      haptics.error();
      toast.error("Sayaçlar sıfırlanamadı.", "Hata");
    }
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

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Tanılamalar
          </Text>

          <Card style={styles.cardSpacing}>
            <SectionHeader title="Uygulama Bilgileri" icon="information-circle" />
            <InfoRow label="Sürüm" value={data.appVersion} colors={colors} loading={loading} />
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="SMS Tanıyıcı"
              icon="flask"
              subtitle="Sınıflandırıcı sözlüğü ve modunun durumu."
            />
            <View style={styles.list}>
              <View style={[styles.toggleRow, dividerStyle(colors)]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>Sıkı Mod</Text>
                </View>
                <Switch
                  value={data.smsFilterStrictMode}
                  disabled
                  trackColor={{ false: colors.cardBorder, true: colors.warning }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <InfoRow
                label="Hazır Anahtar Kelimeler"
                value={String(data.smsFilterKeywords)}
                colors={colors}
                loading={loading}
                divider
              />
              <InfoRow
                label="Özel Anahtar Kelimeler"
                value={String(data.smsFilterCustomKeywords)}
                colors={colors}
                loading={loading}
              />
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader title="Son Güncellemeler" icon="time" />
            <InfoRow
              label="Engel Listesi"
              value={formatTimestamp(data.lastBlocklistUpdate)}
              colors={colors}
              loading={loading}
              divider
            />
            <InfoRow
              label="Kalıplar"
              value={formatTimestamp(data.lastPatternsUpdate)}
              colors={colors}
              loading={loading}
            />
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader title="Mesaj İstatistikleri" icon="bar-chart" />
            <View style={styles.statRow}>
              <StatCard
                value={data.totalBlocked}
                label="Engellendi"
                icon="shield"
                colors={colors}
                tone="danger"
                loading={loading}
              />
              <StatCard
                value={data.totalAllowed}
                label="İzin Verildi"
                icon="checkmark-circle"
                colors={colors}
                tone="success"
                loading={loading}
              />
            </View>
          </Card>

          <Button
            title="Sayaçları Sıfırla"
            onPress={handleReset}
            variant="destructive"
            fullWidth
            leftIcon="refresh"
            style={styles.resetBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function dividerStyle(colors: { cardBorder: string }) {
  return {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  };
}

function InfoRow({
  label,
  value,
  colors,
  loading,
  divider,
}: {
  label: string;
  value: string;
  colors: { text: string; textMuted: string; primary: string; cardBorder: string };
  loading: boolean;
  divider?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        divider && {
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      {loading ? (
        <Skeleton width={80} height={14} radius={6} />
      ) : (
        <Text style={[styles.infoValue, { color: colors.primary }]}>{value}</Text>
      )}
    </View>
  );
}

function StatCard({
  value,
  label,
  icon,
  colors,
  tone,
  loading,
}: {
  value: number;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  colors: { card: string; cardBorder: string; text: string; textMuted: string; primary: string; danger: string; success: string };
  tone: "success" | "danger";
  loading: boolean;
}) {
  const accent = tone === "success" ? colors.success : colors.danger;
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: `${accent}12`,
          borderColor: `${accent}33`,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={accent} />
      {loading ? (
        <Skeleton width={50} height={28} radius={6} style={styles.statSkel} />
      ) : (
        <Text style={[styles.statNumber, { color: accent }]}>{value}</Text>
      )}
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
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
    marginBottom: 10,
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 18,
  },
  cardSpacing: { marginBottom: 14 },
  list: { width: "100%" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 12,
  },
  infoLabel: { fontSize: 14, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: "700", textAlign: "right" },
  statRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  statSkel: { marginTop: 4 },
  statNumber: { fontSize: 28, fontWeight: "900" },
  statLabel: { fontSize: 12, fontWeight: "600" },
  resetBtn: { marginTop: 4 },
});
