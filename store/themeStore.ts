import * as SecureStore from "@/lib/secureStoreCompat";
import { Platform } from "react-native";

export type Theme = "twitter-blue" | "black" | "white";

const KEY = "antislot_theme";

export async function getTheme(): Promise<Theme> {
  if (Platform.OS === "web") {
    const theme = localStorage.getItem(KEY);
    if (theme === "twitter-blue" || theme === "black" || theme === "white") {
      return theme as Theme;
    }
    return "white";
  }

  const theme = await SecureStore.getItemAsync(KEY);
  if (theme === "twitter-blue" || theme === "black" || theme === "white") {
    return theme as Theme;
  }
  return "white";
}

export async function setTheme(theme: Theme) {
  if (Platform.OS === "web") {
    localStorage.setItem(KEY, theme);
    return;
  }

  await SecureStore.setItemAsync(KEY, theme);
}
