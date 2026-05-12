import { type Href, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  isOnboardingDone,
  hasWelcomeBeenShown,
  setWelcomeShown,
} from "@/store/onboardingFlag";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProgressStore } from "@/store/progressStore";
import { useUserAddictionsStore } from "@/store/userAddictionsStore";
import { useToast } from "@/components/ui/toast";
import { ThemeTexture } from "@/components/theme-texture";
import { HomeCard, type HomeCardTone } from "@/components/ui/home-card";
import { DailyStreakCard } from "@/components/ui/daily-streak-card";
import { FloatingSOSButton } from "@/components/ui/floating-sos-button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { SavingsWidget, DailyCheckinWidget } from "@/components/ui/insight-widgets";

type ModuleDef = {
  key: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  decorativeIcon: React.ComponentProps<typeof Ionicons>["name"];
  tone: HomeCardTone;
  route: Href;
};

function buildMotivation(days: number): { headline: string; message: string } {
  if (days <= 0) {
    return {
      headline: "Bugün yeni bir başlangıç",
      message: "İlk adımı attın. 10 dakika bile çok değerli.",
    };
  }
  if (days < 7) {
    return {
      headline: `${days}. gün — ivme yakalanıyor`,
      message: "Küçük zaferler birikiyor. Bugüne bir nefes daha ekle.",
    };
  }
  if (days < 30) {
    return {
      headline: "Streak büyüyor",
      message: "Bir hafta arkanda. Bedenin ve zihnin sana teşekkür ediyor.",
    };
  }
  if (days < 90) {
    return {
      headline: "Yeni alışkanlık şekilleniyor",
      message: "30 günü geçtin. Beyin yolakları yeniden yazılıyor.",
    };
  }
  return {
    headline: "Toparlanmanın derin evresi",
    message: "İlerlemeni koru — bu noktaya gelen az insan var.",
  };
}

export default function HomeScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const toast = useToast();

  const { hydrated } = useUserAddictionsStore();
  const gamblingFreeDays = useProgressStore((state) => state.gamblingFreeDays);
  const progressHydrated = useProgressStore((state) => state.hydrated);

  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const onboardingDone = await isOnboardingDone();
      setDone(onboardingDone);
      setLoading(false);

      if (!onboardingDone) {
        router.replace("/onboarding");
        return;
      }

      const welcomeShown = await hasWelcomeBeenShown();
      if (!welcomeShown) {
        await setWelcomeShown();
        toast.info(t.welcomeDescription, t.welcomeToAntislot);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const safeDays = Number.isFinite(gamblingFreeDays) ? gamblingFreeDays : 0;
  const motivation = useMemo(() => buildMotivation(safeDays), [safeDays]);

  const modules = useMemo<ModuleDef[]>(
    () => [
      {
        key: "sos",
        title: "Dürtü Desteği",
        subtitle: "Yönlendirmeli müdahalelerle",
        icon: "pulse",
        decorativeIcon: "pulse-outline",
        tone: "coral",
        route: "/sos",
      },
      {
        key: "blocker",
        title: "Para Koruma",
        subtitle: "Bugün param güvende mi?",
        icon: "shield-checkmark",
        decorativeIcon: "shield-outline",
        tone: "teal",
        route: "/blocker",
      },
      {
        key: "therapy",
        title: "Destek Seansları",
        subtitle: "Yönlendirmeli",
        icon: "medkit",
        decorativeIcon: "medkit-outline",
        tone: "indigo",
        route: "/therapy",
      },
      {
        key: "mindfulness",
        title: "Farkındalık",
        subtitle: "Seanslar",
        icon: "leaf",
        decorativeIcon: "leaf-outline",
        tone: "emerald",
        route: "/mindfulness",
      },
      {
        key: "progress",
        title: "İlerleme",
        subtitle: "Şimdi incele",
        icon: "bar-chart",
        decorativeIcon: "stats-chart",
        tone: "ocean",
        route: "/progress",
      },
      {
        key: "sms-filter",
        title: "Spam Tanıyıcı",
        subtitle: "Şüpheli mesajı yapıştır, sınıflandır",
        icon: "mail-unread",
        decorativeIcon: "mail-outline",
        tone: "slate",
        route: "/sms-filter",
      },
      {
        key: "facts",
        title: "Gerçekler",
        subtitle: "Online kumarın gerçek yüzü",
        icon: "eye",
        decorativeIcon: "eye-outline",
        tone: "amber",
        route: "/facts",
      },
      {
        key: "diary",
        title: "Günlük",
        subtitle: "Özel günlüğün",
        icon: "book",
        decorativeIcon: "book-outline",
        tone: "violet",
        route: "/diary",
      },
    ],
    []
  );

  if (loading || !done || !hydrated || !progressHydrated) {
    return (
      <LinearGradient
        colors={colors.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loader}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.homeContainer}
    >
      <ThemeTexture primary={colors.primary} secondary={colors.secondary} accent={colors.accent} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentWrapper}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand pill */}
          <View style={styles.brandRow}>
            <LinearGradient
              colors={colors.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandPill}
            >
              <View style={[styles.brandBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
                <Ionicons name="ban" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.brandText} accessibilityRole="header">
                ANTİ-<Text style={styles.brandAccent}>SLOT</Text>
              </Text>
            </LinearGradient>
          </View>

          {/* Language selector */}
          <View style={styles.languageWrap}>
            <LanguageSelector variant="row" />
          </View>

          {/* Daily streak hero */}
          <View style={styles.heroWrap}>
            <DailyStreakCard
              days={safeDays}
              headline={motivation.headline}
              message={motivation.message}
            />
          </View>

          {/* Insight widgets: savings + daily check-in */}
          <View style={styles.insightRow}>
            <SavingsWidget days={safeDays} />
            <DailyCheckinWidget />
          </View>

          {/* Module grid */}
          <View style={styles.grid}>
            {modules.map((m) => (
              <HomeCard
                key={m.key}
                title={m.title}
                subtitle={m.subtitle}
                icon={m.icon}
                decorativeIcon={m.decorativeIcon}
                tone={m.tone}
                onPress={() => router.push(m.route)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating SOS — always within thumb reach */}
      <FloatingSOSButton />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  homeContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
  },
  brandRow: {
    alignItems: "center",
    marginBottom: 18,
    marginTop: 4,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  brandBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
    color: "#FFFFFF",
  },
  brandAccent: {
    color: "#FFB366",
  },
  languageWrap: {
    marginBottom: 14,
  },
  heroWrap: {
    marginBottom: 14,
  },
  insightRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
