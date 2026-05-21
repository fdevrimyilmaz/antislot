import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Appearance, type ColorSchemeName } from "react-native";

import {
  Theme,
  ThemePreference,
  getThemePreference,
  setThemePreference,
} from "@/store/themeStore";

type GradientColors = readonly [string, string, ...string[]];

export interface ThemeColors {
  background: string;
  backgroundGradient: GradientColors;
  heroGradient: GradientColors;
  cardGradient: GradientColors;
  text: string;
  textMuted: string;
  card: string;
  cardBorder: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
}

export type ThemeOption = {
  id: Theme;
  label: string;
  emoji: string;
  description: string;
  /** Used by the gallery to bucket light/dark themes. */
  mode: "light" | "dark";
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "white",
    label: "Arctic Light",
    emoji: "⚪",
    description: "Temiz ve ferah mavi tonlar.",
    mode: "light",
  },
  {
    id: "twitter-blue",
    label: "Ocean Pulse",
    emoji: "🔵",
    description: "Canlı mavi vurgu ve net kontrast.",
    mode: "light",
  },
  {
    id: "rose",
    label: "Rose Garden",
    emoji: "🌸",
    description: "Sıcak pembe ve gül tonları.",
    mode: "light",
  },
  {
    id: "sunset",
    label: "Sunset Ember",
    emoji: "🟠",
    description: "Sıcak mercan ve altın geçişler.",
    mode: "light",
  },
  {
    id: "forest",
    label: "Forest Calm",
    emoji: "🟢",
    description: "Doğal yeşil ve sakin bir atmosfer.",
    mode: "light",
  },
  {
    id: "black",
    label: "Carbon",
    emoji: "⚫",
    description: "Minimal, koyu ve odaklı görünüm.",
    mode: "dark",
  },
  {
    id: "mono-dark",
    label: "Mono Dark",
    emoji: "⬛",
    description: "AMOLED dostu pür siyah, monokrom vurgular.",
    mode: "dark",
  },
  {
    id: "midnight",
    label: "Midnight Neon",
    emoji: "🟣",
    description: "Gece tonları ve modern neon etki.",
    mode: "dark",
  },
  {
    id: "aurora",
    label: "Aurora",
    emoji: "🌌",
    description: "Mor-mavi-turkuaz aurora geçişleri.",
    mode: "dark",
  },
  {
    id: "ocean-deep",
    label: "Ocean Deep",
    emoji: "🌊",
    description: "Derin deniz mavisi, turkuaz vurgu.",
    mode: "dark",
  },
];

const themeColors: Record<Theme, ThemeColors> = {
  white: {
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
  },
  "twitter-blue": {
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
  },
  black: {
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
  },
  sunset: {
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
  },
  forest: {
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
  },
  midnight: {
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
  },
  rose: {
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
  },
  "mono-dark": {
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
  },
  aurora: {
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
  },
  "ocean-deep": {
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
  },
};

/**
 * When the user picks "system", we fall back to one of these depending on
 * the device color scheme. Keeping it explicit makes it predictable and
 * easy to swap (e.g. "use Mono Dark instead of Midnight for system-dark").
 */
const SYSTEM_LIGHT_FALLBACK: Theme = "white";
const SYSTEM_DARK_FALLBACK: Theme = "midnight";

function resolveTheme(preference: ThemePreference, scheme: ColorSchemeName): Theme {
  if (preference === "system") {
    return scheme === "dark" ? SYSTEM_DARK_FALLBACK : SYSTEM_LIGHT_FALLBACK;
  }
  return preference;
}

interface ThemeContextType {
  /** Resolved theme actually applied (never "system"). */
  theme: Theme;
  /** User's stored preference (may be "system"). */
  preference: ThemePreference;
  /** Resolved color tokens. */
  colors: ThemeColors;
  /** Update the preference (and persist). */
  setPreference: (pref: ThemePreference) => Promise<void>;
  /** Back-compat: sets preference to a concrete theme. */
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    (async () => {
      const stored = await getThemePreference();
      setPreferenceState(stored);
    })();
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const handleSetPreference = async (pref: ThemePreference) => {
    await setThemePreference(pref);
    setPreferenceState(pref);
  };

  const handleSetTheme = async (next: Theme) => {
    await handleSetPreference(next);
  };

  const resolved = resolveTheme(preference, systemScheme);

  return (
    <ThemeContext.Provider
      value={{
        theme: resolved,
        preference,
        colors: themeColors[resolved],
        setPreference: handleSetPreference,
        setTheme: handleSetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }
  return context;
}
