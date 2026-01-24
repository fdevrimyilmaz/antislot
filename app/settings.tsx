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
import {
  ADDICTION_KEYS,
  ADDICTION_LABELS,
  type UserAddictions,
  useUserAddictionsStore,
} from "@/store/userAddictionsStore";

// Settings: manage which addictions are active.
export default function SettingsScreen() {
  const { userAddictions, hydrated, setManyAddictions } = useUserAddictionsStore();
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
      Alert.alert("En az bir seçim gerekli", "En az bir bağımlılık seçili olmalı.");
      return;
    }
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (selectedCount === 0 || saving) return;
    try {
      setSaving(true);
      await setManyAddictions(draft);
      Alert.alert("Kaydedildi", "Kumar takibi güncellendi.");
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ayarlar</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kumar Takibini Yönet</Text>
          <Text style={styles.sectionSubtitle}>
            Kumar takibini açıp kapatabilirsin. En az bir seçim gerekli.
          </Text>

          {ADDICTION_KEYS.map((key) => (
            <View key={key} style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{ADDICTION_LABELS[key]}</Text>
                <Text style={styles.toggleHint}>Takibi aç / kapat</Text>
              </View>
              <Switch
                value={draft[key]}
                onValueChange={() => handleToggle(key)}
                trackColor={{ false: "#CBD5E1", true: "#1D4C72" }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}

          {selectedCount === 0 && (
            <Text style={styles.warning}>En az bir seçim yapmalısın.</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!hasChanges || selectedCount === 0 || saving) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || selectedCount === 0 || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>{saving ? "Kaydediliyor..." : "Kaydet"}</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gizlilik ve Güvenlik</Text>
          <Text style={styles.sectionSubtitle}>
            Uygulama politikaları, sınırlamalar ve veri kullanımı.
          </Text>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/privacy")}>
            <Text style={styles.linkLabel}>Gizlilik Politikası</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/terms")}>
            <Text style={styles.linkLabel}>Kullanım Şartları</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/limitations")}>
            <Text style={styles.linkLabel}>Sınırlamalar</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mesaj Koruması</Text>
          <Text style={styles.sectionSubtitle}>
            SMS spam filtresi ve özel anahtar kelimeler.
          </Text>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/sms-filter")}>
            <Text style={styles.linkLabel}>SMS Filtresi</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yardım & Tanılama</Text>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/support")}>
            <Text style={styles.linkLabel}>Destek Ağı</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/sos")}>
            <Text style={styles.linkLabel}>SOS</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/diagnostics")}>
            <Text style={styles.linkLabel}>Tanılamalar</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 10 },
  backText: { fontSize: 16, color: "#1D4C72" },
  title: { fontSize: 28, fontWeight: "900", color: "#1D4C72" },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1D4C72", marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 18 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: "#222" },
  toggleHint: { fontSize: 12, color: "#777", marginTop: 2 },
  warning: { fontSize: 12, color: "#D06B5C", marginTop: 12 },
  primaryButton: {
    backgroundColor: "#1D4C72",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: { backgroundColor: "#B8C6D6" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  linkLabel: { fontSize: 14, fontWeight: "700", color: "#222" },
  linkArrow: { fontSize: 16, color: "#1D4C72", fontWeight: "700" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F9FF" },
});
