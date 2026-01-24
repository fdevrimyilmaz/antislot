import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LIMITATIONS = [
  {
    title: "DNS over HTTPS (DoH)",
    body: "DoH trafiği şifreli olduğu için DNS filtresi tarafından yakalanamayabilir.",
    tips: ["Safari DoH ayarlarını kapatın", "Mümkünse standart DNS kullanın"],
  },
  {
    title: "Uygulama İçi Tarayıcılar",
    body: "Bazı uygulamalar kendi tarayıcılarını kullandığı için filtreyi aşabilir.",
    tips: ["Kritik içerikler için Safari/Chrome tercih edin"],
  },
  {
    title: "Captive Portal (Ağ Girişi)",
    body: "Halka açık WiFi giriş sayfalarında VPN geçici olarak devre dışı kalabilir.",
    tips: ["Giriş tamamlandıktan sonra VPN durumunu kontrol edin"],
  },
  {
    title: "VPN Etkinleştirme",
    body: "VPN kullanıcı onayı olmadan otomatik açılamaz.",
    tips: ["Ayarlar > VPN bölümünden manuel etkinleştirme yapın"],
  },
];

export default function Limitations() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Sınırlamalar</Text>
        <Text style={styles.subtitle}>
          Bu sınırlamalar platform seviyesindedir. Uygulama içinden açık şekilde paylaşılır.
        </Text>

        {LIMITATIONS.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText}>{item.body}</Text>
            <View style={styles.tipList}>
              {item.tips.map((tip) => (
                <Text key={tip} style={styles.bulletText}>• {tip}</Text>
              ))}
            </View>
          </View>
        ))}
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
  cardText: { fontSize: 13, color: "#555", lineHeight: 18, marginBottom: 8 },
  tipList: { gap: 6 },
  bulletText: { fontSize: 13, color: "#444" },
});
