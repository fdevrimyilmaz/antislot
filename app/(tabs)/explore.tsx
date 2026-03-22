import { ModuleCard, ModuleSection, getModuleTitle } from "@/components/explore";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAutoTranslatedValue } from "@/hooks/useLocalizedCopy";
import { useExploreStore } from "@/store/exploreStore";
import type { ExploreModuleMeta } from "@/types/explore";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const getModulesByType = useExploreStore((state) => state.getModulesByType);
  const lastVisitedModule = useExploreStore((state) => state.lastVisitedModule);
  const setLastVisited = useExploreStore((state) => state.setLastVisited);
  const allModules = useExploreStore((state) => state.modules);
  const coreModules = getModulesByType("core");
  const externalModules = getModulesByType("external");

  const lastVisitedMeta = useMemo(
    () => allModules.find((module) => module.id === lastVisitedModule) ?? null,
    [allModules, lastVisitedModule]
  );

  const featuredModules = useMemo(
    () => [...coreModules.slice(0, 2), ...externalModules.slice(0, 1)],
    [coreModules, externalModules]
  );

  const heroGradient = useMemo<[string, string, ...string[]]>(() => {
    const gradient = colors.backgroundGradient;
    if (gradient.length >= 2) {
      return [gradient[0], gradient[1], ...gradient.slice(2)];
    }
    return [colors.primary, colors.secondary];
  }, [colors.backgroundGradient, colors.primary, colors.secondary]);

  const baseCopy = useMemo(
    () =>
      language === "tr"
        ? {
            statsModules: "Modul",
            statsFocus: "Odak Alani",
            featured: "One Cikanlar",
            continueTitle: "Kaldigin yerden devam et",
            quickStartTitle: "Hizli Baslat",
            startInternal: "Ic kesif",
            startExternal: "Dis kesif",
            emergency: "Acil destege ihtiyacin var mi?",
            settings: "Ayarlar",
          }
        : {
            statsModules: "Modules",
            statsFocus: "Focus Areas",
            featured: "Featured",
            continueTitle: "Continue where you left off",
            quickStartTitle: "Quick Start",
            startInternal: "Internal",
            startExternal: "External",
            emergency: "Need urgent support?",
            settings: "Settings",
          },
    [language]
  );
  const copy = useAutoTranslatedValue(baseCopy);

  const openModule = (module: ExploreModuleMeta | null) => {
    if (!module) return;
    setLastVisited(module.id);
    router.push(module.route as Href);
  };

  const defaultContinueModule = lastVisitedMeta ?? coreModules[0] ?? null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: colors.border }]}
        >
          <Text style={styles.heroTitle}>{t.exploreTitle}</Text>
          <Text style={styles.heroSubtitle}>{t.exploreSubtitle}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{allModules.length}</Text>
              <Text style={styles.heroStatLabel}>{copy.statsModules}</Text>
            </View>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>2</Text>
              <Text style={styles.heroStatLabel}>{copy.statsFocus}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.86}
            onPress={() => openModule(defaultContinueModule)}
          >
            <View style={[styles.quickButtonIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <IconSymbol name="play.fill" size={16} color={colors.primary} />
            </View>
            <View style={styles.quickButtonTextWrap}>
              <Text style={[styles.quickButtonLabel, { color: colors.textSecondary }]}>{copy.continueTitle}</Text>
              <Text style={[styles.quickButtonValue, { color: colors.text }]} numberOfLines={1}>
                {defaultContinueModule
                  ? getModuleTitle(t, defaultContinueModule.id)
                  : getModuleTitle(t, "future-simulator")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{copy.featured}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
            {featuredModules.map((module) => (
              <View key={`featured-${module.id}`} style={styles.featuredCard}>
                <ModuleCard module={module} />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.quickStartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.quickStartHeader}>
            <IconSymbol name="sparkles" size={18} color={colors.primary} />
            <Text style={[styles.quickStartTitle, { color: colors.text }]}>{copy.quickStartTitle}</Text>
          </View>
          <View style={styles.quickStartActions}>
            <TouchableOpacity
              style={[styles.quickStartBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => openModule(coreModules[0] ?? null)}
            >
              <Text style={[styles.quickStartBtnText, { color: colors.primary }]}>{copy.startInternal}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickStartBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => openModule(externalModules[0] ?? null)}
            >
              <Text style={[styles.quickStartBtnText, { color: colors.primary }]}>{copy.startExternal}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ModuleSection title={t.exploreSectionInternal} modules={coreModules} />
        <ModuleSection title={t.exploreSectionExternal} modules={externalModules} />

        <View style={styles.footer}>
          <Text style={[styles.footerHint, { color: colors.textSecondary }]}>{copy.emergency}</Text>
          <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/sos")}>
            <Text style={styles.footerBtnText}>SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerBtnSecondary, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push("/settings")}
          >
            <Text style={[styles.footerBtnSecondaryText, { color: colors.primary }]}>{copy.settings}</Text>
          </TouchableOpacity>
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
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    ...Shadows.card,
  },
  heroTitle: {
    fontSize: 28,
    color: "#FFFFFF",
    fontFamily: Fonts.display,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 14,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroStatPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 90,
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: Fonts.display,
    lineHeight: 20,
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
    marginTop: 3,
  },
  quickRow: {
    marginBottom: Spacing.base,
  },
  quickButton: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Shadows.card,
  },
  quickButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quickButtonTextWrap: {
    flex: 1,
  },
  quickButtonLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 2,
  },
  quickButtonValue: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 10,
  },
  featuredRow: {
    gap: 10,
    paddingRight: 6,
  },
  featuredCard: {
    width: 285,
  },
  quickStartCard: {
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadows.card,
  },
  quickStartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  quickStartTitle: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  quickStartActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickStartBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  quickStartBtnText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: Spacing.base,
    alignItems: "center",
  },
  footerHint: {
    width: "100%",
    fontSize: 13,
    fontFamily: Fonts.body,
    marginBottom: 2,
  },
  footerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
  },
  footerBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  footerBtnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  footerBtnSecondaryText: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
});
