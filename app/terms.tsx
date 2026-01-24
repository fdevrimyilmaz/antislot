import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TERMS_POINTS = [
  "Uygulama profesyonel tıbbi/psikolojik hizmet yerine geçmez.",
  "Kumar engelleme %100 garanti edilemez (DoH ve uygulama içi tarayıcı sınırlamaları).",
  "VPN/Network Extension kullanıcı onayıyla etkinleştirilir.",
  "Kullanıcı, kendi kararlarından ve davranışlarından sorumludur.",
];

export default function TermsOfService() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Kullanım Şartları</Text>
        <Text style={styles.subtitle}>
          AntiSlot, destekleyici araçlar sunar. Bu şartlar uygulama kullanımını açıklar.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Temel Koşullar</Text>
          {TERMS_POINTS.map((item) => (
            <Text key={item} style={styles.bulletText}>• {item}</Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sorumluluk Reddi</Text>
          <Text style={styles.cardText}>
            Uygulama içinde sağlanan öneriler, bilgi amaçlıdır. Acil bir durumda lütfen
            yerel acil yardım hatlarıyla iletişime geçin.
          </Text>
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
  cardText: { fontSize: 13, color: "#555", lineHeight: 18 },
  bulletText: { fontSize: 13, color: "#444", marginBottom: 6, lineHeight: 18 },
});
