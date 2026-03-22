import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Stack } from "expo-router";

export default function ExploreLayout() {
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: t.generalBack,
        headerTitleStyle: { fontSize: 17, fontWeight: "600", color: colors.text },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        presentation: "card",
      }}
    >
      <Stack.Screen name="future-simulator" options={{ title: t.exploreModules.futureSimulator.title }} />
      <Stack.Screen name="invisible-cost" options={{ title: t.exploreModules.invisibleCost.title }} />
      <Stack.Screen name="brain-map" options={{ title: t.exploreModules.brainMap.title }} />
      <Stack.Screen name="identity-mode" options={{ title: t.exploreModules.identityMode.title }} />
      <Stack.Screen name="loss-counter" options={{ title: t.exploreModules.lossCounter.title }} />
      <Stack.Screen name="urge-masks" options={{ title: t.exploreModules.urgeMasks.title }} />
      <Stack.Screen name="reality-feed" options={{ title: t.exploreModules.realityFeed.title }} />
      <Stack.Screen name="alternative-life" options={{ title: t.exploreModules.alternativeLife.title }} />
    </Stack>
  );
}
