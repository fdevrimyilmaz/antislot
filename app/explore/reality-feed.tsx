import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchRealityFeed, type RealityFeedApiItem } from "@/services/exploreApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FeedType = "news" | "court" | "story" | "law";
type FeedImpact = "high" | "moderate";
type FeedTab = "all" | "news" | "story" | "law" | "court" | "saved";
type FeedSourceMode = "live" | "fallback" | "local";

type FeedItem = {
  id: string;
  type: FeedType;
  impact: FeedImpact;
  date: string;
  source: string;
  titleTr: string;
  titleEn: string;
  summaryTr: string;
  summaryEn: string;
  tagsTr: string[];
  tagsEn: string[];
  url: string;
};

type StoredRealityFeedState = {
  bookmarkedIds?: string[];
  readIds?: string[];
  hideSensitive?: boolean;
  showUnreadOnly?: boolean;
};

const STORAGE_KEY = "@antislot/reality-feed/v2";

const FEED_ITEMS: FeedItem[] = [
  {
    id: "uk-judiciary-2026-01-13",
    type: "court",
    impact: "high",
    date: "2026-01-13",
    source: "UK Courts and Tribunals Judiciary",
    titleTr: "Koroner kaydi: kumar bozuklugu ve olum riski baglantisi",
    titleEn: "Coroner record: link between gambling disorder and fatal risk",
    summaryTr:
      "Yargi kaydinda, kumar bozuklugunun ciddi zarar riskiyle iliskisi ve onleyici rapor sureci ele aliniyor.",
    summaryEn:
      "The judiciary record addresses severe harm risk linked to gambling disorder and includes a prevention report process.",
    tagsTr: ["olum riski", "koruma", "yargi"],
    tagsEn: ["fatal risk", "protection", "judiciary"],
    url: "https://www.judiciary.uk/prevention-of-future-death-reports/oliver-long-prevention-of-future-deaths-report/",
  },
  {
    id: "doj-2025-10-09",
    type: "court",
    impact: "high",
    date: "2025-10-09",
    source: "U.S. Department of Justice",
    titleTr: "ABD resmi duyuru: yuksek tutarli zimmet ve vergi suclari",
    titleEn: "U.S. official release: major embezzlement and tax crimes",
    summaryTr:
      "Adalet Bakanligi duyurusunda, casino operasyonlarina bagli mali suclar nedeniyle uzun sureli hapis ve tazminat sureci belirtiliyor.",
    summaryEn:
      "The DOJ release describes prison sentencing and restitution in a casino-related financial crime case.",
    tagsTr: ["hapis", "mali suc", "resmi kaynak"],
    tagsEn: ["prison", "financial crime", "official source"],
    url: "https://www.justice.gov/usao-edok/pr/former-casino-accounts-payable-manager-sentenced-embezzlement-and-tax-fraud",
  },
  {
    id: "itv-2024-09-04",
    type: "story",
    impact: "moderate",
    date: "2024-09-04",
    source: "ITV News Anglia",
    titleTr: "Bakim evi yoneticisi davasi: savunmasiz kisilerden para suistimali",
    titleEn: "Care home manager case: misuse of funds from vulnerable people",
    summaryTr:
      "Haber, kumar borclariyla iliskilendirilen ve bakim evi sakinlerini hedef alan dolandiricilik davasini ozetliyor.",
    summaryEn:
      "The article summarizes a fraud case linked to gambling debt, targeting vulnerable residents in a care setting.",
    tagsTr: ["savunmasiz kisiler", "dolandiricilik", "borc"],
    tagsEn: ["vulnerable people", "fraud", "debt"],
    url: "https://www.itv.com/news/anglia/2024-09-04/gambling-care-home-boss-stole-250k-from-vulnerable-residents",
  },
  {
    id: "bbc-2024-01-01",
    type: "story",
    impact: "moderate",
    date: "2024-01-01",
    source: "BBC News",
    titleTr: "Finans yoneticisi davasi: yuksek tutarli hirsizlik ve hapis",
    titleEn: "Finance manager case: high-value theft and prison",
    summaryTr:
      "Haberde, kumar bagimliligi baglaminda isverenden buyuk tutarda para ceken bir yoneticinin hapis cezasi aldigi aktariliyor.",
    summaryEn:
      "The report describes a manager who stole a large amount from an employer in the context of gambling addiction and received a prison sentence.",
    tagsTr: ["is yeri suistimali", "hapis", "bagimlilik"],
    tagsEn: ["workplace abuse", "prison", "addiction"],
    url: "https://feeds.bbci.co.uk/news/uk-england-norfolk-67503468",
  },
  {
    id: "ukgc-white-paper-2025-03-01",
    type: "law",
    impact: "moderate",
    date: "2025-03-01",
    source: "UK Gambling Commission",
    titleTr: "Birlesik Krallik: kumar reform paketinde yeni koruma adimlari",
    titleEn: "United Kingdom: new safeguards under gambling reform package",
    summaryTr:
      "Daha guclu oyuncu korumasi, urun guvenligi ve zarar azaltma odakli duzenleme guncellemeleri yayimlandi.",
    summaryEn:
      "Regulatory updates emphasize stronger player protection, product safety checks, and harm-reduction controls.",
    tagsTr: ["yasal degisiklik", "koruma", "duzenleme"],
    tagsEn: ["legal change", "protection", "regulation"],
    url: "https://www.gamblingcommission.gov.uk/public-and-players/guide/gambling-act-review-white-paper",
  },
  {
    id: "ukgov-slot-limit-2024-09-01",
    type: "law",
    impact: "high",
    date: "2024-09-01",
    source: "UK Government",
    titleTr: "Yuksek riskli online slotlar icin limit ve guvenlik kurallari",
    titleEn: "Limits and safety rules for high-risk online slots",
    summaryTr:
      "Yeni uygulama, yuksek riskli online urunlerde harcama hizi ve zarar olasiligini azaltmaya yonelik teknik limitler getiriyor.",
    summaryEn:
      "The update introduces technical limits aimed at reducing spending speed and harm risk in high-intensity online products.",
    tagsTr: ["slot", "limit", "yasal adim"],
    tagsEn: ["slots", "limit", "legal step"],
    url: "https://www.gov.uk/government/publications/high-stakes-online-slots-stake-limit",
  },
  {
    id: "gamcare-support-story-2025-06-11",
    type: "story",
    impact: "moderate",
    date: "2025-06-11",
    source: "GamCare",
    titleTr: "Destek hikayeleri: nuks dongusunden cikista topluluk etkisi",
    titleEn: "Support stories: community effect in breaking relapse loops",
    summaryTr:
      "Destek sureci deneyimleri, kriz aninda erken yardim istemenin nuks riskini azaltmada kritik oldugunu gosteriyor.",
    summaryEn:
      "Support experiences highlight that asking for help early in crisis moments can materially reduce relapse risk.",
    tagsTr: ["hikaye", "destek", "nuks onleme"],
    tagsEn: ["story", "support", "relapse prevention"],
    url: "https://www.gamcare.org.uk/news/",
  },
  {
    id: "ncpg-awareness-2025-01-20",
    type: "news",
    impact: "moderate",
    date: "2025-01-20",
    source: "National Council on Problem Gambling",
    titleTr: "Farkindalik kampanyalari: erken mudahale ve aile etkisi",
    titleEn: "Awareness campaigns: early intervention and family impact",
    summaryTr:
      "Veriler, problemli kumar davranisinda erken mudahalenin hem finansal hem duygusal hasari belirgin bicimde azalttigini gosteriyor.",
    summaryEn:
      "Data indicates that early intervention in problematic gambling behavior lowers both financial and emotional harm.",
    tagsTr: ["farkindalik", "erken mudahale", "aile"],
    tagsEn: ["awareness", "early intervention", "family"],
    url: "https://www.ncpgambling.org/",
  },
];

const parseFeedDate = (value: string): number => {
  const normalized = /^\d{4}$/.test(value) ? `${value}-01-01` : value;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const uniqueStrings = (values: string[]) => [...new Set(values.filter(Boolean))];

const LAW_HINTS = [
  "regulat",
  "rule",
  "bill",
  "law",
  "policy",
  "ban",
  "licen",
  "legislation",
  "commission",
];

const STORY_HINTS = [
  "story",
  "survivor",
  "recovery",
  "family",
  "experience",
  "case study",
  "support",
];

const deriveFeedTypeFromApi = (item: RealityFeedApiItem): FeedType => {
  if (item.type === "court") return "court";

  const searchable = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
  if (LAW_HINTS.some((hint) => searchable.includes(hint))) return "law";
  if (STORY_HINTS.some((hint) => searchable.includes(hint))) return "story";
  return "news";
};

const mapApiItemToFeedItem = (item: RealityFeedApiItem): FeedItem => ({
  id: item.id,
  type: deriveFeedTypeFromApi(item),
  impact: item.impact,
  date: item.date,
  source: item.source,
  titleTr: item.title,
  titleEn: item.title,
  summaryTr: item.summary,
  summaryEn: item.summary,
  tagsTr: item.tags,
  tagsEn: item.tags,
  url: item.url,
});

export default function RealityFeedScreen() {
  const { t, language, locale } = useLanguage();
  const { colors } = useTheme();
  const isTr = language === "tr";

  const [selectedTab, setSelectedTab] = useState<FeedTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideSensitive, setHideSensitive] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(FEED_ITEMS);
  const [feedSourceMode, setFeedSourceMode] = useState<FeedSourceMode>("local");
  const [feedUpdatedAt, setFeedUpdatedAt] = useState<number | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [feedLoadError, setFeedLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || !mounted) return;
        const parsed = JSON.parse(raw) as StoredRealityFeedState;
        if (Array.isArray(parsed.bookmarkedIds)) {
          setBookmarkedIds(uniqueStrings(parsed.bookmarkedIds));
        }
        if (Array.isArray(parsed.readIds)) {
          setReadIds(uniqueStrings(parsed.readIds));
        }
        if (typeof parsed.hideSensitive === "boolean") {
          setHideSensitive(parsed.hideSensitive);
        }
        if (typeof parsed.showUnreadOnly === "boolean") {
          setShowUnreadOnly(parsed.showUnreadOnly);
        }
      } catch {
        if (mounted) {
          setSyncError(isTr ? "Kayitli filtre tercihleri okunamadi." : "Saved filter preferences could not be loaded.");
        }
      } finally {
        if (mounted) setHydrated(true);
      }
    };

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [isTr]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const persist = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            bookmarkedIds,
            readIds,
            hideSensitive,
            showUnreadOnly,
          } satisfies StoredRealityFeedState)
        );
        if (!cancelled) setSyncError(null);
      } catch {
        if (!cancelled) {
          setSyncError(isTr ? "Filtre tercihleri kaydedilemedi." : "Filter preferences could not be saved.");
        }
      }
    };

    void persist();
    return () => {
      cancelled = true;
    };
  }, [bookmarkedIds, hydrated, hideSensitive, isTr, readIds, showUnreadOnly]);

  const loadFeed = useCallback(
    async (manual = false, signal?: AbortSignal) => {
      if (manual) {
        setFeedRefreshing(true);
      } else {
        setFeedLoading(true);
      }

      try {
        const payload = await fetchRealityFeed({ signal });
        if (signal?.aborted) return;

        const mapped = payload.items.map(mapApiItemToFeedItem);
        if (mapped.length > 0) {
          setFeedItems(mapped);
          setFeedSourceMode(payload.source);
          setFeedUpdatedAt(payload.generatedAt);
        } else {
          setFeedItems(FEED_ITEMS);
          setFeedSourceMode("fallback");
          setFeedUpdatedAt(Date.now());
        }
        setFeedLoadError(null);
      } catch {
        if (signal?.aborted) return;
        setFeedItems(FEED_ITEMS);
        setFeedSourceMode("local");
        setFeedLoadError(
          isTr ? "Canli akisa baglanilamadi. Yerel kaynaklar gosteriliyor." : "Live feed unavailable. Showing local sources."
        );
      } finally {
        if (signal?.aborted) return;
        setFeedLoading(false);
        setFeedRefreshing(false);
      }
    },
    [isTr]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadFeed(false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadFeed]);

  useEffect(() => {
    const validIds = new Set(feedItems.map((item) => item.id));
    const keepKnown = (prev: string[]) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    };

    setBookmarkedIds(keepKnown);
    setReadIds(keepKnown);
    setRevealedIds(keepKnown);
  }, [feedItems]);

  const sortedItems = useMemo(
    () => [...feedItems].sort((a, b) => parseFeedDate(b.date) - parseFeedDate(a.date)),
    [feedItems]
  );

  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const bookmarkedSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(locale);
    return sortedItems.filter((item) => {
      if (selectedTab === "news" && item.type !== "news") return false;
      if (selectedTab === "story" && item.type !== "story") return false;
      if (selectedTab === "law" && item.type !== "law") return false;
      if (selectedTab === "court" && item.type !== "court") return false;
      if (selectedTab === "saved" && !bookmarkedSet.has(item.id)) return false;
      if (showUnreadOnly && readSet.has(item.id)) return false;
      if (!query) return true;

      const searchable = [
        item.source,
        isTr ? item.titleTr : item.titleEn,
        isTr ? item.summaryTr : item.summaryEn,
        ...(isTr ? item.tagsTr : item.tagsEn),
      ]
        .join(" ")
        .toLocaleLowerCase(locale);

      return searchable.includes(query);
    });
  }, [bookmarkedSet, isTr, locale, readSet, searchQuery, selectedTab, showUnreadOnly, sortedItems]);

  const unreadCount = Math.max(0, feedItems.length - readSet.size);
  const savedCount = bookmarkedSet.size;

  const feedInsight = useMemo(() => {
    if (unreadCount <= 0) {
      return isTr ? "Tum kayitlari gozden gecirdin. Iyi ilerleme." : "You reviewed all records. Strong progress.";
    }
    if (unreadCount <= 2) {
      return isTr
        ? "Sona yaklastin. Kalan kartlari tamamlayip dis tetikleyicilere karsi kalkan kur."
        : "You are close. Finish the remaining cards to strengthen external trigger resistance.";
    }
    return isTr
      ? `${unreadCount} kayit bekliyor. Her kart risk farkindaligini artirir.`
      : `${unreadCount} records are pending. Each card improves risk awareness.`;
  }, [isTr, unreadCount]);

  const tabOptions: { id: FeedTab; labelTr: string; labelEn: string }[] = [
    { id: "all", labelTr: "Tum akis", labelEn: "All feed" },
    { id: "news", labelTr: "Haber", labelEn: "News" },
    { id: "story", labelTr: "Hikaye", labelEn: "Stories" },
    { id: "law", labelTr: "Yasal", labelEn: "Legal" },
    { id: "court", labelTr: "Yargi", labelEn: "Court" },
    { id: "saved", labelTr: "Kaydedilen", labelEn: "Saved" },
  ];

  const getTypeBadgeLabel = (type: FeedType): string => {
    if (type === "court") return isTr ? "YARGI" : "COURT";
    if (type === "law") return isTr ? "YASAL" : "LEGAL";
    if (type === "story") return isTr ? "HIKAYE" : "STORY";
    return isTr ? "HABER" : "NEWS";
  };

  const formatDate = (value: string) => {
    const parsed = parseFeedDate(value);
    if (!parsed) return value;
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(parsed);
  };

  const toggleSaved = (id: string) => {
    setBookmarkedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [id, ...prev]));
  };

  const markRead = (id: string) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [id, ...prev]));
  };

  const resetReadState = () => {
    Alert.alert(
      isTr ? "Okundu durumunu sifirla" : "Reset read status",
      isTr ? "Tum kartlar tekrar okunmamis olarak isaretlensin mi?" : "Mark all cards as unread again?",
      [
        { text: isTr ? "Vazgec" : "Cancel", style: "cancel" },
        { text: isTr ? "Sifirla" : "Reset", style: "destructive", onPress: () => setReadIds([]) },
      ]
    );
  };

  const openSource = async (item: FeedItem) => {
    markRead(item.id);
    try {
      const supported = await Linking.canOpenURL(item.url);
      if (!supported) {
        Alert.alert(isTr ? "Link acilamadi" : "Cannot open link", item.url);
        return;
      }
      await Linking.openURL(item.url);
    } catch {
      Alert.alert(
        isTr ? "Hata" : "Error",
        isTr ? "Kaynak linki acilirken hata olustu." : "An error occurred while opening the source link."
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.exploreModules.realityFeed.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.exploreModules.realityFeed.subtitle}
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {isTr
              ? "Bu akista kumar ile ilgili haberler, gercek hikayeler ve yasal degisiklikler bir arada gosterilir. Kartlari kaydedebilir, okunma takibi yapabilir ve hassas ozetleri kontrollu acabilirsin."
              : "This feed combines gambling-related news, real stories, and legal changes. Save cards, track reads, and reveal sensitive summaries only when you are ready."}
          </Text>

          <View style={styles.heroStats}>
            <View style={[styles.heroPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.heroPillValue, { color: colors.text }]}>{feedItems.length}</Text>
              <Text style={[styles.heroPillLabel, { color: colors.textSecondary }]}>{isTr ? "Kayit" : "Records"}</Text>
            </View>
            <View style={[styles.heroPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.heroPillValue, { color: colors.text }]}>{savedCount}</Text>
              <Text style={[styles.heroPillLabel, { color: colors.textSecondary }]}>
                {isTr ? "Kaydedilen" : "Saved"}
              </Text>
            </View>
            <View style={[styles.heroPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.heroPillValue, { color: colors.text }]}>{unreadCount}</Text>
              <Text style={[styles.heroPillLabel, { color: colors.textSecondary }]}>
                {isTr ? "Bekleyen" : "Unread"}
              </Text>
            </View>
          </View>

          <Text style={[styles.heroInsight, { color: colors.textSecondary }]}>{feedInsight}</Text>
          <Text style={[styles.feedMeta, { color: colors.textSecondary }]}>
            {isTr
              ? `Kaynak modu: ${
                  feedSourceMode === "live" ? "Canli" : feedSourceMode === "fallback" ? "Yedek" : "Yerel"
                }`
              : `Source mode: ${
                  feedSourceMode === "live" ? "Live" : feedSourceMode === "fallback" ? "Fallback" : "Local"
                }`}
            {feedUpdatedAt
              ? ` | ${isTr ? "Guncelleme" : "Updated"}: ${new Intl.DateTimeFormat(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                }).format(feedUpdatedAt)}`
              : ""}
          </Text>
        </View>

        <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.refreshRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => {
                void loadFeed(true);
              }}
              disabled={feedLoading || feedRefreshing}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                {feedLoading || feedRefreshing
                  ? isTr
                    ? "Yukleniyor..."
                    : "Loading..."
                  : isTr
                    ? "Canli akisi yenile"
                    : "Refresh live feed"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            {tabOptions.map((tab) => {
              const active = selectedTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabChip,
                    active
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedTab(tab.id)}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.tabChipText, { color: active ? "#FFFFFF" : colors.textSecondary }]}>
                    {isTr ? tab.labelTr : tab.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={isTr ? "Kaynak, baslik veya etiket ara" : "Search source, title, or tag"}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.searchInput,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          />

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleChip,
                hideSensitive
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => setHideSensitive((prev) => !prev)}
            >
              <Text style={[styles.toggleText, { color: hideSensitive ? "#FFFFFF" : colors.textSecondary }]}>
                {isTr ? "Hassas ozetleri gizle" : "Hide sensitive summaries"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleChip,
                showUnreadOnly
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => setShowUnreadOnly((prev) => !prev)}
            >
              <Text style={[styles.toggleText, { color: showUnreadOnly ? "#FFFFFF" : colors.textSecondary }]}>
                {isTr ? "Sadece okunmayanlar" : "Unread only"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.filteredMeta, { color: colors.textSecondary }]}>
            {isTr ? `${filteredItems.length} kart gosteriliyor` : `${filteredItems.length} cards shown`}
          </Text>
        </View>

        {syncError ? (
          <View style={[styles.warningCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.warningText, { color: colors.warning ?? colors.primary }]}>{syncError}</Text>
          </View>
        ) : null}
        {feedLoadError ? (
          <View style={[styles.warningCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.warningText, { color: colors.warning ?? colors.primary }]}>{feedLoadError}</Text>
          </View>
        ) : null}

        <View style={styles.feedList}>
          {filteredItems.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {isTr ? "Filtreye uygun kayit yok" : "No matching records"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isTr
                  ? "Aramayi sadelestir veya filtreleri degistir."
                  : "Try a simpler search or adjust filters."}
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const isRead = readSet.has(item.id);
              const isSaved = bookmarkedSet.has(item.id);
              const isSummaryVisible = !hideSensitive || revealedIds.includes(item.id);
              const impactColor = item.impact === "high" ? colors.warning ?? "#F97316" : colors.primary;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: isRead ? 0.94 : 1,
                    },
                  ]}
                >
                  <View style={styles.metaRow}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, { borderColor: colors.primary, backgroundColor: colors.background }]}>
                        <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                          {getTypeBadgeLabel(item.type)}
                        </Text>
                      </View>
                      <View style={[styles.typeBadge, { borderColor: impactColor, backgroundColor: colors.background }]}>
                        <Text style={[styles.typeBadgeText, { color: impactColor }]}>
                          {item.impact === "high" ? (isTr ? "YUKSEK ETKI" : "HIGH IMPACT") : isTr ? "ORTA ETKI" : "MODERATE"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.metaDate, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.text }]}>{isTr ? item.titleTr : item.titleEn}</Text>
                  <Text style={[styles.cardSummary, { color: colors.textSecondary }]}>
                    {isSummaryVisible
                      ? isTr
                        ? item.summaryTr
                        : item.summaryEn
                      : isTr
                        ? "Ozet gizlendi. Hazir oldugunda 'Ozeti goster' ile ac."
                        : "Summary hidden. Use 'Reveal summary' when you are ready."}
                  </Text>

                  <View style={styles.tagRow}>
                    {(isTr ? item.tagsTr : item.tagsEn).map((tag) => (
                      <View
                        key={`${item.id}-${tag}`}
                        style={[styles.tagChip, { borderColor: colors.border, backgroundColor: colors.background }]}
                      >
                        <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.sourceText, { color: colors.textSecondary }]}>{item.source}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        void openSource(item);
                      }}
                      activeOpacity={0.86}
                    >
                      <Text style={styles.primaryBtnText}>{isTr ? "Kaynagi ac" : "Open source"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={() => toggleSaved(item.id)}
                    >
                      <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                        {isSaved ? (isTr ? "Kaydi kaldir" : "Unsave") : isTr ? "Kaydet" : "Save"}
                      </Text>
                    </TouchableOpacity>

                    {hideSensitive ? (
                      <TouchableOpacity
                        style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={() => toggleReveal(item.id)}
                      >
                        <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                          {isSummaryVisible
                            ? isTr
                              ? "Ozeti gizle"
                              : "Hide summary"
                            : isTr
                              ? "Ozeti goster"
                              : "Reveal summary"}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <Text style={[styles.readStatus, { color: isRead ? colors.primary : colors.textSecondary }]}>
                    {isRead ? (isTr ? "Durum: Okundu" : "Status: Read") : isTr ? "Durum: Bekliyor" : "Status: Pending"}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.footerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {isTr
              ? "Icerik hassas gelebilir. Tetiklenme hissedersen hemen SOS'a gecip guvenli protokolu baslat."
              : "Content can be sensitive. If you feel triggered, move to SOS and start your safety protocol."}
          </Text>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/sos")}
            >
              <Text style={styles.primaryBtnText}>SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={resetReadState}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                {isTr ? "Okundu durumunu sifirla" : "Reset read status"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.display,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
    lineHeight: 20,
    marginBottom: 10,
  },
  intro: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 20,
    marginBottom: 12,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  heroPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 66,
    justifyContent: "center",
  },
  heroPillValue: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 21,
  },
  heroPillLabel: {
    fontSize: 11,
    fontFamily: Fonts.body,
    marginTop: 3,
  },
  heroInsight: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  feedMeta: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.body,
  },
  controlCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  refreshRow: {
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  tabChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  tabChipText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.2,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  toggleChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  toggleText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
  },
  filteredMeta: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  warningCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.base,
  },
  warningText: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  feedList: {
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadows.card,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.3,
  },
  metaDate: {
    fontSize: 11,
    fontFamily: Fonts.body,
    textAlign: "right",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardSummary: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 19,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 10,
    fontFamily: Fonts.body,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
  },
  readStatus: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  footerCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  footerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
