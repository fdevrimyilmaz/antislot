import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeTexture } from "@/components/theme-texture";
import { useTheme } from "@/contexts/ThemeContext";
import { GAMBLING_FACTS } from "./data/gamblingFacts";

const FACTS_PER_PAGE = 8;

function paginateFacts(facts: readonly string[], pageSize: number): string[][] {
  const pages: string[][] = [];
  for (let i = 0; i < facts.length; i += pageSize) {
    pages.push(facts.slice(i, i + pageSize));
  }
  return pages;
}

export default function FactsScreen() {
  const { colors } = useTheme();
  const pages = useMemo(() => paginateFacts(GAMBLING_FACTS, FACTS_PER_PAGE), []);
  const [pageIndex, setPageIndex] = useState(0);

  const clampedIndex = Math.min(Math.max(pageIndex, 0), Math.max(pages.length - 1, 0));
  const currentFacts = pages[clampedIndex] ?? [];
  const currentHeroFact = currentFacts[0] ?? "Gercekler netlesince kararlar da netlesir.";

  const canGoBack = clampedIndex > 0;
  const canGoNext = clampedIndex < pages.length - 1;

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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.text }]}>{"<- Geri"}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>GERCEKLER</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Online kumarin gercek yuzu.</Text>
          </View>

          <LinearGradient
            colors={colors.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>Gercekler Modulu</Text>
            <Text style={styles.heroText}>{currentHeroFact}</Text>
          </LinearGradient>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Bugunun Gercekleri</Text>
              <Text style={[styles.sectionCount, { color: colors.primary }]}>
                {clampedIndex + 1}/{pages.length}
              </Text>
            </View>

            {currentFacts.map((fact, factIndex) => {
              const absoluteNumber = clampedIndex * FACTS_PER_PAGE + factIndex + 1;
              return (
                <View key={`fact-${absoluteNumber}`} style={[styles.factCard, { borderColor: colors.cardBorder }]}>
                  <Text style={[styles.factNumber, { color: colors.accent }]}>#{absoluteNumber}</Text>
                  <Text style={[styles.factText, { color: colors.text }]}>{fact}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: canGoBack ? colors.primary : colors.cardBorder }]}
              disabled={!canGoBack}
              onPress={() => setPageIndex((value) => Math.max(0, value - 1))}
            >
              <Text style={styles.navBtnText}>Onceki</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: canGoNext ? colors.primary : colors.cardBorder }]}
              disabled={!canGoNext}
              onPress={() => setPageIndex((value) => Math.min(pages.length - 1, value + 1))}
            >
              <Text style={styles.navBtnText}>Sonraki</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30, gap: 14 },
  header: { marginBottom: 2 },
  backBtn: { alignSelf: "flex-start", marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 4 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.88)",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  heroText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", lineHeight: 26 },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  sectionCount: { fontSize: 12, fontWeight: "700" },
  factCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.28)",
    gap: 6,
  },
  factNumber: { fontSize: 12, fontWeight: "800" },
  factText: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  paginationRow: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  navBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  navBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
