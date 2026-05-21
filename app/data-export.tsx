import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
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
import {
  formatExport,
  gatherUserData,
  summarizeExport,
  type ExportedData,
} from "@/services/dataExport";

export default function DataExportScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [data, setData] = useState<ExportedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const gathered = await gatherUserData();
        if (active) {
          setData(gathered);
          setLoading(false);
        }
      } catch (error) {
        reportError(error, { scope: "data-export.gather" });
        if (active) {
          setLoading(false);
          toast.error("Veriler yüklenemedi.", "Hata");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  const handleShare = async () => {
    if (!data) return;
    setSharing(true);
    haptics.tapMedium();
    try {
      const payload = formatExport(data);
      const date = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      await Share.share({
        title: `Antislot Verileri ${date}`,
        message: payload,
      });
      haptics.success();
    } catch (error) {
      reportError(error, { scope: "data-export.share" });
      haptics.error();
      toast.error("Paylaşılamadı.", "Hata");
    } finally {
      setSharing(false);
    }
  };

  const summary = data ? summarizeExport(data) : [];
  const totalRecords = summary.reduce((s, item) => s + item.count, 0);

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ThemeTexture
        primary={colors.primary}
        secondary={colors.secondary}
        accent={colors.accent}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            Verilerimi Dışa Aktar
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Uygulamadaki tüm kayıtlı verilerin tek bir JSON dosyasında.
            Cihazından çıkmadan, sen seçtiğin yere (Notlar, Dosyalar, Mail,
            Drive) paylaşılır.
          </Text>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Paylaşılacak veri"
              icon="archive"
              meta={loading ? "..." : `${totalRecords} kayıt`}
            />
            {loading ? (
              <View style={styles.skelList}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height={28} radius={8} style={styles.skelRow} />
                ))}
              </View>
            ) : (
              <View style={styles.summaryList}>
                {summary.map((item, idx) => (
                  <View
                    key={item.label}
                    style={[
                      styles.summaryRow,
                      idx < summary.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.summaryLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.summaryCount,
                        {
                          color: item.count > 0 ? colors.primary : colors.textMuted,
                        },
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card
            style={[
              styles.cardSpacing,
              { backgroundColor: `${colors.success}10` },
            ]}
          >
            <View style={styles.privacyRow}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              <View style={styles.privacyText}>
                <Text style={[styles.privacyTitle, { color: colors.text }]}>
                  Hiçbir veri bulutta saklanmıyor
                </Text>
                <Text style={[styles.privacyBody, { color: colors.textMuted }]}>
                  Bu işlem sadece cihazında okuma yapar ve sistemin paylaşım
                  ekranını açar. Verin sunucumuza gitmez — yedeklemek için
                  Notlar’a yapıştır, Dosyalar’a kaydet veya kendine mail at.
                </Text>
              </View>
            </View>
          </Card>

          <Card
            style={[
              styles.cardSpacing,
              { backgroundColor: `${colors.warning}14` },
            ]}
          >
            <View style={styles.privacyRow}>
              <Ionicons name="information-circle" size={18} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                Bu dosyada acil durum kişilerin, kriz planın ve günlük
                kayıtların var. Güvendiğin bir yere kaydet, paylaşırken dikkat.
              </Text>
            </View>
          </Card>

          <Button
            title={sharing ? "Paylaşılıyor" : "JSON olarak paylaş"}
            onPress={handleShare}
            disabled={loading || sharing}
            loading={sharing}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon="share-social"
            style={styles.shareBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 22, paddingBottom: 60 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 18 },

  cardSpacing: { marginBottom: 14 },

  skelList: { gap: 8 },
  skelRow: { marginBottom: 0 },

  summaryList: {},
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  summaryLabel: { fontSize: 14, fontWeight: "700" },
  summaryCount: { fontSize: 16, fontWeight: "900" },

  privacyRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  privacyText: { flex: 1, minWidth: 0 },
  privacyTitle: { fontSize: 14, fontWeight: "800" },
  privacyBody: { fontSize: 12, marginTop: 4, lineHeight: 17 },

  warningText: { flex: 1, fontSize: 12, lineHeight: 17 },

  shareBtn: { marginTop: 6 },
});
