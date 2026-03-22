import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Theme, getTheme, setTheme } from "@/store/themeStore";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  colors: {
    background: string;
    backgroundGradient: string[];
    text: string;
    textSecondary: string;
    card: string;
    primary: string;
    secondary: string;
    border: string;
    disabled: string;
    warning?: string;
  };
}

const themeColors = {
  "twitter-blue": {
    background: "#0B1E2A",
    backgroundGradient: ["#0B1E2A", "#0F2E40", "#0F5B7A"],
    text: "#F8FAFC",
    textSecondary: "rgba(248, 250, 252, 0.72)",
    card: "#112739",
    primary: "#59B2D9",
    secondary: "#1F7EA8",
    border: "rgba(248, 250, 252, 0.12)",
    disabled: "rgba(248, 250, 252, 0.28)",
    warning: "#F59E0B",
  },
  "black": {
    background: "#0B0D12",
    backgroundGradient: ["#0B0D12", "#121826", "#1B2434"],
    text: "#F8FAFC",
    textSecondary: "rgba(248, 250, 252, 0.72)",
    card: "#111827",
    primary: "#7AA2C6",
    secondary: "#4B6A88",
    border: "rgba(248, 250, 252, 0.1)",
    disabled: "rgba(248, 250, 252, 0.24)",
    warning: "#F97316",
  },
  "white": {
    background: "#F6F7FB",
    backgroundGradient: ["#F6F7FB", "#EEF3F8", "#E8F0F5"],
    text: "#0F172A",
    textSecondary: "#64748B",
    card: "#FFFFFF",
    primary: "#0F5B7A",
    secondary: "#2F80B5",
    border: "#E2E8F0",
    disabled: "#CBD5E1",
    warning: "#D97706",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("white");

  useEffect(() => {
    (async () => {
      const currentTheme = await getTheme();
      setThemeState(currentTheme);
    })();
  }, []);

  const handleSetTheme = useCallback(async (newTheme: Theme) => {
    await setTheme(newTheme);
    setThemeState(newTheme);
  }, []);

  const colors = useMemo(() => themeColors[theme], [theme]);
  const value = useMemo(
    () => ({
      theme,
      setTheme: handleSetTheme,
      colors,
    }),
    [theme, handleSetTheme, colors]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme, ThemeProvider içinde kullanılmalıdır.");
  }
  return context;
}
