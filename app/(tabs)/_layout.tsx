import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

type TabIconViewProps = {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
  isDark: boolean;
  activeRing: string;
  idleRing: string;
  activeGradient: [string, string, ...string[]];
};

function TabIconView({
  name,
  color,
  focused,
  isDark,
  activeRing,
  idleRing,
  activeGradient,
}: TabIconViewProps) {
  return (
    <View
      style={[
        styles.iconShell,
        {
          borderColor: focused ? activeRing : idleRing,
          backgroundColor: focused
            ? isDark
              ? "rgba(15, 23, 42, 0.5)"
              : "rgba(15, 23, 42, 0.08)"
            : "transparent",
        },
      ]}
    >
      {focused ? (
        <LinearGradient
          colors={activeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Ionicons name={name} size={18} color="#F8FAFC" />
        </LinearGradient>
      ) : (
        <Ionicons name={name} size={18} color={color} />
      )}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  const isDark = colorScheme === "dark";
  const tabBackground = Colors[colorScheme ?? "light"].background;
  const tabBorder = isDark ? "rgba(248, 250, 252, 0.12)" : "rgba(15, 23, 42, 0.08)";
  const activeRing = isDark ? "rgba(139, 196, 221, 0.38)" : "rgba(15, 91, 122, 0.3)";
  const idleRing = isDark ? "rgba(248, 250, 252, 0.14)" : "rgba(148, 163, 184, 0.3)";
  const activeGradient: [string, string, ...string[]] = isDark
    ? ["#1A476D", "#2A6597"]
    : ["#0F5B7A", "#2A6F99"];
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: isDark ? "rgba(248,250,252,0.62)" : "#64748B",
        tabBarStyle: {
          backgroundColor: tabBackground,
          borderTopWidth: 1,
          borderTopColor: tabBorder,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          elevation: 14,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.26 : 0.1,
          shadowRadius: 16,
          opacity: 1,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 8,
          paddingHorizontal: 10,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color, focused }) => (
            <TabIconView
              name="home-outline"
              color={color}
              focused={focused}
              isDark={isDark}
              activeRing={activeRing}
              idleRing={idleRing}
              activeGradient={activeGradient}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="premium-tab"
        options={{
          title: t.premium,
          tabBarIcon: ({ color, focused }) => (
            <TabIconView
              name="diamond-outline"
              color={color}
              focused={focused}
              isDark={isDark}
              activeRing={activeRing}
              idleRing={idleRing}
              activeGradient={activeGradient}
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
        name="ai-tab"
        options={{
          title: t.ai,
          tabBarIcon: ({ color, focused }) => (
            <TabIconView
              name="sparkles-outline"
              color={color}
              focused={focused}
              isDark={isDark}
              activeRing={activeRing}
              idleRing={idleRing}
              activeGradient={activeGradient}
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
            <TabIconView
              name="compass-outline"
              color={color}
              focused={focused}
              isDark={isDark}
              activeRing={activeRing}
              idleRing={idleRing}
              activeGradient={activeGradient}
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
  tabItem: {
    paddingTop: 2,
  },
  tabIcon: {
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  iconShell: {
    width: 30,
    height: 30,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGradient: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
