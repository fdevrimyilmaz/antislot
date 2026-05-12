import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/haptic-tab";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
};

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={focused ? 26 : 24} color={color} />
      {focused ? <View style={[styles.activeDot, { backgroundColor: color }]} /> : null}
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          shadowOpacity: 0,
          opacity: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 8,
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="premium-placeholder"
        options={{
          title: t.premium,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "diamond" : "diamond-outline"}
              color={color}
              focused={focused}
            />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "sparkles" : "sparkles-outline"}
              color={color}
              focused={focused}
            />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "compass" : "compass-outline"}
              color={color}
              focused={focused}
            />
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

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
