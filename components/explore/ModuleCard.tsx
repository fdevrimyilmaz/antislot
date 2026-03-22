import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useExploreStore } from "@/store/exploreStore";
import type { ExploreModuleMeta } from "@/types/explore";
import { router, type Href } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getModuleSubtitle, getModuleTitle } from "./moduleIdToI18n";

export function ModuleCard({ module }: { module: ExploreModuleMeta }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const setLastVisited = useExploreStore((state) => state.setLastVisited);
  const title = getModuleTitle(t, module.id);
  const subtitle = getModuleSubtitle(t, module.id);

  const onPress = () => {
    setLastVisited(module.id);
    router.push(module.route as Href);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.86}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <IconSymbol
            name={module.icon as Parameters<typeof IconSymbol>[0]["name"]}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    minHeight: 88,
    justifyContent: "center",
    ...Shadows.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.body,
  },
});
