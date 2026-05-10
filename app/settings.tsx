import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ADDICTION_KEYS,
  ADDICTION_LABELS,
  type UserAddictions,
  useUserAddictionsStore,
} from "@/store/userAddictionsStore";
import { THEME_OPTIONS, useTheme } from "@/contexts/ThemeContext";

export default function SettingsScreen() {
  const { userAddictions, hydrated, setManyAddictions } = useUserAddictionsStore();
  const { theme, setTheme, colors } = useTheme();
  const [draft, setDraft] = useState<UserAddictions>(userAddictions);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated) {
      setDraft(userAddictions);
    }
  }, [hydrated, userAddictions]);

  const selectedCount = useMemo(
    () => ADDICTION_KEYS.filter((key) => draft[key]).length,
    [draft]
  );
  const hasChanges = useMemo(
    () => ADDICTION_KEYS.some((key) => draft[key] !== userAddictions[key]),
    [draft, userAddictions]
  );

  const handleToggle = (key: (typeof ADDICTION_KEYS)[number]) => {
    if (draft[key] && selectedCount === 1) {
      Alert.alert("En az bir secim gerekli", "En az bir bagimlilik secili olmali.");
      return;
    }
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (selectedCount === 0 || saving) return;
    try {
      setSaving(true);
      await setManyAddictions(draft);
      Alert.alert("Kaydedildi", "Kumar takibi guncellendi.");
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.primary }]}>← Geri</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Ayarlar</Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gorsel Temalar</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Uygulamanin genel gorunusunu degistirin.
            </Text>

            {THEME_OPTIONS.map((option) => {
              const selected = option.id === theme;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.themeRow,
                    {
                      backgroundColor: selected ? colors.primary + "14" : colors.card,
                      borderColor: selected ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setTheme(option.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.themeTextBlock}>
                    <Text style={[styles.themeLabel, { color: colors.text }]}>
                      {option.emoji} {option.label}
                    </Text>
                    <Text style={[styles.themeHint, { color: colors.textMuted }]}>
                      {option.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.themeBadge,
                      {
                        backgroundColor: selected ? colors.primary : colors.cardBorder,
                        borderColor: selected ? colors.secondary : colors.cardBorder,
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kumar Takibini Yonet</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Kumar takibini acip kapatabilirsiniz. En az bir secim gerekli.
            </Text>

            {ADDICTION_KEYS.map((key) => (
              <View key={key} style={[styles.toggleRow, { borderBottomColor: colors.cardBorder }]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>{ADDICTION_LABELS[key]}</Text>
                  <Text style={[styles.toggleHint, { color: colors.textMuted }]}>Takibi ac / kapat</Text>
                </View>
                <Switch
                  value={draft[key]}
                  onValueChange={() => handleToggle(key)}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}

            {selectedCount === 0 && (
              <Text style={[styles.warning, { color: colors.danger }]}>En az bir secim yapmalisiniz.</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              (!hasChanges || selectedCount === 0 || saving) && styles.primaryButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || selectedCount === 0 || saving}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
          </TouchableOpacity>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gizlilik ve Guvenlik</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Uygulama politikalari, sinirlamalar ve veri kullanimi.
            </Text>
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.cardBorder }]} onPress={() => router.push("/privacy")}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>Gizlilik Politikasi</Text>
              <Text style={[styles.linkArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.cardBorder }]} onPress={() => router.push("/terms")}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>Kullanim Sartlari</Text>
              <Text style={[styles.linkArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.cardBorder }]} onPress={() => router.push("/limitations")}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>Sinirlamalar</Text>
              <Text style={[styles.linkArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mesaj Korumasi</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              SMS spam filtresi ve ozel anahtar kelimeler.
            </Text>
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.cardBorder }]} onPress={() => router.push("/sms-filter")}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>SMS Filtresi</Text>
              <Text style={[styles.linkArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Yardim ve Tani</Text>
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.cardBorder }]} onPress={() => router.push("/support")}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>Destek Agi</Text>
              <Text style={[styles.linkArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.cardBorder }]} onPress={() => router.push("/sos")}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>SOS</Text>
              <Text style={[styles.linkArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.cardBorder }]} onPress={() => router.push("/diagnostics")}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>Tanilamalar</Text>
              <Text style={[styles.linkArrow, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 10 },
  backText: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 30, fontWeight: "900" },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  themeRow: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeTextBlock: { flex: 1, paddingRight: 12 },
  themeLabel: { fontSize: 15, fontWeight: "700" },
  themeHint: { fontSize: 12, marginTop: 3 },
  themeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "700" },
  toggleHint: { fontSize: 12, marginTop: 2 },
  warning: { fontSize: 12, marginTop: 12, fontWeight: "600" },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  linkLabel: { fontSize: 14, fontWeight: "700" },
  linkArrow: { fontSize: 16, fontWeight: "700" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
});
