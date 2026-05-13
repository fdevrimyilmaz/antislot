import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { haptics } from "@/services/haptics";
import { reportError } from "@/services/monitoring";
import { getPremiumState } from "@/store/premiumStore";
import {
  INTERACTIVE_MODULES,
  type InteractiveModule,
  type ModuleFocus,
} from "../data/interactiveModules";

const FOCUS_OPTIONS: { id: ModuleFocus | "all"; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "psikolojik", label: "Psikolojik" },
  { id: "finansal", label: "Finansal" },
  { id: "deger", label: "Değer" },
];

const TONE_GRADIENTS: Record<
  InteractiveModule["tone"],
  readonly [string, string, ...string[]]
> = {
  coral: ["#B14040", "#A03838", "#8E2F2F"],
  teal: ["#2A6B6E", "#1F5A5D", "#194B4E"],
  indigo: ["#2B4A82", "#22407A", "#1B3568"],
  emerald: ["#1F6B4E", "#185A41", "#134B36"],
  ocean: ["#264D8A", "#1F4378", "#173460"],
  slate: ["#4A5566", "#3F4858", "#353C49"],
  amber: ["#8B6614", "#7A580F", "#6A4B0B"],
  violet: ["#4A4F8A", "#3F4477", "#353A66"],
};

export default function ModulesIndex() {
  const { colors } = useTheme();
  const [focus, setFocus] = useState<ModuleFocus | "all">("all");
  const [premiumActive, setPremiumActive] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const state = await getPremiumState();
        if (active) setPremiumActive(state.isActive);
      } catch (error) {
        reportError(error, { scope: "modules.premium", level: "warning" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (focus === "all") return INTERACTIVE_MODULES;
    return INTERACTIVE_MODULES.filter((m) => m.focus === focus);
  }, [focus]);

  const handleOpen = (module: InteractiveModule) => {
    haptics.tapLight();
    // Cast: modules/* paths are not in the build-time typed-routes map
    // until the dev server has indexed them on first run.
    router.push(module.route as never);
  };

  const handleFocus = (next: ModuleFocus | "all") => {
    haptics.selection();
    setFocus(next);
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Modüller
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Düşünmek, hesaplamak, görmek için kısa interaktif egzersizler.
          </Text>

          {/* Stats */}
          <Card padding={0} style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {INTERACTIVE_MODULES.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Modül</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {INTERACTIVE_MODULES.filter((m) => !m.premium).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Ücretsiz</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {INTERACTIVE_MODULES.filter((m) => m.premium).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Premium</Text>
              </View>
            </View>
          </Card>

          {/* Focus filter */}
          <View
            style={[
              styles.segmented,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            {FOCUS_OPTIONS.map((opt) => {
              const isActive = focus === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.segmentBtn,
                    isActive && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleFocus(opt.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={opt.label}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: isActive ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Module list */}
          <View style={styles.list}>
            {filtered.map((module) => {
              const locked = module.premium && !premiumActive;
              return (
                <TouchableOpacity
                  key={module.id}
                  activeOpacity={0.88}
                  onPress={() => handleOpen(module)}
                  accessibilityRole="button"
                  accessibilityLabel={`${module.title}: ${module.subtitle}`}
                  accessibilityState={{ disabled: false }}
                >
                  <LinearGradient
                    colors={TONE_GRADIENTS[module.tone]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.moduleCard}
                  >
                    <View style={styles.moduleDecor} pointerEvents="none">
                      <Ionicons
                        name={module.decorIcon as React.ComponentProps<typeof Ionicons>["name"]}
                        size={120}
                        color="rgba(255,255,255,0.14)"
                      />
                    </View>

                    <View style={styles.moduleHeader}>
                      <View style={styles.moduleIconBubble}>
                        <Ionicons
                          name={module.icon as React.ComponentProps<typeof Ionicons>["name"]}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={styles.modulePills}>
                        <View style={styles.durationPill}>
                          <Ionicons name="time" size={10} color="#FFFFFF" />
                          <Text style={styles.durationText}>{module.durationLabel}</Text>
                        </View>
                        {module.premium ? (
                          <View
                            style={[
                              styles.premiumPill,
                              {
                                backgroundColor: locked
                                  ? "rgba(255, 208, 116, 0.22)"
                                  : "rgba(255, 208, 116, 0.32)",
                              },
                            ]}
                          >
                            <Ionicons
                              name={locked ? "lock-closed" : "diamond"}
                              size={10}
                              color="#FFD074"
                            />
                            <Text style={styles.premiumPillText}>
                              {locked ? "KİLİTLİ" : "PREMIUM"}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
                    <Text style={styles.moduleDescription} numberOfLines={3}>
                      {module.description}
                    </Text>

                    <View style={styles.moduleFooter}>
                      <Text style={styles.moduleCta}>
                        {locked ? "Premium ile aç" : "Başla"}
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
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

  title: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },

  statsCard: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  statBox: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statDivider: { width: 1, height: 32 },

  segmented: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentText: { fontSize: 12, fontWeight: "700" },

  list: { gap: 14 },
  moduleCard: {
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  moduleDecor: {
    position: "absolute",
    right: -20,
    bottom: -20,
  },
  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  moduleIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  modulePills: { flexDirection: "row", gap: 6 },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  premiumPillText: {
    color: "#FFD074",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  moduleTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  moduleSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  moduleDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  moduleFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moduleCta: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
