import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

type SupportResource = {
  id: string;
  category: string;
  title: string;
  description: string;
  phone?: string;
  website?: string;
};

const RESOURCES: SupportResource[] = [
  {
    id: "gambling-ncpg",
    category: "Kumar Desteği",
    title: "Ulusal Problemli Kumar Konseyi",
    description: "Kumar bağımlılığından iyileşme için yardım hattı ve kaynaklar.",
    phone: "18005224700",
    website: "https://www.ncpgambling.org",
  },
  {
    id: "gamblers-anon",
    category: "Kumar Desteği",
    title: "Kumarbazlar Anonim",
    description: "Akran destek toplantıları ve iyileşme topluluğu.",
    website: "https://www.gamblersanonymous.org",
  },
  {
    id: "mental-988",
    category: "Ruh Sağlığı",
    title: "İntihar ve Kriz Destek Hattı",
    description: "Telefon veya mesajla 7/24 kriz desteği.",
    phone: "988",
    website: "https://988lifeline.org",
  },
  {
    id: "crisis-text",
    category: "Ruh Sağlığı",
    title: "Kriz SMS Hattı",
    description: "Kriz anlarında mesajla destek.",
    website: "https://www.crisistextline.org",
  },
  {
    id: "nfcc",
    category: "Finansal Destek",
    title: "Ulusal Kredi Danışmanlığı Vakfı",
    description: "Bütçe planlama ve borç desteği.",
    website: "https://www.nfcc.org",
  },
  {
    id: "hud",
    category: "Barınma Desteği",
    title: "HUD Barınma Kaynakları",
    description: "Barınma desteği ve yerel programlar.",
    website: "https://www.hud.gov/topics/housing_assistance",
  },
  {
    id: "community",
    category: "Topluluk",
    title: "Akran Destek Topluluğu",
    description: "Denetlenen iyileşme sohbetlerine katılın.",
    website: "https://www.recovery.org",
  },
];

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  "Kumar Desteği": "ban",
  "Ruh Sağlığı": "heart",
  "Finansal Destek": "wallet",
  "Barınma Desteği": "home",
  Topluluk: "people",
};

export default function Support() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const filteredResources = useMemo(() => {
    if (!query.trim()) return RESOURCES;
    const q = query.toLowerCase();
    return RESOURCES.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [query]);

  const handleCall = (phone: string) => {
    haptics.tapMedium();
    Linking.openURL(`tel:${phone}`);
  };

  const handleWebsite = (url: string) => {
    haptics.tapLight();
    Linking.openURL(url);
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
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <Card variant="hero" style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="people" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Destek Ağı
              </Text>
              <Text style={styles.heroSubtitle}>
                Kumar bağımlılığından iyileşme ve iyi oluş için güvenilir kaynaklar.
              </Text>
            </View>
          </Card>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Destek kaynaklarında ara..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              accessibilityLabel="Destek araması"
            />
            {query.length > 0 ? (
              <TouchableOpacity
                onPress={() => setQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Aramayı temizle"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {filteredResources.length === 0 ? (
            <Card style={styles.cardSpacing}>
              <View style={styles.emptyState}>
                <Ionicons name="search" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Sonuç bulunamadı
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  Farklı bir arama terimi deneyin.
                </Text>
              </View>
            </Card>
          ) : (
            filteredResources.map((resource) => (
              <Card key={resource.id} style={styles.cardSpacing}>
                <View style={styles.resourceHeader}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: `${colors.primary}14` },
                    ]}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[resource.category] ?? "help-circle"}
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.resourceTexts}>
                    <Text
                      style={[styles.resourceCategory, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {resource.category.toUpperCase()}
                    </Text>
                    <Text style={[styles.resourceTitle, { color: colors.text }]}>
                      {resource.title}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.resourceDescription, { color: colors.textMuted }]}>
                  {resource.description}
                </Text>
                <View style={styles.resourceActions}>
                  {resource.phone ? (
                    <Button
                      title="Ara"
                      onPress={() => handleCall(resource.phone!)}
                      variant="primary"
                      leftIcon="call"
                    />
                  ) : null}
                  {resource.website ? (
                    <Button
                      title="Web Sitesi"
                      onPress={() => handleWebsite(resource.website!)}
                      variant="secondary"
                      leftIcon="open-outline"
                    />
                  ) : null}
                </View>
              </Card>
            ))
          )}
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#FFFFFF",
    opacity: 0.92,
    fontSize: 13,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  cardSpacing: { marginBottom: 12 },
  resourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceTexts: { flex: 1, minWidth: 0 },
  resourceCategory: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resourceTitle: { fontSize: 16, fontWeight: "800" },
  resourceDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  resourceActions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyHint: { fontSize: 13, textAlign: "center" },
});
