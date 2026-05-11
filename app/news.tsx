import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeTexture } from "@/components/theme-texture";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchGamblingNewsBySource, type NewsItem } from "@/services/news";

type SourceGroups = {
  sondakika: NewsItem[];
  milliyet: NewsItem[];
};

const SOURCE_LINKS = {
  sondakika: "https://www.sondakika.com/kumar/",
  milliyet: "https://www.milliyet.com.tr/haberleri/sanal-kumar",
} as const;

export default function NewsScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SourceGroups>({
    sondakika: [],
    milliyet: [],
  });

  const hasAnyNews = useMemo(
    () => groups.sondakika.length > 0 || groups.milliyet.length > 0,
    [groups]
  );

  const loadNews = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const data = await fetchGamblingNewsBySource();
      setGroups(data);
      if (data.sondakika.length === 0 && data.milliyet.length === 0) {
        setError("Haberler su an alinmadi. Lutfen tekrar dene.");
      }
    } catch {
      setError("Haberler yuklenirken baglanti sorunu olustu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const openUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return;
    await Linking.openURL(url);
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.text }]}>{"<- Geri"}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>HABERLER</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Kumar ve sanal kumar guncel haberleri
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => loadNews(true)}
            disabled={refreshing || loading}
          >
            <Text style={styles.actionBtnText}>{refreshing ? "Yenileniyor..." : "Yenile"}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.textMuted }]}>Haberler yukleniyor...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

            <NewsSection
              title="SonDakika"
              sourceUrl={SOURCE_LINKS.sondakika}
              items={groups.sondakika}
              colors={colors}
              onOpenUrl={openUrl}
            />

            <NewsSection
              title="Milliyet"
              sourceUrl={SOURCE_LINKS.milliyet}
              items={groups.milliyet}
              colors={colors}
              onOpenUrl={openUrl}
            />

            {!hasAnyNews ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Kaynaklardan haber bulunamadi. Biraz sonra tekrar dene.
              </Text>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function NewsSection({
  title,
  sourceUrl,
  items,
  colors,
  onOpenUrl,
}: {
  title: string;
  sourceUrl: string;
  items: NewsItem[];
  colors: {
    card: string;
    cardBorder: string;
    text: string;
    textMuted: string;
    primary: string;
    accent: string;
  };
  onOpenUrl: (url: string) => Promise<void>;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <TouchableOpacity onPress={() => onOpenUrl(sourceUrl)}>
          <Text style={[styles.sourceLink, { color: colors.primary }]}>Kaynak Sayfasi</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={[styles.sectionEmpty, { color: colors.textMuted }]}>
          Bu kaynaktan su an haber alinmadi.
        </Text>
      ) : (
        items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onOpenUrl(item.url)}
            style={[styles.card, { borderColor: colors.cardBorder }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            {item.description ? (
              <Text style={[styles.cardDescription, { color: colors.textMuted }]} numberOfLines={3}>
                {item.description}
              </Text>
            ) : null}
            <View style={styles.cardFooter}>
              <Text style={[styles.cardSource, { color: colors.accent }]}>{item.sourceLabel}</Text>
              <Text style={[styles.cardAction, { color: colors.primary }]}>{"Habere Git ->"}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 8, paddingBottom: 8 },
  backBtn: { alignSelf: "flex-start", marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 4 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  actions: { marginTop: 8, marginBottom: 8, alignItems: "flex-start" },
  actionBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  actionBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loaderText: { fontSize: 13 },
  list: { paddingBottom: 26, gap: 14 },
  errorText: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  section: { borderRadius: 16, borderWidth: 1, padding: 14 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sourceLink: { fontSize: 12, fontWeight: "700" },
  sectionEmpty: { fontSize: 13 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21 },
  cardDescription: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  cardFooter: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardSource: { fontSize: 12, fontWeight: "700" },
  cardAction: { fontSize: 12, fontWeight: "700" },
  emptyText: { textAlign: "center", fontSize: 13, marginTop: 8 },
});
