import { router } from "expo-router";
import React, { useMemo } from "react";
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
import { useProgressStore } from "@/store/progressStore";
import { haptics } from "@/services/haptics";

type Milestone = {
  days: number;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tier: "bronze" | "silver" | "gold" | "platinum" | "legend";
};

const MILESTONES: Milestone[] = [
  { days: 1,   title: "İlk Gün",        description: "Başlangıç en zorudur — sen yaptın.",                    icon: "play-circle",      tier: "bronze"   },
  { days: 3,   title: "3 Gün",          description: "Akut dürtü dalgasının ilk yumuşaması.",                 icon: "flame",            tier: "bronze"   },
  { days: 7,   title: "1 Hafta",        description: "Beyninin bahis döngüsü dışında ilk haftası.",           icon: "ribbon",           tier: "silver"   },
  { days: 14,  title: "2 Hafta",        description: "Uyku ve odak ölçülebilir şekilde toparlanıyor.",        icon: "shield-checkmark", tier: "silver"   },
  { days: 30,  title: "1 Ay",           description: "Yeni alışkanlık şekilleniyor — dopamin temeli yenileniyor.", icon: "trophy",       tier: "gold"     },
  { days: 60,  title: "2 Ay",           description: "İlişkiler ve maddi tablo iyileşmeye başlıyor.",         icon: "medal",            tier: "gold"     },
  { days: 90,  title: "3 Ay",           description: "Klinik açıdan kritik eşik — risk önemli oranda düşer.", icon: "star",             tier: "gold"     },
  { days: 180, title: "6 Ay",           description: "Yarım yıl. Kimliğine 'eski kumar oyuncusu' yerleşir.",  icon: "rocket",           tier: "platinum" },
  { days: 365, title: "1 Yıl",          description: "Bir tam yıl — toparlanma artık karakter haline geldi.",  icon: "diamond",          tier: "platinum" },
  { days: 730, title: "2 Yıl",          description: "Çift haneli sağlam bir dönem; hayatın merkezi değişti.", icon: "infinite",        tier: "legend"   },
  { days: 1825,title: "5 Yıl",          description: "Az insan buraya gelir — sen geldin.",                   icon: "planet",           tier: "legend"   },
];

const TIER_COLORS: Record<Milestone["tier"], readonly [string, string]> = {
  bronze:   ["#A56A2E", "#7E4E1F"],
  silver:   ["#A7AEB6", "#7C838B"],
  gold:     ["#F4B040", "#C98520"],
  platinum: ["#C8E2F0", "#8FAFC2"],
  legend:   ["#B580FF", "#7D40C7"],
};

export default function MilestonesModule() {
  const { colors } = useTheme();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const safeDays = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;

  const earned = useMemo(
    () => MILESTONES.filter((m) => safeDays >= m.days).length,
    [safeDays]
  );
  const nextMilestone = useMemo(
    () => MILESTONES.find((m) => m.days > safeDays),
    [safeDays]
  );

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

          {/* Hero */}
          <LinearGradient
            colors={["#4A4F8A", "#3F4477", "#353A66"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecor} pointerEvents="none">
              <Ionicons name="trophy" size={140} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="trophy" size={11} color="#FFD074" />
              <Text style={styles.heroBadgeText}>ROZETLER</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Kilometre Taşları
            </Text>
            <Text style={styles.heroSubtitle}>
              Her temiz gün bir başarıdır. Streak’in arttıkça yeni rozetler
              açılır.
            </Text>
            <View style={styles.heroStats}>
              <View>
                <Text style={styles.heroStatValue}>{safeDays}</Text>
                <Text style={styles.heroStatLabel}>TEMİZ GÜN</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View>
                <Text style={styles.heroStatValue}>
                  {earned}
                  <Text style={styles.heroStatTotal}>/{MILESTONES.length}</Text>
                </Text>
                <Text style={styles.heroStatLabel}>ROZET</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Next milestone progress */}
          {nextMilestone ? (
            <Card style={styles.cardSpacing}>
              <View style={styles.nextHeader}>
                <Ionicons name={nextMilestone.icon} size={20} color={colors.primary} />
                <Text style={[styles.nextLabel, { color: colors.textMuted }]}>
                  SONRAKİ ROZET
                </Text>
              </View>
              <Text style={[styles.nextTitle, { color: colors.text }]}>
                {nextMilestone.title}
              </Text>
              <Text style={[styles.nextDays, { color: colors.textMuted }]}>
                {nextMilestone.days - safeDays} gün kaldı
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, (safeDays / nextMilestone.days) * 100)}%` },
                  ]}
                />
              </View>
            </Card>
          ) : (
            <Card style={styles.cardSpacing}>
              <View style={styles.nextHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.nextLabel, { color: colors.success }]}>
                  TÜM ROZETLER KAZANILDI
                </Text>
              </View>
              <Text style={[styles.nextTitle, { color: colors.text }]}>Efsane statüsü</Text>
              <Text style={[styles.nextDays, { color: colors.textMuted }]}>
                Buraya gelen az insan var. Buradayız.
              </Text>
            </Card>
          )}

          {/* Badge grid */}
          <View style={styles.badgeGrid}>
            {MILESTONES.map((m) => {
              const earned = safeDays >= m.days;
              const [start, end] = TIER_COLORS[m.tier];
              return (
                <View
                  key={m.days}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: earned ? `${start}80` : colors.cardBorder,
                    },
                  ]}
                  accessible
                  accessibilityLabel={`${m.title}: ${earned ? "kazanıldı" : "kilitli"}. ${m.description}`}
                >
                  <LinearGradient
                    colors={earned ? [start, end] : [`${colors.cardBorder}AA`, `${colors.cardBorder}66`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.badgeMedal}
                  >
                    <Ionicons
                      name={earned ? m.icon : "lock-closed"}
                      size={26}
                      color={earned ? "#FFFFFF" : colors.textMuted}
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.badgeTitle,
                      { color: earned ? colors.text : colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {m.title}
                  </Text>
                  <Text
                    style={[styles.badgeDays, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {m.days} gün
                  </Text>
                  {earned ? (
                    <View
                      style={[
                        styles.earnedPill,
                        { backgroundColor: `${colors.success}1A` },
                      ]}
                    >
                      <Ionicons name="checkmark" size={10} color={colors.success} />
                      <Text style={[styles.earnedText, { color: colors.success }]}>
                        KAZANILDI
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Selected milestone descriptions list (textual) */}
          <Card style={styles.cardSpacing}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              Her rozet ne anlama gelir?
            </Text>
            <View style={styles.descList}>
              {MILESTONES.map((m) => {
                const earned = safeDays >= m.days;
                return (
                  <View key={`desc-${m.days}`} style={styles.descRow}>
                    <View
                      style={[
                        styles.descIcon,
                        {
                          backgroundColor: earned
                            ? `${TIER_COLORS[m.tier][0]}22`
                            : `${colors.cardBorder}66`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={earned ? m.icon : "lock-closed"}
                        size={14}
                        color={earned ? TIER_COLORS[m.tier][0] : colors.textMuted}
                      />
                    </View>
                    <View style={styles.descText}>
                      <Text style={[styles.descTitle, { color: colors.text }]}>
                        {m.title} ({m.days} gün)
                      </Text>
                      <Text style={[styles.descBody, { color: colors.textMuted }]}>
                        {m.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          <Button
            title="İlerlemeni Görüntüle"
            onPress={() => {
              haptics.tapLight();
              router.push("/progress");
            }}
            variant="secondary"
            fullWidth
            leftIcon="trending-up"
          />
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
    padding: 20,
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
    backgroundColor: "rgba(255,208,116,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,208,116,0.36)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FFD074",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginBottom: 6 },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroStatTotal: { color: "rgba(255,255,255,0.6)", fontSize: 18, fontWeight: "700" },
  heroStatLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  cardSpacing: { marginBottom: 14 },
  nextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  nextLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  nextTitle: { fontSize: 22, fontWeight: "900", marginBottom: 2 },
  nextDays: { fontSize: 13, fontWeight: "700", marginBottom: 12 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },

  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  badgeCard: {
    width: "31%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  badgeMedal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  badgeTitle: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  badgeDays: { fontSize: 10, fontWeight: "600" },
  earnedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  earnedText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },

  listTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  descList: { gap: 10 },
  descRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  descIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  descText: { flex: 1 },
  descTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  descBody: { fontSize: 12, lineHeight: 17 },
});
