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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { haptics } from "@/services/haptics";
import { SUPPORT_TOPICS, type SupportTopic } from "../data/supportTopics";

const FOCUS_INNER_TAGS = ["dürtü", "farkındalık", "günlük", "yazı"];

type FocusFilter = "all" | "inner" | "outer";

function getFocusFor(topic: SupportTopic): "inner" | "outer" {
  // Inner focus = self-reflection topics; everything else is outer (planning/financial/support).
  const inner = topic.tags.some((t) => FOCUS_INNER_TAGS.includes(t));
  return inner ? "inner" : "outer";
}

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<FocusFilter>("all");

  const enriched = useMemo(
    () =>
      SUPPORT_TOPICS.map((topic) => ({
        ...topic,
        focus: getFocusFor(topic),
      })),
    []
  );

  const filteredTopics = useMemo(() => {
    let list = enriched;
    if (focus !== "all") {
      list = list.filter((t) => t.focus === focus);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((topic) =>
        [topic.title, topic.subtitle, ...topic.tags].join(" ").toLowerCase().includes(q)
      );
    }
    return list;
  }, [enriched, query, focus]);

  const featured = useMemo(() => enriched.slice(0, 3), [enriched]);
  const resumeTopic = featured[0];

  const innerCount = useMemo(
    () => enriched.filter((t) => t.focus === "inner").length,
    [enriched]
  );
  const outerCount = useMemo(
    () => enriched.filter((t) => t.focus === "outer").length,
    [enriched]
  );

  const handleOpenTopic = (topic: SupportTopic) => {
    haptics.tapLight();
    router.push(topic.route);
  };

  const handleSelectFocus = (next: FocusFilter) => {
    haptics.selection();
    setFocus(next);
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
              Keşfet
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Modülleri keşfet, etkileşim kur.
            </Text>
          </View>

          {/* Stats row */}
          <Card style={styles.statsCard} padding={0}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>{enriched.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Modül</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {innerCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>İç Keşif</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {outerCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Dış Keşif</Text>
              </View>
            </View>
          </Card>

          {/* Resume */}
          {resumeTopic ? (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleOpenTopic(resumeTopic)}
              accessibilityRole="button"
              accessibilityLabel={`Kaldığın yerden devam et: ${resumeTopic.title}`}
            >
              <Card style={styles.resumeCard}>
                <View
                  style={[styles.resumeIconWrap, { backgroundColor: `${colors.primary}1A` }]}
                >
                  <Ionicons name="play" size={20} color={colors.primary} />
                </View>
                <View style={styles.resumeText}>
                  <Text style={[styles.resumeLabel, { color: colors.textMuted }]}>
                    KALDIĞIN YERDEN DEVAM ET
                  </Text>
                  <Text style={[styles.resumeTitle, { color: colors.text }]} numberOfLines={1}>
                    {resumeTopic.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Card>
            </TouchableOpacity>
          ) : null}

          {/* Featured horizontal scroll */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              ÖNE ÇIKANLAR
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featured.map((topic) => (
              <TouchableOpacity
                key={`featured-${topic.id}`}
                activeOpacity={0.88}
                onPress={() => handleOpenTopic(topic)}
                style={[
                  styles.featuredCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${topic.title}: ${topic.subtitle}`}
              >
                <View
                  style={[
                    styles.featuredIcon,
                    { backgroundColor: `${topic.accent}1A` },
                  ]}
                >
                  <Text style={styles.featuredEmoji}>{topic.emoji}</Text>
                </View>
                <Text
                  style={[styles.featuredTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {topic.title}
                </Text>
                <Text
                  style={[styles.featuredSubtitle, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {topic.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Quick start filter */}
          <View style={styles.quickHeader}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.quickHeaderText, { color: colors.text }]}>Hızlı Başlat</Text>
          </View>
          <View
            style={[
              styles.segmented,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            {(
              [
                { key: "all", label: "Tümü", icon: "apps" as const },
                { key: "inner", label: "İç Keşif", icon: "person" as const },
                { key: "outer", label: "Dış Keşif", icon: "people" as const },
              ] as const
            ).map((seg) => {
              const isActive = focus === seg.key;
              return (
                <TouchableOpacity
                  key={seg.key}
                  style={[
                    styles.segmentBtn,
                    isActive && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleSelectFocus(seg.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={seg.label}
                >
                  <Ionicons
                    name={seg.icon}
                    size={13}
                    color={isActive ? "#FFFFFF" : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      { color: isActive ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {seg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search */}
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Konu ara (ör. dürtü, kriz, finans)"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              accessibilityLabel="Konu araması"
            />
            {query.length > 0 ? (
              <TouchableOpacity
                onPress={() => setQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Aramayı temizle"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Module grid */}
          {filteredTopics.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyState}>
                <Ionicons name="search" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Sonuç bulunamadı
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  Farklı bir arama terimi deneyin.
                </Text>
                {focus !== "all" ? (
                  <Button
                    title="Filtreyi sıfırla"
                    onPress={() => handleSelectFocus("all")}
                    variant="secondary"
                    leftIcon="refresh"
                  />
                ) : null}
              </View>
            </Card>
          ) : (
            <View style={styles.moduleGrid}>
              {filteredTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  activeOpacity={0.88}
                  style={[
                    styles.moduleCard,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                  onPress={() => handleOpenTopic(topic)}
                  accessibilityRole="button"
                  accessibilityLabel={`${topic.title}: ${topic.subtitle}`}
                >
                  <View
                    style={[
                      styles.moduleIcon,
                      { backgroundColor: `${topic.accent}1A` },
                    ]}
                  >
                    <Text style={styles.moduleEmoji}>{topic.emoji}</Text>
                  </View>
                  <Text
                    style={[styles.moduleTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {topic.title}
                  </Text>
                  <Text
                    style={[styles.moduleSubtitle, { color: colors.textMuted }]}
                    numberOfLines={2}
                  >
                    {topic.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 120 },
  header: { marginBottom: 14 },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 4, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, lineHeight: 20 },

  statsCard: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 32,
  },

  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  resumeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeText: { flex: 1, minWidth: 0 },
  resumeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  resumeTitle: { fontSize: 16, fontWeight: "800" },

  sectionRow: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  featuredScroll: {
    paddingRight: 22,
    gap: 12,
    marginBottom: 18,
  },
  featuredCard: {
    width: 200,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginRight: 12,
  },
  featuredIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featuredEmoji: { fontSize: 22 },
  featuredTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  featuredSubtitle: { fontSize: 12, lineHeight: 17 },

  quickHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  quickHeaderText: {
    fontSize: 14,
    fontWeight: "800",
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentText: { fontSize: 12, fontWeight: "700" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },

  emptyCard: { marginBottom: 14 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyHint: { fontSize: 13, textAlign: "center", marginBottom: 8 },

  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  moduleCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  moduleEmoji: { fontSize: 22 },
  moduleTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  moduleSubtitle: { fontSize: 11, lineHeight: 15 },
});
