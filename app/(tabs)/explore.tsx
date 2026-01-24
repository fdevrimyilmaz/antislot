import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUPPORT_TOPICS } from "../data/supportTopics";

// Explore tab includes quick access to settings.

export default function ExploreScreen() {
  const [query, setQuery] = useState("");

  const filteredTopics = useMemo(() => {
    if (!query.trim()) return SUPPORT_TOPICS;
    const q = query.toLowerCase();
    return SUPPORT_TOPICS.filter((topic) => {
      const haystack = [topic.title, topic.subtitle, ...topic.tags].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Destek Konuları</Text>
        <Text style={styles.subtitle}>Kısa, pratik ve uygulanabilir destek içerikleri.</Text>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Konu ara (ör. dürtü, kriz, destek)"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, styles.actionPrimary]} onPress={() => router.push("/sos")}>
            <Text style={styles.actionPrimaryText}>SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={() => router.push("/support")}
          >
            <Text style={styles.actionSecondaryText}>Destek Ağı</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={() => router.push("/diary")}
          >
            <Text style={styles.actionSecondaryText}>Günlük</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.actionSecondaryText}>Ayarlar</Text>
          </TouchableOpacity>
        </View>

        {filteredTopics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[styles.topicCard, { backgroundColor: topic.background }]}
            activeOpacity={0.85}
            onPress={() => router.push(topic.route)}
          >
            <View style={styles.topicHeader}>
              <View style={[styles.topicIcon, { backgroundColor: `${topic.accent}22` }]}>
                <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              </View>
              <View style={styles.topicInfo}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
              </View>
            </View>
            <View style={styles.tagRow}>
              {topic.tags.map((tag) => (
                <View key={`${topic.id}-${tag}`} style={[styles.tag, { borderColor: `${topic.accent}44` }]}>
                  <Text style={[styles.tagText, { color: topic.accent }]}>{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.topicAction, { color: topic.accent }]}>Detayları Gör →</Text>
          </TouchableOpacity>
        ))}

        {filteredTopics.length === 0 && (
          <Text style={styles.emptyText}>Aradığınız konuda içerik bulunamadı.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9FF" },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "900", color: "#222", marginBottom: 6 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 16, lineHeight: 22 },
  searchBox: { marginBottom: 16 },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  actionButton: {
    flexGrow: 1,
    minWidth: "45%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionPrimary: { backgroundColor: "#1D4C72" },
  actionPrimaryText: { color: "#FFFFFF", fontWeight: "700" },
  actionSecondary: { backgroundColor: "#E8F0F8" },
  actionSecondaryText: { color: "#1D4C72", fontWeight: "700" },
  topicCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  topicHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  topicEmoji: { fontSize: 22 },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: 16, fontWeight: "800", color: "#222", marginBottom: 2 },
  topicSubtitle: { fontSize: 13, color: "#555" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  tagText: { fontSize: 11, fontWeight: "600" },
  topicAction: { fontSize: 13, fontWeight: "700" },
  emptyText: { fontSize: 14, color: "#888", marginTop: 6 },
});
