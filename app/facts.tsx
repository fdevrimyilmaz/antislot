import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenHero } from "@/components/ui/screen-hero";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { GAMBLING_FACTS } from "@/data/gamblingFacts";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { fetchRealityFeed, type RealityFeedApiItem } from "@/services/exploreApi";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FactsTab = "facts" | "news";

type NewsCard = {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  url: string;
  tags: string[];
  impact: "high" | "moderate";
};

const EN_GAMBLING_FACTS = [
  "A bonus is designed to keep you betting, not to make you profitable.",
  "RTP is a long-term average, not a promise for your session.",
  "Chasing losses usually increases both debt and emotional stress.",
  "Small wins are often used to keep you in the loop.",
  "If a game is built for the house edge, the math is not on your side.",
  "Near-miss design can make losses feel like progress.",
  "Playing alone often removes the social brakes that would stop you.",
  "VIP rewards usually mean higher exposure, not safer play.",
  "A recovery bet after a loss is still a risk bet.",
  "Long sessions can distort your sense of time and spending.",
  "Promotions are marketing tools, not recovery tools.",
  "Fast repeats increase impulsive decisions.",
  "When emotion leads the session, risk decisions get worse.",
  "A short break can reduce urge intensity more than one more spin.",
  "You cannot control random outcomes with rituals or patterns.",
  "Losses can be hidden by reward language and bright UI cues.",
  "Higher stakes do not fix previous losses; they magnify risk.",
  "Probability does not owe you a win after a losing streak.",
  "Compulsion feels urgent, but urgency is not evidence.",
  "Any product that depends on repeated bets depends on repeated losses.",
  "Stopping early protects both money and cognitive control.",
  "A gambling app can be optimized for retention, not wellbeing.",
  "If your plan is to recover losses, the plan is already fragile.",
  "Debt-funded gambling turns short-term urge into long-term damage.",
  "The house edge compounds over time.",
  "Feeling close to winning is not the same as being likely to win.",
  "Escalation after losses is a known risk pattern, not a strategy.",
  "Gambling can trade short dopamine spikes for long stress cycles.",
  "The safest money in gambling is the money not placed.",
  "Support and pause tools outperform impulse in high-risk moments.",
] as const;

const FACTS_LIST_COPY = {
  tr: GAMBLING_FACTS,
  en: EN_GAMBLING_FACTS,
} as const;

function parseFeedDate(value: string): number {
  const normalized = /^\d{4}$/.test(value) ? `${value}-01-01` : value;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function mapNewsItem(item: RealityFeedApiItem): NewsCard {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    source: item.source,
    date: item.date,
    url: item.url,
    tags: item.tags,
    impact: item.impact,
  };
}

export default function FactsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { t, language, locale } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";
  const facts = useLocalizedCopy(FACTS_LIST_COPY);

  const [selectedTab, setSelectedTab] = useState<FactsTab>("facts");
  const [newsCards, setNewsCards] = useState<NewsCard[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsSourceMode, setNewsSourceMode] = useState<"live" | "fallback" | "local">("local");
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<number | null>(null);

  const sortedNews = useMemo(
    () => [...newsCards].sort((a, b) => parseFeedDate(b.date) - parseFeedDate(a.date)),
    [newsCards]
  );

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const payload = await fetchRealityFeed();
      const mapped = payload.items.map(mapNewsItem);
      setNewsCards(mapped);
      setNewsSourceMode(payload.source);
      setNewsUpdatedAt(payload.generatedAt);
      setNewsError(null);
    } catch {
      setNewsError(
        isTr
          ? "Canli haber akisina su an ulasilamiyor. Ag ve API baglantisini kontrol et."
          : "Live news feed is currently unavailable. Check network and API connectivity."
      );
      setNewsSourceMode("local");
      setNewsUpdatedAt(Date.now());
    } finally {
      setNewsLoading(false);
    }
  }, [isTr]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const openSource = useCallback(
    async (url: string) => {
      try {
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          Alert.alert(isTr ? "Link acilamadi" : "Cannot open link", url);
          return;
        }
        await Linking.openURL(url);
      } catch {
        Alert.alert(
          isTr ? "Hata" : "Error",
          isTr ? "Kaynak acilirken hata olustu." : "An error occurred while opening source."
        );
      }
    },
    [isTr]
  );

  const formatNewsDate = useCallback(
    (value: string) => {
      const parsed = parseFeedDate(value);
      if (!parsed) return value;
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(parsed);
    },
    [locale]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{`<- ${t.back}`}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t.factsScreenTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.factsScreenSubtitle}</Text>
      </View>

      <ScreenHero
        icon="eye-outline"
        title={t.factsScreenTitle}
        subtitle={t.factsScreenSubtitle}
        description={
          isTr
            ? "Kumar gerceklerini ve canli dis dunya haberlerini ayni panelde takip et."
            : "Track gambling facts and live external news from one panel."
        }
        badge={selectedTab === "facts" ? `${facts.length}` : `${sortedNews.length}`}
        gradient={["#6E4918", "#A8711F"]}
        style={styles.hero}
      />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabChip,
            selectedTab === "facts"
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => setSelectedTab("facts")}
        >
          <Text style={[styles.tabText, { color: selectedTab === "facts" ? "#FFFFFF" : colors.textSecondary }]}>
            {isTr ? "Gercek kartlari" : "Fact cards"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabChip,
            selectedTab === "news"
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => setSelectedTab("news")}
        >
          <Text style={[styles.tabText, { color: selectedTab === "news" ? "#FFFFFF" : colors.textSecondary }]}>
            {isTr ? "Canli haberler" : "Live news"}
          </Text>
        </TouchableOpacity>

        {selectedTab === "news" ? (
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              void loadNews();
            }}
            disabled={newsLoading}
          >
            <Text style={[styles.refreshText, { color: colors.primary }]}>
              {newsLoading ? (isTr ? "Yukleniyor..." : "Loading...") : isTr ? "Yenile" : "Refresh"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {selectedTab === "facts" ? (
        <FlatList
          data={facts}
          keyExtractor={(_, index) => `fact-full-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={screenWidth}
          snapToAlignment="start"
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={[styles.page, { width: screenWidth }]}> 
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={styles.factHeader}>
                  <Text style={[styles.factIndex, { color: colors.primary }]}>{`#${index + 1}`}</Text>
                  <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.cardText, { color: colors.text }]}>{item}</Text>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={sortedNews}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.newsList}
          ListHeaderComponent={
            <View style={[styles.newsMeta, { borderColor: colors.border, backgroundColor: colors.card }]}> 
              <Text style={[styles.newsMetaText, { color: colors.textSecondary }]}> 
                {isTr
                  ? `Kaynak modu: ${newsSourceMode === "live" ? "Canli" : newsSourceMode === "fallback" ? "Yedek" : "Yerel"}`
                  : `Source mode: ${newsSourceMode === "live" ? "Live" : newsSourceMode === "fallback" ? "Fallback" : "Local"}`}
              </Text>
              {newsUpdatedAt ? (
                <Text style={[styles.newsMetaText, { color: colors.textSecondary }]}> 
                  {isTr ? "Guncellendi" : "Updated"}: {new Intl.DateTimeFormat(locale, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(newsUpdatedAt)}
                </Text>
              ) : null}
              {newsError ? <Text style={[styles.newsError, { color: colors.warning ?? colors.primary }]}>{newsError}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            newsLoading ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{isTr ? "Haberler yukleniyor..." : "Loading news..."}</Text>
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{isTr ? "Haber bulunamadi" : "No news found"}</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}> 
                  {isTr
                    ? "Agi kontrol edip tekrar yenile." 
                    : "Check connectivity and refresh again."}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.newsHead}>
                <View
                  style={[
                    styles.impactBadge,
                    {
                      backgroundColor: colors.background,
                      borderColor: item.impact === "high" ? colors.warning ?? colors.primary : colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.impactBadgeText,
                      {
                        color: item.impact === "high" ? colors.warning ?? colors.primary : colors.primary,
                      },
                    ]}
                  >
                    {item.impact === "high" ? (isTr ? "Yuksek etki" : "High impact") : isTr ? "Orta etki" : "Moderate"}
                  </Text>
                </View>
                <Text style={[styles.newsDate, { color: colors.textSecondary }]}>{formatNewsDate(item.date)}</Text>
              </View>

              <Text style={[styles.newsTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.newsSummary, { color: colors.textSecondary }]}>{item.summary}</Text>
              <Text style={[styles.newsSource, { color: colors.textSecondary }]}>{item.source}</Text>

              <View style={styles.tagRow}>
                {item.tags.slice(0, 4).map((tag) => (
                  <View key={`${item.id}-${tag}`} style={[styles.tagChip, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.openBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => {
                  void openSource(item.url);
                }}
              >
                <Text style={[styles.openBtnText, { color: colors.primary }]}>{isTr ? "Kaynagi ac" : "Open source"}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: 8, paddingBottom: 12 },
  hero: { marginHorizontal: Spacing.xl, marginBottom: Spacing.base },
  backBtn: { alignSelf: "flex-start", marginBottom: 8 },
  backText: { fontSize: 16, fontFamily: Fonts.bodyMedium },
  title: { fontSize: 28, fontFamily: Fonts.display, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: Fonts.body },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.base,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tabChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: "auto",
  },
  refreshText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  list: { paddingBottom: Spacing.xl },
  page: { alignItems: "center", justifyContent: "center" },
  card: {
    width: "100%",
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    minHeight: 170,
    justifyContent: "center",
    borderWidth: 1,
  },
  factHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  factIndex: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.bodySemiBold,
  },
  newsList: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.base,
  },
  newsMeta: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
  },
  newsMetaText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.body,
  },
  newsError: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.bodyMedium,
  },
  newsCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: 8,
  },
  newsHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  impactBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  impactBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
  },
  newsDate: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  newsTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  newsSummary: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
    marginBottom: 8,
  },
  newsSource: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    fontFamily: Fonts.body,
  },
  openBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  openBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
  },
  emptyTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});
