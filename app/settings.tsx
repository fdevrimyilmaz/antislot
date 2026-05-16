import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  ADDICTION_KEYS,
  ADDICTION_LABELS,
  type UserAddictions,
  useUserAddictionsStore,
} from "@/store/userAddictionsStore";
import { THEME_OPTIONS, useTheme } from "@/contexts/ThemeContext";
import {
  formatRemaining,
  isLockoutActive,
  remainingMs,
  useLockoutStore,
} from "@/store/lockoutStore";
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ProfileSummary } from "@/components/ui/profile-summary";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { getSettingsLocale, type LinkItem } from "@/i18n/settings";


export default function SettingsScreen() {
  const { language } = useLanguage();
  const sx = useMemo(() => getSettingsLocale(language), [language]);
  const { userAddictions, hydrated, setManyAddictions } = useUserAddictionsStore();
  const { theme, preference, colors } = useTheme();
  const toast = useToast();
  const lockoutState = useLockoutStore((s) => s.state);
  const lockoutActive = isLockoutActive(lockoutState);
  const lockoutRemaining = lockoutActive
    ? formatRemaining(remainingMs(lockoutState))
    : null;
  const [draft, setDraft] = useState<UserAddictions>(userAddictions);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated) {
      setDraft(userAddictions);
    }
  }, [hydrated, userAddictions]);

  const selectedCount = useMemo(
    () => ADDICTION_KEYS.filter((key) => draft[key]).length,
    [draft]
  );
  const hasChanges = useMemo(
    () => ADDICTION_KEYS.some((key) => draft[key] !== userAddictions[key]),
    [draft, userAddictions]
  );

  const protectionLinks = sx.links.protection;
  const supportLinks = sx.links.support;
  const legalLinks = sx.links.legal;
  const devLinks = sx.links.dev;

  const handleToggle = (key: (typeof ADDICTION_KEYS)[number]) => {
    if (lockoutActive) {
      haptics.warning();
      toast.warning(
        sx.toast.lockMessage(lockoutRemaining ?? ""),
        sx.toast.lockTitle
      );
      return;
    }
    if (draft[key] && selectedCount === 1) {
      haptics.warning();
      toast.warning(sx.toast.minSelectionMessage, sx.toast.minSelectionTitle);
      return;
    }
    haptics.selection();
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentLabel = useMemo(() => {
    if (preference === "system") return sx.theme.autoSystem;
    const opt = THEME_OPTIONS.find((o) => o.id === theme);
    return opt ? opt.label : sx.theme.custom;
  }, [preference, sx.theme.autoSystem, sx.theme.custom, theme]);

  const handleSave = async () => {
    if (selectedCount === 0 || saving) return;
    if (lockoutActive) {
      haptics.warning();
      toast.warning(
        sx.toast.lockMessage(lockoutRemaining ?? ""),
        sx.toast.lockTitle
      );
      return;
    }
    haptics.tapMedium();
    setSaving(true);
    try {
      await setManyAddictions(draft);
      haptics.success();
      toast.success(sx.toast.savedMessage, sx.toast.savedTitle);
    } catch (error) {
      reportError(error, { scope: "settings.save" });
      haptics.error();
      toast.error(sx.toast.errorMessage, sx.toast.errorTitle);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkPress = (route: string) => {
    haptics.tapLight();
    router.push(route as never);
  };

  if (!hydrated) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView
          style={styles.container}
          accessible
          accessibilityLabel={sx.header.loadingAccessibility}
          accessibilityState={{ busy: true }}
        >
          <View style={styles.content}>
            <Skeleton width={60} height={16} radius={6} style={styles.skelBack} />
            <Skeleton width="40%" height={28} radius={8} style={styles.skelTitle} />
            <Card style={styles.skelCard}>
              <Skeleton width="60%" height={16} radius={6} />
              <Skeleton width="90%" height={12} radius={6} style={styles.skelGap} />
              <Skeleton width="100%" height={56} radius={12} style={styles.skelGapLg} />
              <Skeleton width="100%" height={56} radius={12} style={styles.skelGapLg} />
            </Card>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel={sx.header.back}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.text}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.backButtonText, { color: colors.text }]}>{sx.header.back}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {sx.header.title}
          </Text>

          <ProfileSummary />

          <View style={styles.cardSpacing}>
            <LanguageSelector variant="card" />
          </View>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title={sx.theme.sectionTitle}
              icon="color-palette"
              subtitle={sx.theme.sectionSubtitle}
            />
            <TouchableOpacity
              onPress={() => {
                haptics.tapLight();
                router.push("/themes" as never);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={sx.theme.openGalleryA11y}
              style={[
                styles.themeGalleryRow,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View
                style={[styles.themeGalleryIcon, { backgroundColor: `${colors.primary}14` }]}
              >
                <Ionicons name="color-palette" size={18} color={colors.primary} />
              </View>
              <View style={styles.themeGalleryText}>
                <Text style={[styles.themeGalleryTitle, { color: colors.text }]}>
                  {sx.theme.galleryTitle}
                </Text>
                <Text
                  style={[styles.themeGallerySub, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {sx.theme.gallerySubtitle(currentLabel)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title={sx.tracking.title}
              icon="options"
              subtitle={sx.tracking.subtitle}
            />
            {lockoutActive ? (
              <View
                style={[
                  styles.lockoutNotice,
                  { backgroundColor: `${colors.success}14`, borderColor: colors.success },
                ]}
              >
                <Ionicons name="lock-closed" size={14} color={colors.success} />
                <Text style={[styles.lockoutNoticeText, { color: colors.text }]}> 
                  {sx.tracking.lockNotice(lockoutRemaining ?? "")}
                </Text>
              </View>
            ) : null}
            <View style={styles.toggleList}>
              {ADDICTION_KEYS.map((key, index) => (
                <View
                  key={key}
                  style={[
                    styles.toggleRow,
                    index < ADDICTION_KEYS.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>
                      {ADDICTION_LABELS[key]}
                    </Text>
                    <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                      {sx.tracking.toggleHint}
                    </Text>
                  </View>
                  <Switch
                    value={draft[key]}
                    onValueChange={() => handleToggle(key)}
                    disabled={lockoutActive}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={sx.tracking.toggleA11y(ADDICTION_LABELS[key])}
                  />
                </View>
              ))}
            </View>

            {selectedCount === 0 ? (
              <View style={[styles.inlineWarning, { backgroundColor: `${colors.danger}1A` }]}>
                <Ionicons name="warning" size={16} color={colors.danger} />
                <Text style={[styles.inlineWarningText, { color: colors.danger }]}>
                  {sx.tracking.inlineWarning}
                </Text>
              </View>
            ) : null}

            <Button
              title={saving ? sx.tracking.savingLabel : sx.tracking.saveLabel}
              onPress={handleSave}
              disabled={!hasChanges || selectedCount === 0 || saving || lockoutActive}
              loading={saving}
              variant="primary"
              fullWidth
              leftIcon="checkmark"
              style={styles.saveBtn}
            />
          </Card>

          <LinkSection
            title={sx.sections.protectionTitle}
            icon="shield-checkmark"
            subtitle={sx.sections.protectionSubtitle}
            items={protectionLinks}
            colors={colors}
            onPress={handleLinkPress}
          />

          <LinkSection
            title={sx.sections.supportTitle}
            icon="help-buoy"
            subtitle={sx.sections.supportSubtitle}
            items={supportLinks}
            colors={colors}
            onPress={handleLinkPress}
          />

          <LinkSection
            title={sx.sections.legalTitle}
            icon="lock-closed"
            subtitle={sx.sections.legalSubtitle}
            items={legalLinks}
            colors={colors}
            onPress={handleLinkPress}
          />

          <LinkSection
            title={sx.sections.devTitle}
            icon="construct"
            items={devLinks}
            colors={colors}
            onPress={handleLinkPress}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type LinkSectionProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  items: LinkItem[];
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: (route: string) => void;
};

function LinkSection({ title, icon, subtitle, items, colors, onPress }: LinkSectionProps) {
  return (
    <Card style={styles.cardSpacing}>
      <SectionHeader title={title} icon={icon} subtitle={subtitle} />
      <View style={styles.linkList}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.linkRow,
              index < items.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              },
            ]}
            onPress={() => onPress(item.route)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={styles.linkLeft}>
              <View
                style={[styles.linkIcon, { backgroundColor: `${colors.primary}14` }]}
              >
                <Ionicons name={item.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.linkLabel, { color: colors.text }]}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 18,
  },
  cardSpacing: {
    marginBottom: 14,
  },
  themeGalleryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeGalleryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  themeGalleryText: { flex: 1, minWidth: 0 },
  themeGalleryTitle: { fontSize: 15, fontWeight: "800" },
  themeGallerySub: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  toggleList: {
    width: "100%",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: "700" },
  toggleHint: { fontSize: 12, marginTop: 2 },
  inlineWarning: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  inlineWarningText: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  saveBtn: {
    marginTop: 14,
  },
  lockoutNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 4,
  },
  lockoutNoticeText: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  linkList: {
    width: "100%",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  linkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  linkIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  skelBack: { marginBottom: 10 },
  skelTitle: { marginBottom: 16 },
  skelCard: { marginBottom: 14 },
  skelGap: { marginTop: 8 },
  skelGapLg: { marginTop: 12 },
});
