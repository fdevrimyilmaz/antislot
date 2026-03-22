import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { router, usePathname } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalizedCopy } from "@/hooks/useLocalizedCopy";
import { getStoredUsername } from "@/store/profileStore";

const LANDING_COPY = {
  tr: {
    loading: "Topluluk yukleniyor...",
  },
  en: {
    loading: "Loading community...",
  },
} as const;

export default function CommunityLandingScreen() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const copy = useLocalizedCopy(LANDING_COPY);

  useEffect(() => {
    const path = (pathname ?? "").replace(/\/$/, "");
    if (!(path === "/community" || path === "community" || path === "")) return;

    let active = true;
    (async () => {
      const username = await getStoredUsername();
      if (!active) return;

      if (!username) {
        router.replace({
          pathname: "/community/username",
          params: { next: "/community/rooms" },
        });
        return;
      }

      router.replace("/community/rooms");
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{copy.loading}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
});
