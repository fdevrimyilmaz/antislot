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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { haptics } from "@/services/haptics";
import { getSupportTopic } from "../data/supportTopics";

export default function SupportTopicDetail() {
  const params = useLocalSearchParams<{ id?: string }>();
  const topic = getSupportTopic(params.id);
  const { colors } = useTheme();

  if (!topic) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <ThemeTexture
          primary={colors.primary}
          secondary={colors.secondary}
          accent={colors.accent}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>

            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
                Konu bulunamadı
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Bu konuya erişilemiyor.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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

          <Card variant="hero" style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroEmoji}>{topic.emoji}</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              {topic.title}
            </Text>
            <Text style={styles.heroSubtitle}>{topic.subtitle}</Text>
            {topic.tags.length > 0 ? (
              <View style={styles.tagRow}>
                {topic.tags.map((tag) => (
                  <View
                    key={`${topic.id}-${tag}`}
                    style={[styles.tag, { backgroundColor: "rgba(255,255,255,0.18)" }]}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>

          {topic.sections.map((section) => (
            <Card key={section.title} style={styles.cardSpacing}>
              <SectionHeader title={section.title} icon="book" />
              <Text style={[styles.sectionBody, { color: colors.text }]}>
                {section.body}
              </Text>
              {section.bullets ? (
                <View style={styles.bulletList}>
                  {section.bullets.map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.bulletText, { color: colors.text }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ))}

          {topic.actions && topic.actions.length > 0 ? (
            <Card style={styles.cardSpacing}>
              <SectionHeader title="Hızlı Eylemler" icon="flash" />
              <View style={styles.actionRow}>
                {topic.actions.map((action) => (
                  <Button
                    key={`${topic.id}-${action.label}`}
                    title={action.label}
                    onPress={() => {
                      haptics.tapLight();
                      if (action.route) {
                        router.push(action.route as never);
                        return;
                      }
                      if (action.externalUrl) {
                        Linking.openURL(action.externalUrl);
                      }
                    }}
                    variant="primary"
                    style={styles.actionBtn}
                  />
                ))}
              </View>
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
    marginBottom: 12,
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  heroCard: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroEmoji: { fontSize: 28 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 6 },
  heroSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 12 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  cardSpacing: { marginBottom: 14 },
  sectionBody: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  bulletList: { gap: 8, marginTop: 4 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletText: { fontSize: 13, lineHeight: 18, flex: 1 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: { flexGrow: 1, flexBasis: "45%" },
});
