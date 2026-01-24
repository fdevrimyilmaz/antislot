import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupportTopic } from "../data/supportTopics";

export default function SupportTopicDetail() {
  const params = useLocalSearchParams<{ id?: string }>();
  const topic = getSupportTopic(params.id);

  if (!topic) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Konu bulunamadı</Text>
          <Text style={styles.subtitle}>Bu konuya erişilemiyor.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <View style={[styles.heroCard, { backgroundColor: topic.background }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${topic.accent}22` }]}>
            <Text style={styles.heroEmoji}>{topic.emoji}</Text>
          </View>
          <Text style={styles.heroTitle}>{topic.title}</Text>
          <Text style={styles.heroSubtitle}>{topic.subtitle}</Text>
          <View style={styles.tagRow}>
            {topic.tags.map((tag) => (
              <View key={`${topic.id}-${tag}`} style={[styles.tag, { borderColor: `${topic.accent}55` }]}>
                <Text style={[styles.tagText, { color: topic.accent }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {topic.sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
            {section.bullets ? (
              <View style={styles.bulletList}>
                {section.bullets.map((item) => (
                  <Text key={item} style={styles.bulletItem}>• {item}</Text>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {topic.actions && topic.actions.length > 0 ? (
          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Hızlı Eylemler</Text>
            <View style={styles.actionRow}>
              {topic.actions.map((action) => (
                <TouchableOpacity
                  key={`${topic.id}-${action.label}`}
                  style={styles.actionButton}
                  onPress={() => {
                    if (action.route) {
                      router.push(action.route);
                      return;
                    }
                    if (action.externalUrl) {
                      Linking.openURL(action.externalUrl);
                    }
                  }}
                >
                  <Text style={styles.actionText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  content: { padding: 24, paddingBottom: 40 },
  backBtn: { alignSelf: "flex-start", marginBottom: 12 },
  backText: { fontSize: 16, color: "#1D4C72" },
  title: { fontSize: 24, fontWeight: "900", color: "#222", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#666" },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroEmoji: { fontSize: 28 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#222", marginBottom: 6 },
  heroSubtitle: { fontSize: 14, color: "#555", marginBottom: 12 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  tagText: { fontSize: 11, fontWeight: "600" },
  sectionCard: {
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
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1D4C72", marginBottom: 8 },
  sectionBody: { fontSize: 14, color: "#555", marginBottom: 10, lineHeight: 20 },
  bulletList: { gap: 6 },
  bulletItem: { fontSize: 13, color: "#444" },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionButton: {
    backgroundColor: "#1D4C72",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
});
