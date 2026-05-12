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
import { ThemeTexture } from "@/components/theme-texture";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { LanguageSelector } from "@/components/ui/language-selector";
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";

type LinkItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const PRIVACY_LINKS: LinkItem[] = [
  { label: "Gizlilik Politikası", icon: "lock-closed", route: "/privacy" },
  { label: "Kullanım Şartları", icon: "document-text", route: "/terms" },
  { label: "Sınırlamalar", icon: "information-circle", route: "/limitations" },
];

const MESSAGE_LINKS: LinkItem[] = [
  { label: "SMS Spam Tanıyıcı", icon: "flask", route: "/sms-filter" },
];

const HELP_LINKS: LinkItem[] = [
  { label: "Destek Ağı", icon: "people", route: "/support" },
  { label: "SOS", icon: "alert-circle", route: "/sos" },
  { label: "Tanılamalar", icon: "construct", route: "/diagnostics" },
];

export default function SettingsScreen() {
  const { userAddictions, hydrated, setManyAddictions } = useUserAddictionsStore();
  const { theme, setTheme, colors } = useTheme();
  const toast = useToast();
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

  const handleToggle = (key: (typeof ADDICTION_KEYS)[number]) => {
    if (draft[key] && selectedCount === 1) {
      haptics.warning();
      toast.warning("En az bir bağımlılık seçili olmalı.", "Seçim Gerekli");
      return;
    }
    haptics.selection();
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSetTheme = (themeId: typeof theme) => {
    haptics.selection();
    setTheme(themeId);
  };

  const handleSave = async () => {
    if (selectedCount === 0 || saving) return;
    haptics.tapMedium();
    setSaving(true);
    try {
      await setManyAddictions(draft);
      haptics.success();
      toast.success("Kumar takibi güncellendi.", "Kaydedildi");
    } catch (error) {
      reportError(error, { scope: "settings.save" });
      haptics.error();
      toast.error("Ayarlar kaydedilemedi.", "Hata");
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
          accessibilityLabel="Ayarlar yükleniyor"
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
              accessibilityLabel="Geri"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.text}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text style={[styles.backButtonText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Ayarlar
          </Text>

          <View style={styles.cardSpacing}>
            <LanguageSelector variant="card" />
          </View>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Görsel Tema"
              icon="color-palette"
              subtitle="Uygulamanın genel görünümünü değiştirin."
            />
            <View style={styles.themeList}>
              {THEME_OPTIONS.map((option) => {
                const selected = option.id === theme;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.themeRow,
                      {
                        backgroundColor: selected ? `${colors.primary}14` : colors.card,
                        borderColor: selected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    onPress={() => handleSetTheme(option.id)}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${option.label}: ${option.description}`}
                  >
                    <View style={styles.themeTextBlock}>
                      <Text style={[styles.themeLabel, { color: colors.text }]}>
                        {option.emoji} {option.label}
                      </Text>
                      <Text style={[styles.themeHint, { color: colors.textMuted }]}>
                        {option.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: selected ? colors.primary : colors.cardBorder },
                      ]}
                    >
                      {selected ? (
                        <View
                          style={[styles.radioInner, { backgroundColor: colors.primary }]}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Card style={styles.cardSpacing}>
            <SectionHeader
              title="Kumar Takibi"
              icon="options"
              subtitle="Kumar takibini açıp kapatabilirsiniz. En az bir seçim gerekli."
            />
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
                      Takibi aç / kapat
                    </Text>
                  </View>
                  <Switch
                    value={draft[key]}
                    onValueChange={() => handleToggle(key)}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={`${ADDICTION_LABELS[key]} takibi`}
                  />
                </View>
              ))}
            </View>

            {selectedCount === 0 ? (
              <View style={[styles.inlineWarning, { backgroundColor: `${colors.danger}1A` }]}>
                <Ionicons name="warning" size={16} color={colors.danger} />
                <Text style={[styles.inlineWarningText, { color: colors.danger }]}>
                  En az bir seçim yapmalısınız.
                </Text>
              </View>
            ) : null}

            <Button
              title={saving ? "Kaydediliyor" : "Kaydet"}
              onPress={handleSave}
              disabled={!hasChanges || selectedCount === 0 || saving}
              loading={saving}
              variant="primary"
              fullWidth
              leftIcon="checkmark"
              style={styles.saveBtn}
            />
          </Card>

          <LinkSection
            title="Gizlilik ve Güvenlik"
            icon="shield"
            subtitle="Uygulama politikaları, sınırlamalar ve veri kullanımı."
            items={PRIVACY_LINKS}
            colors={colors}
            onPress={handleLinkPress}
          />

          <LinkSection
            title="Mesaj Araçları"
            icon="mail"
            subtitle="Şüpheli SMS'leri manuel test ile sınıflandır."
            items={MESSAGE_LINKS}
            colors={colors}
            onPress={handleLinkPress}
          />

          <LinkSection
            title="Yardım ve Tanılama"
            icon="help-buoy"
            items={HELP_LINKS}
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
  themeList: {
    gap: 10,
  },
  themeRow: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeTextBlock: { flex: 1, paddingRight: 12 },
  themeLabel: { fontSize: 15, fontWeight: "700" },
  themeHint: { fontSize: 12, marginTop: 3, lineHeight: 16 },
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
