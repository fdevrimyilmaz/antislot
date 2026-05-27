import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/contexts/ThemeContext";
import { haptics } from "@/services/haptics";
import { SUPPORT_TOPICS, type SupportTopic } from "../data/supportTopics";
import {
  CalmBackground,
  CalmHeader,
  GlassCard,
  Space,
  Type,
} from "@/components/calm";

/**
 * Explore (Keşfet) — calm progressive-disclosure design.
 *
 * Before: a search bar, three filter chips, a featured shortcut card, AND
 * the full topic list — all visible at once. Decision fatigue magnet.
 *
 * Now: three curated recommendations rendered as tall, breathing cards.
 * If the user wants more, they tap "Tüm konulara bak" to reveal the rest.
 * No search bar by default (it shows when expanded). No filter chips.
 * No featured shortcut card. The bottom-tabs nav already exposes Modules
 * directly, so a redundant in-screen shortcut is just noise.
 *
 * The order of `SUPPORT_TOPICS` is the curation — the first three are the
 * highest-leverage starting points for someone in early recovery.
 */
export default function ExploreScreen() {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const top3 = useMemo(() => SUPPORT_TOPICS.slice(0, 3), []);
  const rest = useMemo(() => SUPPORT_TOPICS.slice(3), []);

  const handleOpen = (topic: SupportTopic) => {
    haptics.tapLight();
    router.push(topic.route);
  };

  const toggleExpanded = () => {
    haptics.selection();
    setExpanded((v) => !v);
  };

  return (
    <CalmBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <CalmHeader
            eyebrow="KEŞFET"
            title="Şu an sana ne iyi gelir?"
            subtitle="Üç başlangıç noktası — en faydalısından başla."
          />

          <View style={styles.topList}>
            {top3.map((topic, index) => (
              <FeaturedTopicCard
                key={topic.id}
                topic={topic}
                index={index + 1}
                onPress={() => handleOpen(topic)}
              />
            ))}
          </View>

          {/* Progressive disclosure — full list hidden until requested. */}
          <Pressable
            onPress={toggleExpanded}
            style={({ pressed }) => [
              styles.toggleRow,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            <Text style={[Type.subtitle, styles.toggleText, { color: colors.text }]}>
              {expanded
                ? "Daha az göster"
                : `Tüm konulara bak (${rest.length})`}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>

          {expanded ? (
            <View style={styles.restList}>
              {rest.map((topic) => (
                <QuietTopicRow
                  key={topic.id}
                  topic={topic}
                  onPress={() => handleOpen(topic)}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </CalmBackground>
  );
}

function FeaturedTopicCard({
  topic,
  index,
  onPress,
}: {
  topic: SupportTopic;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.99 : 1 }],
        opacity: pressed ? 0.96 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={`${topic.title} — ${topic.subtitle}`}
    >
      <GlassCard>
        <View style={styles.featuredHead}>
          <Text style={[Type.caption, { color: colors.textMuted }]}>
            {String(index).padStart(2, "0")} · ÖNERİLEN
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </View>
        <View style={styles.featuredBody}>
          <Text style={styles.featuredEmoji}>{topic.emoji}</Text>
          <View style={styles.featuredText}>
            <Text
              style={[Type.title, styles.featuredTitle, { color: colors.text }]}
            >
              {topic.title}
            </Text>
            <Text
              style={[
                Type.subtitle,
                styles.featuredSub,
                { color: colors.textMuted },
              ]}
            >
              {topic.subtitle}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function QuietTopicRow({
  topic,
  onPress,
}: {
  topic: SupportTopic;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quietRow,
        {
          borderBottomColor: `${colors.textMuted}22`,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={topic.title}
    >
      <Text style={styles.quietEmoji}>{topic.emoji}</Text>
      <View style={styles.quietText}>
        <Text style={[Type.subtitle, { color: colors.text, fontWeight: "600" }]}>
          {topic.title}
        </Text>
        <Text
          style={[styles.quietSub, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {topic.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Space.lg + 4,
    paddingTop: Space.lg,
    paddingBottom: 120,
    gap: Space.lg,
  },

  topList: { gap: Space.md + 2 },

  featuredHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Space.md,
  },
  featuredBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md + 2,
  },
  featuredEmoji: { fontSize: 38 },
  featuredText: { flex: 1, minWidth: 0 },
  featuredTitle: { fontSize: 19, fontWeight: "700" },
  featuredSub: { marginTop: 4 },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Space.md + 2,
    paddingHorizontal: Space.sm,
    marginTop: Space.md,
  },
  toggleText: { fontWeight: "600" },

  restList: {
    marginTop: Space.xs,
    gap: 0,
  },
  quietRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingVertical: Space.md + 4,
    borderBottomWidth: 1,
  },
  quietEmoji: { fontSize: 24, width: 32 },
  quietText: { flex: 1, minWidth: 0 },
  quietSub: { fontSize: 13, marginTop: 2, fontWeight: "500" },
});
