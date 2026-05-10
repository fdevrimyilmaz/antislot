import * as SecureStore from "expo-secure-store";

export type Theme =
  | "white"
  | "twitter-blue"
  | "black"
  | "sunset"
  | "forest"
  | "midnight";

const KEY = "antislot_theme";

const SUPPORTED_THEMES: Theme[] = [
  "white",
  "twitter-blue",
  "black",
  "sunset",
  "forest",
  "midnight",
];

function isTheme(value: string | null): value is Theme {
  if (!value) return false;
  return SUPPORTED_THEMES.includes(value as Theme);
}

export async function getTheme(): Promise<Theme> {
  const stored = await SecureStore.getItemAsync(KEY);
  if (isTheme(stored)) {
    return stored;
  }
  return "white";
}

export async function setTheme(theme: Theme) {
  await SecureStore.setItemAsync(KEY, theme);
}
