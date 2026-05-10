import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function TabLayout() {
  const { colors } = useTheme();
  const tint = colors.primary;
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // ✅ Sekme çubuğu görünümünü stabilize ediyoruz (iOS üst üste binme/bulanıklık etkisini keser)
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: colors.textMuted,

        // ✅ Sekme çubuğu arka planını tamamen opak yap (iOS bulanıklık/üst üste binme etkisini keser)
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 0,
          elevation: 0, // Android gölge kapat
          // iOS'ta bulanıklık/şeffaflık gibi şeyler yüzünden içerik soluk görünmesin
          shadowOpacity: 0,
          opacity: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 8,
          // iOS'ta bulanıklık efektini tamamen kapatmak için
          ...(Platform.OS === "ios" && {
            // Bulanıklık/şeffaflık efektlerini kapat
            borderTopColor: "#FFFFFF",
          }),
        },

        // ✅ Sekme çubuğu butonu sende var, aynen bırakıyoruz
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="premium-placeholder"
        options={{
          title: t.premium,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="crown.fill" color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/premium");
          },
        }}
      />

      <Tabs.Screen
        name="ai-placeholder"
        options={{
          title: t.ai,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="brain.head.profile" color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/ai");
          },
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: t.explore,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="therapy"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

