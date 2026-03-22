import { Fonts, Radius } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getSupportTopic } from "@/data/supportTopics";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { router, useLocalSearchParams, type Href } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_COPY = {
  tr: {
    notFoundTitle: "Konu bulunamadi",
    notFoundSubtitle: "Bu konuya erisilemiyor.",
    quickActions: "Hizli Eylemler",
    linkErrorTitle: "Hata",
    linkErrorBody: "Baglanti acilamadi.",
  },
  en: {
    notFoundTitle: "Topic not found",
    notFoundSubtitle: "This topic cannot be accessed.",
    quickActions: "Quick Actions",
    linkErrorTitle: "Error",
    linkErrorBody: "Could not open link.",
  },
} as const;

type LocalizedTopicViewModel = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  background: string;
  tags: string[];
  sections: {
    title: string;
    body: string;
    bullets: string[];
  }[];
  actions: {
    label: string;
    route?: Href;
    externalUrl?: string;
  }[];
};

const EMPTY_TOPIC_BUNDLE: { tr: LocalizedTopicViewModel | null; en: LocalizedTopicViewModel | null } = {
  tr: null,
  en: null,
};

export default function SupportTopicDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { t } = useLanguage();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(SCREEN_COPY);

  const topic = getSupportTopic(rawId);
  const localizedTopicBundle = useMemo(() => {
    if (!topic) return EMPTY_TOPIC_BUNDLE;

    const buildFor = (lang: "tr" | "en"): LocalizedTopicViewModel => ({
      id: topic.id,
      title: topic.title[lang],
      subtitle: topic.subtitle[lang],
      emoji: topic.emoji,
      accent: topic.accent,
      background: topic.background,
      tags: topic.tags.map((tag) => tag[lang]),
      sections: topic.sections.map((section) => ({
        title: section.title[lang],
        body: section.body[lang],
        bullets: section.bullets?.map((item) => item[lang]) ?? [],
      })),
      actions:
        topic.actions?.map((action) => ({
          label: action.label[lang],
          route: action.route,
          externalUrl: action.externalUrl,
        })) ?? [],
    });

    return {
      tr: buildFor("tr"),
      en: buildFor("en"),
    };
  }, [topic]);
  const localizedTopic = useLocalizedCopy(localizedTopicBundle);

  const openExternal = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(copy.linkErrorTitle, copy.linkErrorBody);
    }
  };

  if (!localizedTopic) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{copy.notFoundTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{copy.notFoundSubtitle}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
        </TouchableOpacity>

        <View style={[styles.heroCard, { backgroundColor: localizedTopic.background, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${localizedTopic.accent}22` }]}>
            <Text style={[styles.heroEmoji, { color: localizedTopic.accent }]}>{localizedTopic.emoji}</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{localizedTopic.title}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{localizedTopic.subtitle}</Text>
          <View style={styles.tagRow}>
            {localizedTopic.tags.map((tag) => (
              <View key={`${localizedTopic.id}-${tag}`} style={[styles.tag, { borderColor: `${localizedTopic.accent}55` }]}>
                <Text style={[styles.tagText, { color: localizedTopic.accent }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {localizedTopic.sections.map((section) => (
          <View key={`${localizedTopic.id}-${section.title}`} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{section.body}</Text>
            {section.bullets.length > 0 ? (
              <View style={styles.bulletList}>
                {section.bullets.map((item) => (
                  <Text key={`${section.title}-${item}`} style={[styles.bulletItem, { color: colors.textSecondary }]}>{`• ${item}`}</Text>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {localizedTopic.actions.length > 0 ? (
          <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.quickActions}</Text>
            <View style={styles.actionRow}>
              {localizedTopic.actions.map((action) => (
                <TouchableOpacity
                  key={`${localizedTopic.id}-${action.label}`}
                  style={[styles.actionButton, { backgroundColor: localizedTopic.accent }]}
                  onPress={() => {
                    if (action.route) {
                      router.push(action.route);
                      return;
                    }
                    if (action.externalUrl) {
                      void openExternal(action.externalUrl);
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
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  backBtn: { alignSelf: "flex-start", marginBottom: 12 },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 24, fontFamily: Fonts.display, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: Fonts.body },
  heroCard: {
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroEmoji: { fontSize: 20, fontFamily: Fonts.displayMedium },
  heroTitle: { fontSize: 22, fontFamily: Fonts.displayMedium, marginBottom: 6 },
  heroSubtitle: { fontSize: 14, marginBottom: 12, fontFamily: Fonts.body },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  tagText: { fontSize: 11, fontFamily: Fonts.bodySemiBold },
  sectionCard: {
    borderRadius: Radius.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bodySemiBold, marginBottom: 8 },
  sectionBody: { fontSize: 14, marginBottom: 10, lineHeight: 20, fontFamily: Fonts.body },
  bulletList: { gap: 6 },
  bulletItem: { fontSize: 13, fontFamily: Fonts.body },
  actionsCard: {
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
  },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
  },
  actionText: { color: "#FFFFFF", fontFamily: Fonts.bodySemiBold, fontSize: 13 },
});
