import { router } from "expo-router";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DATA_POINTS = [
  "Gezinme geçmişi toplanmaz",
  "DNS sorguları kaydedilmez veya iletilmez",
  "Kişisel bilgi toplanmaz",
  "Cihaz tanımlayıcıları toplanmaz",
  "Analitik veya izleme yoktur",
];

const LOCAL_STORAGE = [
  "Engel listesi ve kalıp kuralları",
  "İzin listesi (whitelist)",
  "Yerel istatistikler (engellenen/izin verilen sayıları)",
  "Seans ve günlük kayıtları",
];

const NETWORK_USAGE = [
  "Yalnızca engel listesi güncellemeleri indirilir",
  "Güncelleme istekleri kullanıcı verisi içermez",
  "AI destek mesajları cihaz içinde saklanır",
];

const SECURITY_POINTS = [
  "Engel listesi güncellemeleri HMAC imzası ile doğrulanır",
  "Senkronizasyonlar TLS/HTTPS üzerinden yapılır",
  "Geçersiz imza veya sürüm geri düşürme kabul edilmez",
];

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Gizlilik Politikası</Text>
        <Text style={styles.subtitle}>
          AntiSlot, kullanıcı gizliliğini temel alır. Aşağıdaki veriler toplanmaz ve paylaşılmaz.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Veri Toplama</Text>
          {DATA_POINTS.map((item) => (
            <Text key={item} style={styles.bulletText}>• {item}</Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yerel Depolama</Text>
          <Text style={styles.cardSub}>Bu veriler yalnızca cihazınızda saklanır:</Text>
          {LOCAL_STORAGE.map((item) => (
            <Text key={item} style={styles.bulletText}>• {item}</Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ağ Kullanımı</Text>
          {NETWORK_USAGE.map((item) => (
            <Text key={item} style={styles.bulletText}>• {item}</Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bütünlük ve Güvenlik</Text>
          {SECURITY_POINTS.map((item) => (
            <Text key={item} style={styles.bulletText}>• {item}</Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>İletişim</Text>
          <Text style={styles.cardSub}>
            Gizlilik sorularınız için bize yazabilirsiniz.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => Linking.openURL("mailto:support@antislot.app")}
          >
            <Text style={styles.secondaryButtonText}>support@antislot.app</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  content: { padding: 24, paddingBottom: 40 },
  backBtn: { alignSelf: "flex-start", marginBottom: 10 },
  backText: { fontSize: 16, color: "#1D4C72" },
  title: { fontSize: 28, fontWeight: "900", color: "#1D4C72", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 18, lineHeight: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1D4C72", marginBottom: 8 },
  cardSub: { fontSize: 13, color: "#555", marginBottom: 8 },
  bulletText: { fontSize: 13, color: "#444", marginBottom: 6, lineHeight: 18 },
  secondaryButton: {
    backgroundColor: "#E8F0F8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  secondaryButtonText: { color: "#1D4C72", fontWeight: "700" },
});
