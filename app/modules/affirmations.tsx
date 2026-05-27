import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { withPremiumGate } from "@/components/ui/premium-gate";
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
import { useToast } from "@/components/ui/toast";
import { haptics } from "@/services/haptics";
import {
  AFFIRMATIONS,
  CATEGORY_META,
  pickDailyAffirmation,
  type AffirmationCategory,
} from "../data/affirmations";

const ALL_CATEGORIES: AffirmationCategory[] = [
  "guc",
  "kimlik",
  "huzur",
  "para",
  "iliski",
  "gelecek",
];

function AffirmationsModule() {
  const { colors } = useTheme();
  const toast = useToast();
  const daily = useMemo(() => pickDailyAffirmation(), []);
  const [filter, setFilter] = useState<AffirmationCategory | "all">("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  const filtered = useMemo(() => {
    if (filter === "all") return AFFIRMATIONS;
    return AFFIRMATIONS.filter((a) => a.category === filter);
  }, [filter]);

  const current = filtered[currentIndex] ?? filtered[0];

  const handleNext = () => {
    haptics.tapLight();
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
  };

  const handlePrev = () => {
    haptics.tapLight();
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
  };

  const handleFilter = (next: AffirmationCategory | "all") => {
    haptics.selection();
    setFilter(next);
    setCurrentIndex(0);
  };

  const handleSave = () => {
    haptics.tapMedium();
    toast.success("Günlüğüne not olarak ekleyebilirsin.", "İyi seçim");
    router.push("/diary");
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
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={["#4A4F8A", "#3F4477", "#353A66"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="sparkles" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={11} color="#A7AEFF" />
              <Text style={styles.heroBadgeText}>OLUMLAMALAR</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Bugünün olumlaması
            </Text>
            <Text style={styles.heroSubtitle}>
              {CATEGORY_META[daily.category].emoji} {CATEGORY_META[daily.category].label}
            </Text>
            <Text style={styles.heroQuote}>“{daily.text}”</Text>
            <Text style={styles.heroFooter}>
              30 farklı olumlamadan bugün için seçilen. Yarın yeni bir tane bulacaksın.
            </Text>
          </LinearGradient>

          {/* Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              onPress={() => handleFilter("all")}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === "all" ? colors.primary : colors.card,
                  borderColor: filter === "all" ? colors.primary : colors.cardBorder,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === "all" }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === "all" ? "#FFFFFF" : colors.text },
                ]}
              >
                Tümü
              </Text>
            </TouchableOpacity>
            {ALL_CATEGORIES.map((cat) => {
              const isActive = filter === cat;
              const meta = CATEGORY_META[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleFilter(cat)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.card,
                      borderColor: isActive ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={styles.filterEmoji}>{meta.emoji}</Text>
                  <Text
                    style={[
                      styles.filterText,
                      { color: isActive ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Carousel */}
          {current ? (
            <Card style={styles.cardSpacing}>
              <View style={styles.carouselHeader}>
                <Text style={[styles.cardCategoryLabel, { color: colors.primary }]}>
                  {CATEGORY_META[current.category].emoji} {CATEGORY_META[current.category].label.toUpperCase()}
                </Text>
                <Text style={[styles.cardCounter, { color: colors.textMuted }]}>
                  {currentIndex + 1} / {filtered.length}
                </Text>
              </View>
              <Text style={[styles.cardQuote, { color: colors.text }]}>
                “{current.text}”
              </Text>
              <View style={styles.navRow}>
                <Button
                  title="Önceki"
                  onPress={handlePrev}
                  variant="secondary"
                  leftIcon="chevron-back"
                />
                <Button
                  title="Günlüğe Ekle"
                  onPress={handleSave}
                  variant="primary"
                  leftIcon="bookmark"
                  style={styles.saveBtn}
                />
                <Button
                  title="Sonraki"
                  onPress={handleNext}
                  variant="secondary"
                  rightIcon="chevron-forward"
                />
              </View>
            </Card>
          ) : null}

          {/* Tip */}
          <Card style={styles.cardSpacing}>
            <View style={styles.tipRow}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                Nasıl kullanılır?
              </Text>
            </View>
            <Text style={[styles.tipBody, { color: colors.text }]}>
              Sabah uyandığında bir tane oku. Dürtü anında bir tane oku.
              Yatağa girmeden önce bir tane oku. Bunları yüksek sesle söyle —
              beyne sözlü mesajlar daha güçlü oturur.
            </Text>
          </Card>
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

  heroCard: {
    borderRadius: 22,
    padding: 24,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroDecor: { position: "absolute", right: -20, bottom: -20 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(167,174,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,174,255,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#A7AEFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    opacity: 0.92,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  heroQuote: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
    fontStyle: "italic",
    marginBottom: 16,
  },
  heroFooter: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontStyle: "italic",
  },

  filterScroll: {
    paddingRight: 22,
    gap: 6,
    paddingVertical: 4,
    marginBottom: 14,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
  },
  filterEmoji: { fontSize: 14 },
  filterText: { fontSize: 12, fontWeight: "700" },

  cardSpacing: { marginBottom: 14 },
  carouselHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardCategoryLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  cardCounter: { fontSize: 11, fontWeight: "700" },
  cardQuote: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 18,
  },
  navRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  saveBtn: { flex: 1 },

  tipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 15, fontWeight: "800" },
  tipBody: { fontSize: 13, lineHeight: 19 },
});

export default withPremiumGate(AffirmationsModule, {
  title: "Olumlamalar",
  subtitle: "30 farklı kart, günde 1 öne çıkıyor",
});
