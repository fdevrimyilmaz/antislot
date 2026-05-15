import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { haptics } from "@/services/haptics";
import { GAMBLING_FACTS } from "./data/gamblingFacts";

type Fact = {
  id: number;
  category: "matematik" | "psikoloji" | "finans" | "pazarlama" | "saglik";
  title: string;
  body: string;
};

const CATEGORY_LABELS: Record<Fact["category"], string> = {
  matematik: "MATEMATİK",
  psikoloji: "PSİKOLOJİ",
  finans: "FİNANS",
  pazarlama: "PAZARLAMA",
  saglik: "SAĞLIK",
};

const CATEGORY_ICONS: Record<
  Fact["category"],
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  matematik: "calculator",
  psikoloji: "pulse",
  finans: "wallet",
  pazarlama: "megaphone",
  saglik: "heart",
};

const BASE_FACTS: Fact[] = [
  {
    id: 1,
    category: "matematik",
    title: "Slot makinelerinde her donus bagimsiz",
    body:
      "Onceki kayiplar bir sonraki donusun kazanma olasiligini artirmaz. Her donus ayri bir olaydir.",
  },
  {
    id: 2,
    category: "pazarlama",
    title: "RTP orani vaat degil, pazarlama rakamidir",
    body:
      "%96 RTP sana birebir geri donus garantisi vermez. Teorik ortalamadir ve tek oturum icin anlamsiz olabilir.",
  },
  {
    id: 3,
    category: "psikoloji",
    title: "Yakin kaciris odullendirme gibi algilanir",
    body:
      "Neredeyse kazanma hissi beyinde gercek kazanca benzer tepki uretebilir. Bu davranis dongusunu tetikleyebilir.",
  },
  {
    id: 4,
    category: "matematik",
    title: "Ev avantaji matematiksel olarak her zaman vardir",
    body:
      "Rulet, blackjack ve slot gibi oyunlarda uzun vadede oyuncu beklenen deger olarak eksidedir.",
  },
  {
    id: 5,
    category: "psikoloji",
    title: "Kayip pesinde kosmak maliyeti buyutur",
    body:
      "Bir el daha ile kaybi kapatma dusuncesi genellikle daha yuksek riskli kararlara yol acar.",
  },
  {
    id: 6,
    category: "finans",
    title: "Kredi ile bahis kaybi finansal baskiyi artirir",
    body:
      "Kayip ustune faiz yukunun eklenmesi toplam zarari hizla buyutebilir.",
  },
  {
    id: 7,
    category: "pazarlama",
    title: "Bonuslar genelde cevrim kosuluna baglidir",
    body:
      "Cekim kosullari nedeniyle bonus tutarlari beklenenden daha zor nakde donusebilir.",
  },
  {
    id: 8,
    category: "saglik",
    title: "Aralikli odul dongusu aliskanlik olusturabilir",
    body:
      "Degisken odul duzeni davranisin tekrar edilmesini guclendirebilir ve kontrolu zorlastirabilir.",
  },
  {
    id: 9,
    category: "psikoloji",
    title: "Sansli seri hissi patern yanilsamasi olabilir",
    body:
      "Rastgele dagilimlarda kumelenmeler normaldir ve bunlar kontrol oldugu anlamina gelmez.",
  },
  {
    id: 10,
    category: "finans",
    title: "Uzun vadede oynamaya devam etmek kaybi artirir",
    body:
      "Kazanc tekrar oyuna sokuldukca ev avantaji etkisi toplami oyuncu aleyhine cevirebilir.",
  },
];

const CATEGORY_ROTATION: Fact["category"][] = [
  "matematik",
  "psikoloji",
  "finans",
  "pazarlama",
  "saglik",
];

const CATEGORY_RULES: { category: Fact["category"]; pattern: RegExp }[] = [
  { category: "finans", pattern: /(borc|kredi|faiz|butce|para|depozit|cekim|yatir)/i },
  { category: "pazarlama", pattern: /(bonus|kampanya|promosyon|rtp|vip|freebet|free spin)/i },
  { category: "matematik", pattern: /(algoritma|olasilik|istatistik|oran|rastgele|matematik)/i },
  { category: "saglik", pattern: /(uyku|stres|anksiyete|beyin|saglik|yorgunluk)/i },
  { category: "psikoloji", pattern: /(yalniz|kontrol|duygu|panik|utanc|bagimlilik|davranis)/i },
];

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const pickCategory = (text: string, index: number): Fact["category"] => {
  const rule = CATEGORY_RULES.find((entry) => entry.pattern.test(text));
  if (rule) return rule.category;
  return CATEGORY_ROTATION[index % CATEGORY_ROTATION.length];
};

const toTitle = (text: string, fallbackId: number) => {
  const cleaned = normalizeText(text).replace(/[.!?]+$/g, "");
  const firstClause = cleaned.split(/[,;:\-]/)[0].trim();
  const candidate = firstClause.length >= 18 ? firstClause : cleaned;
  if (!candidate) return `Gercek #${fallbackId}`;
  if (candidate.length <= 72) return candidate;
  return `${candidate.slice(0, 69).trimEnd()}...`;
};

const EXTRA_FACTS: Fact[] = GAMBLING_FACTS.map((raw, idx) => {
  const body = normalizeText(raw);
  return {
    id: BASE_FACTS.length + idx + 1,
    category: pickCategory(body, idx),
    title: toTitle(body, BASE_FACTS.length + idx + 1),
    body,
  };
});

const FACTS: Fact[] = [...BASE_FACTS, ...EXTRA_FACTS];

type FilterCategory = "all" | Fact["category"];

const FILTER_OPTIONS: { key: FilterCategory; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "matematik", label: "Matematik" },
  { key: "psikoloji", label: "Psikoloji" },
  { key: "finans", label: "Finans" },
  { key: "pazarlama", label: "Pazarlama" },
  { key: "saglik", label: "Sağlık" },
];

export default function FactsScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<FilterCategory>("all");

  const filtered = useMemo(
    () => (filter === "all" ? FACTS : FACTS.filter((f) => f.category === filter)),
    [filter]
  );

  const handleFilter = (next: FilterCategory) => {
    haptics.selection();
    setFilter(next);
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

          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            Gerçekler
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Online kumarın gerçek yüzü.
          </Text>

          {/* Gold hero card */}
          <LinearGradient
            colors={["#8B6614", "#7A580F", "#5A4108"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
            accessible
            accessibilityLabel={`${FACTS.length} kumar gerçeği`}
          >
            <View style={styles.heroDecorRing} pointerEvents="none" />
            <View style={styles.heroEyeWrap} pointerEvents="none">
              <Ionicons name="eye" size={120} color="rgba(255,255,255,0.18)" />
            </View>

            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="eye" size={18} color="#FFD074" />
              </View>
              <View style={styles.heroCountPill}>
                <Text style={styles.heroCountText}>{FACTS.length}</Text>
              </View>
            </View>

            <Text style={styles.heroTitle} accessibilityRole="header">
              GERÇEKLER
            </Text>
            <Text style={styles.heroSubtitle}>Online kumarın gerçek yüzü.</Text>
            <View style={styles.heroAccentLine} />
            <Text style={styles.heroBody}>
              Kumar mitlerini bozmak için kısa ve net gerçekler.
            </Text>
          </LinearGradient>

          {/* Category filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTER_OPTIONS.map((option) => {
              const isActive = filter === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => handleFilter(option.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.card,
                      borderColor: isActive ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={option.label}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Fact cards */}
          <View style={styles.factList}>
            {filtered.map((fact) => (
              <FactCard key={fact.id} fact={fact} />
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Bu gerçekler genel bilgi amaçlıdır. Yardıma ihtiyacın varsa lütfen
              destek hatlarını ara.
            </Text>
            <Button
              title="SOS Desteğine Git"
              onPress={() => {
                haptics.tapMedium();
                router.push("/sos");
              }}
              variant="secondary"
              fullWidth
              leftIcon="alert-circle"
              style={styles.footerBtn}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FactCard({ fact }: { fact: Fact }) {
  const { colors } = useTheme();
  const icon = CATEGORY_ICONS[fact.category];

  return (
    <Card style={styles.factCard}>
      <View style={styles.factHeader}>
        <View style={styles.factNumberWrap}>
          <View
            style={[
              styles.factNumberBubble,
              { backgroundColor: "rgba(245, 158, 11, 0.16)", borderColor: "#FFD074" },
            ]}
          >
            <Text style={styles.factNumber}>#{fact.id}</Text>
          </View>
        </View>
        <View
          style={[
            styles.factCategoryChip,
            { backgroundColor: `${colors.primary}14` },
          ]}
        >
          <Ionicons name={icon} size={11} color={colors.primary} />
          <Text style={[styles.factCategoryText, { color: colors.primary }]}>
            {CATEGORY_LABELS[fact.category]}
          </Text>
        </View>
      </View>
      <Text style={[styles.factTitle, { color: colors.text }]}>{fact.title}</Text>
      <Text style={[styles.factBody, { color: colors.textMuted }]}>{fact.body}</Text>
    </Card>
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
  title: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecorRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    right: -60,
    top: -60,
  },
  heroEyeWrap: {
    position: "absolute",
    right: -10,
    bottom: -20,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  heroBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCountPill: {
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroCountText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  heroAccentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFD074",
    marginBottom: 12,
  },
  heroBody: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    lineHeight: 18,
  },

  filterScroll: {
    paddingRight: 22,
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  factList: {
    gap: 12,
  },
  factCard: {},
  factHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  factNumberWrap: {},
  factNumberBubble: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  factNumber: {
    color: "#FFD074",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  factCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  factCategoryText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  factTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  factBody: {
    fontSize: 13,
    lineHeight: 19,
  },

  footer: {
    marginTop: 22,
    paddingTop: 18,
    gap: 12,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    fontStyle: "italic",
  },
  footerBtn: {
    marginTop: 4,
  },
});

