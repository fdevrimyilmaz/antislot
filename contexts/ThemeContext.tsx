import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Theme, getTheme, setTheme } from "@/store/themeStore";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  colors: {
    background: string;
    backgroundGradient: string[];
    text: string;
    card: string;
    primary: string;
    secondary: string;
  };
}

const themeColors = {
  "twitter-blue": {
    background: "#1DA1F2",
    backgroundGradient: ["#1DA1F2", "#0d8bd9", "#0099FF"],
    text: "#FFFFFF",
    card: "#FFFFFF",
    primary: "#1DA1F2",
    secondary: "#0d8bd9",
  },
  "black": {
    background: "#000000",
    backgroundGradient: ["#000000", "#1a1a1a", "#2d2d2d"],
    text: "#FFFFFF",
    card: "#1a1a1a",
    primary: "#333333",
    secondary: "#4a4a4a",
  },
  "white": {
    background: "#FFFFFF",
    backgroundGradient: ["#F4F9FF", "#E8F4FF", "#D6E9FF"],
    text: "#1D4C72",
    card: "#FFFFFF",
    primary: "#1D4C72",
    secondary: "#2A5F8F",
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
    throw new Error("useTheme, ThemeProvider içinde kullanılmalıdır.");
  }
  return context;
}
