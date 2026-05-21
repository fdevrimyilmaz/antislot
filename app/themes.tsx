import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Appearance,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  THEME_OPTIONS,
  useTheme,
  type ThemeColors,
  type ThemeOption,
} from "@/contexts/ThemeContext";
import type { Theme, ThemePreference } from "@/store/themeStore";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { ThemeTexture } from "@/components/theme-texture";
import { haptics } from "@/services/haptics";

// Lazy-import the palette table only for previews. Each row needs to render
// a mini gradient with the actual colors that would apply if selected, even
// when that theme isn't the active one — so we recreate a tiny palette map
// from the option metadata + a lookup against the live colors.
const PREVIEW_PALETTE: Record<Theme, ThemeColors> = {
  white: paletteFor("white"),
  "twitter-blue": paletteFor("twitter-blue"),
  rose: paletteFor("rose"),
  sunset: paletteFor("sunset"),
  forest: paletteFor("forest"),
  black: paletteFor("black"),
  "mono-dark": paletteFor("mono-dark"),
  midnight: paletteFor("midnight"),
  aurora: paletteFor("aurora"),
  "ocean-deep": paletteFor("ocean-deep"),
};

// Mirrors the table in ThemeContext.tsx for offline rendering of previews.
// Keeping it here avoids importing the private map from the context.
function paletteFor(id: Theme): ThemeColors {
  switch (id) {
    case "white":
      return {
        background: "#F3F8FF",
        backgroundGradient: ["#F7FBFF", "#EAF4FF", "#DCEBFF"] as const,
        heroGradient: ["#0F172A", "#1D4C72", "#2E6A9E"] as const,
        cardGradient: ["#FFFFFF", "#F6FAFF"] as const,
        text: "#143450",
        textMuted: "#5F7690",
        card: "#FFFFFF",
        cardBorder: "#D9E5F2",
        primary: "#1D4C72",
        secondary: "#2A5F8F",
        accent: "#4CA8FF",
        success: "#12B76A",
        warning: "#F79009",
        danger: "#D94444",
      };
    case "twitter-blue":
      return {
        background: "#EAF6FF",
        backgroundGradient: ["#F3FBFF", "#D9F2FF", "#C9E8FF"] as const,
        heroGradient: ["#0D2C44", "#1DA1F2", "#45B8FF"] as const,
        cardGradient: ["#FFFFFF", "#F1F9FF"] as const,
        text: "#0F2E45",
        textMuted: "#496980",
        card: "#FFFFFF",
        cardBorder: "#CDE6F8",
        primary: "#1DA1F2",
        secondary: "#0C8CD9",
        accent: "#37C1FF",
        success: "#12B76A",
        warning: "#FDB022",
        danger: "#E5484D",
      };
    case "rose":
      return {
        background: "#FFF1F5",
        backgroundGradient: ["#FFF5F8", "#FFE2EC", "#FFD0DD"] as const,
        heroGradient: ["#7A1F3A", "#C03964", "#E66B91"] as const,
        cardGradient: ["#FFFFFF", "#FFF5F8"] as const,
        text: "#4A1124",
        textMuted: "#8E5469",
        card: "#FFFFFF",
        cardBorder: "#F5D0DC",
        primary: "#C8336B",
        secondary: "#A6275A",
        accent: "#FF6F9C",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      };
    case "sunset":
      return {
        background: "#FFF4EC",
        backgroundGradient: ["#FFF7F0", "#FFE8D8", "#FFD6BF"] as const,
        heroGradient: ["#582A1D", "#C2572D", "#F08A44"] as const,
        cardGradient: ["#FFFFFF", "#FFF7F2"] as const,
        text: "#4A2416",
        textMuted: "#8F5A48",
        card: "#FFFFFF",
        cardBorder: "#F4D9CB",
        primary: "#E35D2F",
        secondary: "#C7482A",
        accent: "#FF9D4D",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      };
    case "forest":
      return {
        background: "#ECF8F1",
        backgroundGradient: ["#F4FCF7", "#E2F6EA", "#D0EFD9"] as const,
        heroGradient: ["#0E3526", "#1E6D4B", "#2E9B69"] as const,
        cardGradient: ["#FFFFFF", "#F3FBF7"] as const,
        text: "#12382A",
        textMuted: "#4D7162",
        card: "#FFFFFF",
        cardBorder: "#CEE7DA",
        primary: "#1E7A52",
        secondary: "#2C9566",
        accent: "#53C78D",
        success: "#12B76A",
        warning: "#F79009",
        danger: "#D94444",
      };
    case "black":
      return {
        background: "#0A0A0A",
        backgroundGradient: ["#0A0A0A", "#131313", "#1E1E1E"] as const,
        heroGradient: ["#1C1C1C", "#272727", "#323232"] as const,
        cardGradient: ["#171717", "#212121"] as const,
        text: "#F9FAFB",
        textMuted: "#A3A3A3",
        card: "#161616",
        cardBorder: "#2D2D2D",
        primary: "#B4B4B4",
        secondary: "#8A8A8A",
        accent: "#D1D5DB",
        success: "#34D399",
        warning: "#F59E0B",
        danger: "#F87171",
      };
    case "mono-dark":
      return {
        background: "#000000",
        backgroundGradient: ["#000000", "#050505", "#0A0A0A"] as const,
        heroGradient: ["#1A1A1A", "#2A2A2A", "#3A3A3A"] as const,
        cardGradient: ["#0F0F0F", "#1A1A1A"] as const,
        text: "#FFFFFF",
        textMuted: "#888888",
        card: "#101010",
        cardBorder: "#222222",
        primary: "#FFFFFF",
        secondary: "#CCCCCC",
        accent: "#EAEAEA",
        success: "#22C55E",
        warning: "#FBBF24",
        danger: "#EF4444",
      };
    case "midnight":
      return {
        background: "#0C1022",
        backgroundGradient: ["#11183A", "#171F4A", "#1C255A"] as const,
        heroGradient: ["#121A4B", "#273B8A", "#4A61D8"] as const,
        cardGradient: ["#1A2248", "#141C3F"] as const,
        text: "#F2F4FF",
        textMuted: "#AAB2E5",
        card: "#1A2248",
        cardBorder: "#2A3573",
        primary: "#7D93FF",
        secondary: "#5E74E8",
        accent: "#57D6FF",
        success: "#34D399",
        warning: "#FBBF24",
        danger: "#F87171",
      };
    case "aurora":
      return {
        background: "#0F0B26",
        backgroundGradient: ["#0F0B26", "#1B1240", "#241456"] as const,
        heroGradient: ["#3B1C70", "#7A1FA8", "#C04EE6"] as const,
        cardGradient: ["#1C1640", "#171132"] as const,
        text: "#F5EEFF",
        textMuted: "#AFA0D8",
        card: "#1B1640",
        cardBorder: "#3A2C75",
        primary: "#B580FF",
        secondary: "#8A5BE0",
        accent: "#5EE0C7",
        success: "#34D399",
        warning: "#FACC15",
        danger: "#F87171",
      };
    case "ocean-deep":
      return {
        background: "#0A1929",
        backgroundGradient: ["#0A1929", "#0E2540", "#13355A"] as const,
        heroGradient: ["#0E2A4A", "#0A6E8E", "#15B5D6"] as const,
        cardGradient: ["#10243F", "#0C1B30"] as const,
        text: "#E5F6FF",
        textMuted: "#8FB4CC",
        card: "#10243F",
        cardBorder: "#22416A",
        primary: "#3EC9E8",
        secondary: "#1E9DC2",
        accent: "#5EE0C7",
        success: "#34D399",
        warning: "#FACC15",
        danger: "#F87171",
      };
  }
}

export default function ThemesScreen() {
  const { preference, colors, setPreference } = useTheme();

  const { lightOptions, darkOptions } = useMemo(() => {
    return {
      lightOptions: THEME_OPTIONS.filter((o) => o.mode === "light"),
      darkOptions: THEME_OPTIONS.filter((o) => o.mode === "dark"),
    };
  }, []);

  const handleSelect = async (next: ThemePreference) => {
    if (next === preference) return;
    haptics.selection();
    await setPreference(next);
  };

  // System preview: render a side-by-side split of light + dark fallbacks
  // so users see *both* states the system option can take.
  const systemSelected = preference === "system";
  const deviceScheme = Appearance.getColorScheme();
  const systemHint =
    deviceScheme === "dark"
      ? "Şu an cihazın koyu modda — koyu paleti uyguluyoruz."
      : "Şu an cihazın açık modda — açık paleti uyguluyoruz.";

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ThemeTexture
        primary={colors.primary}
        secondary={colors.secondary}
        accent={colors.accent}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Geri</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            Tema Galerisi
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            10 hazır palet ve sistem takip seçeneği. İstediğin zaman değiştirebilirsin.
          </Text>

          {/* System option */}
          <Card style={styles.section}>
            <SectionHeader
              title="Otomatik"
              icon="contrast"
              subtitle="Cihazının açık/koyu modunu takip eder."
            />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleSelect("system")}
              accessibilityRole="radio"
              accessibilityState={{ selected: systemSelected }}
              accessibilityLabel="Sistem ayarını takip et"
              style={[
                styles.optionRow,
                {
                  backgroundColor: systemSelected
                    ? `${colors.primary}14`
                    : colors.card,
                  borderColor: systemSelected ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <SystemPreview />
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  🌓 Sistem
                </Text>
                <Text
                  style={[styles.optionHint, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {systemHint}
                </Text>
              </View>
              <Radio selected={systemSelected} colors={colors} />
            </TouchableOpacity>
          </Card>

          {/* Light themes */}
          <Card style={styles.section}>
            <SectionHeader
              title="Açık Temalar"
              icon="sunny"
              subtitle="Gün ışığında okuma için ideal."
            />
            <View style={styles.list}>
              {lightOptions.map((opt) => (
                <ThemeRow
                  key={opt.id}
                  option={opt}
                  selected={preference === opt.id}
                  activeColors={colors}
                  onPress={() => handleSelect(opt.id)}
                />
              ))}
            </View>
          </Card>

          {/* Dark themes */}
          <Card style={styles.section}>
            <SectionHeader
              title="Koyu Temalar"
              icon="moon"
              subtitle="Akşam ve düşük ışıkta gözünü yormaz."
            />
            <View style={styles.list}>
              {darkOptions.map((opt) => (
                <ThemeRow
                  key={opt.id}
                  option={opt}
                  selected={preference === opt.id}
                  activeColors={colors}
                  onPress={() => handleSelect(opt.id)}
                />
              ))}
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type ThemeRowProps = {
  option: ThemeOption;
  selected: boolean;
  activeColors: ThemeColors;
  onPress: () => void;
};

function ThemeRow({ option, selected, activeColors, onPress }: ThemeRowProps) {
  const palette = PREVIEW_PALETTE[option.id];
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.label}: ${option.description}`}
      style={[
        styles.optionRow,
        {
          backgroundColor: selected
            ? `${activeColors.primary}14`
            : activeColors.card,
          borderColor: selected ? activeColors.primary : activeColors.cardBorder,
        },
      ]}
    >
      <ThemePreview palette={palette} />
      <View style={styles.optionText}>
        <Text style={[styles.optionLabel, { color: activeColors.text }]}>
          {option.emoji} {option.label}
        </Text>
        <Text
          style={[styles.optionHint, { color: activeColors.textMuted }]}
          numberOfLines={2}
        >
          {option.description}
        </Text>
      </View>
      <Radio selected={selected} colors={activeColors} />
    </TouchableOpacity>
  );
}

function ThemePreview({ palette }: { palette: ThemeColors }) {
  return (
    <LinearGradient
      colors={palette.heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.preview}
    >
      <View style={[styles.previewDot, { backgroundColor: palette.accent }]} />
    </LinearGradient>
  );
}

function SystemPreview() {
  const lightPalette = PREVIEW_PALETTE.white;
  const darkPalette = PREVIEW_PALETTE.midnight;
  return (
    <View style={styles.systemPreview}>
      <LinearGradient
        colors={lightPalette.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.systemHalfLeft}
      />
      <LinearGradient
        colors={darkPalette.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.systemHalfRight}
      />
    </View>
  );
}

function Radio({
  selected,
  colors,
}: {
  selected: boolean;
  colors: ThemeColors;
}) {
  return (
    <View
      style={[
        styles.radioOuter,
        { borderColor: selected ? colors.primary : colors.cardBorder },
      ]}
    >
      {selected ? (
        <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 17, fontWeight: "600" },
  title: { fontSize: 30, fontWeight: "900", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 18 },
  section: { marginBottom: 14 },
  list: { gap: 10 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionText: { flex: 1, minWidth: 0 },
  optionLabel: { fontSize: 15, fontWeight: "800" },
  optionHint: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  preview: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: 6,
    overflow: "hidden",
  },
  previewDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },
  systemPreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
  },
  systemHalfLeft: { flex: 1 },
  systemHalfRight: { flex: 1 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
});
