import * as SecureStore from "expo-secure-store";

export type Theme = "twitter-blue" | "black" | "white";

const KEY = "antislot_theme";

export async function getTheme(): Promise<Theme> {
  const theme = await SecureStore.getItemAsync(KEY);
  if (theme === "twitter-blue" || theme === "black" || theme === "white") {
    return theme as Theme;
  }
  // Tema ayarlı değilse varsayılan beyaz
  return "white";
}

export async function setTheme(theme: Theme) {
  await SecureStore.setItemAsync(KEY, theme);
}
