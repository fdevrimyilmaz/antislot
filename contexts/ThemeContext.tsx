import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Theme, getTheme, setTheme } from "@/store/themeStore";

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
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "white",
    label: "Arctic Light",
    emoji: "⚪",
    description: "Temiz ve ferah mavi tonlar.",
  },
  {
    id: "twitter-blue",
    label: "Ocean Pulse",
    emoji: "🔵",
    description: "Canli mavi vurgu ve net kontrast.",
  },
  {
    id: "black",
    label: "Carbon",
    emoji: "⚫",
    description: "Minimal, koyu ve odakli gorunum.",
  },
  {
    id: "sunset",
    label: "Sunset Ember",
    emoji: "🟠",
    description: "Sicak mercan ve altin gecisler.",
  },
  {
    id: "forest",
    label: "Forest Calm",
    emoji: "🟢",
    description: "Dogal yesil ve sakin bir atmosfer.",
  },
  {
    id: "midnight",
    label: "Midnight Neon",
    emoji: "🟣",
    description: "Gece tonlari ve modern neon etki.",
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
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("white");

  useEffect(() => {
    (async () => {
      const currentTheme = await getTheme();
      setThemeState(currentTheme);
    })();
  }, []);

  const handleSetTheme = async (newTheme: Theme) => {
    await setTheme(newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        colors: themeColors[theme],
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
