import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
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
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import {
  DNS_PROVIDERS,
  type DnsProvider,
  getProviderById,
  getSelectedProviderId,
  setSelectedProviderId,
} from "@/store/dnsProviderStore";

/**
 * Android Private DNS setup guide.
 *
 * The app never changes the system DNS itself — that requires platform
 * privileges Play Store will not grant. This screen shows the hostname,
 * lets the user copy it, and opens the Network settings page so they can
 * paste it into Settings → Network & Internet → Private DNS.
 *
 * iOS users land on a different flow (Safari Content Blocker); they
 * shouldn't reach this screen, but if they do the guidance is honest about
 * not applying.
 */
export default function AndroidDnsSetupScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string>(DNS_PROVIDERS[0].id);
  const selected = getProviderById(selectedId);

  useEffect(() => {
    (async () => {
      const stored = await getSelectedProviderId();
      setSelectedId(stored);
    })();
  }, []);

  const handleSelect = async (provider: DnsProvider) => {
    haptics.selection();
    setSelectedId(provider.id);
    await setSelectedProviderId(provider.id);
  };

  const handleCopy = async () => {
    haptics.tapMedium();
    await Clipboard.setStringAsync(selected.hostname);
    toast.success("DNS adresi panoya kopyalandı.", "Kopyalandı");
  };

  const handleOpenSettings = async () => {
    haptics.tapMedium();
    if (Platform.OS !== "android") {
      toast.info("Bu rehber yalnızca Android'de çalışır.", "iOS");
      return;
    }
    try {
      // Network settings is the closest standard intent Android exposes;
      // there's no dedicated intent for the Private DNS sub-screen. User
      // taps once more to land on Private DNS.
      await Linking.sendIntent("android.settings.WIRELESS_SETTINGS");
    } catch {
      try {
        await Linking.openSettings();
      } catch {
        toast.warning(
          "Ayarlar uygulaması açılamadı, manuel olarak Ağ ayarlarına git.",
          "Aç"
        );
      }
    }
  };

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            Özel DNS Kurulumu
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Android, Özel DNS (DoT) ile sistem genelinde alan adı engellemeyi
            destekler. Aşağıdaki adresi kullanarak tarayıcılarda ve diğer
            uygulamalarda kumar siteleri engellenebilir.
          </Text>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="DNS sağlayıcısını seç"
              icon="globe"
              subtitle="Engellemek istediğin kategoriye göre bir sağlayıcı seç."
            />
            {DNS_PROVIDERS.map((provider) => {
              const isActive = provider.id === selectedId;
              return (
                <TouchableOpacity
                  key={provider.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelect(provider)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.providerRow,
                    {
                      borderColor: isActive ? colors.primary : colors.cardBorder,
                      backgroundColor: isActive
                        ? `${colors.primary}10`
                        : "transparent",
                    },
                  ]}
                >
                  <View style={styles.providerRowText}>
                    <Text style={[styles.providerLabel, { color: colors.text }]}>
                      {provider.label}
                    </Text>
                    <Text
                      style={[styles.providerHint, { color: colors.textMuted }]}
                    >
                      {provider.description}
                    </Text>
                  </View>
                  <Ionicons
                    name={isActive ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={isActive ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="DNS adresi"
              icon="code-slash"
              subtitle="Bu adresi 'Sağlayıcı ana makine adı' alanına yapıştır."
            />
            <View
              style={[
                styles.hostnameBox,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <Text
                style={[styles.hostnameText, { color: colors.text }]}
                selectable
              >
                {selected.hostname}
              </Text>
            </View>
            <Button
              title="Adresi Kopyala"
              onPress={handleCopy}
              variant="primary"
              fullWidth
              leftIcon="copy"
              style={styles.copyBtn}
            />
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Adım adım kurulum"
              icon="list"
              subtitle="Telefonda yapacağın 5 adım."
            />
            {STEPS.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View
                  style={[styles.stepBadge, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.stepBadgeText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  {step}
                </Text>
              </View>
            ))}
            <Button
              title="Ağ Ayarlarını Aç"
              onPress={handleOpenSettings}
              variant="secondary"
              fullWidth
              leftIcon="open-outline"
              style={styles.openBtn}
            />
          </Card>

          <Card
            style={[
              styles.cardSpacing,
              { backgroundColor: `${colors.warning}12` },
            ]}
          >
            <View style={styles.warningRow}>
              <Ionicons name="information-circle" size={20} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                Bu ayar telefonun sistem genelinde uygulanır. Wi-Fi ve mobil
                veri ağlarının ikisinde de aktif olur. AntiSlot bu ayarı
                otomatik değiştirmez — sen ne zaman istersen kaldırabilirsin.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const STEPS = [
  "Telefonun Ayarlar uygulamasını aç.",
  "Ağ ve İnternet (veya Bağlantılar) bölümüne gir.",
  "Özel DNS (Private DNS) seçeneğine dokun.",
  "“Özel DNS sağlayıcısının ana makine adı” seçeneğini işaretle.",
  "Yukarıdaki adresi yapıştır ve Kaydet'e dokun.",
];

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 22, paddingBottom: 60 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "900", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 18 },

  cardSpacing: { marginBottom: 14 },

  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    gap: 12,
  },
  providerRowText: { flex: 1, minWidth: 0 },
  providerLabel: { fontSize: 15, fontWeight: "800" },
  providerHint: { fontSize: 12, lineHeight: 17, marginTop: 4 },

  hostnameBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  hostnameText: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    fontSize: 16,
    fontWeight: "700",
  },
  copyBtn: { marginTop: 4 },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: { flex: 1, fontSize: 13, lineHeight: 19 },
  openBtn: { marginTop: 14 },

  warningRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  warningText: { fontSize: 12, lineHeight: 18, flex: 1 },
});
