import * as SecureStore from "expo-secure-store";

export type Theme =
  | "white"
  | "twitter-blue"
  | "black"
  | "sunset"
  | "forest"
  | "midnight"
  | "rose"
  | "mono-dark"
  | "aurora"
  | "ocean-deep"
  | "lunar-calm";

/**
 * What the user picked in settings.
 *   "system"      → follow device color scheme (light/dark)
 *   <Theme>       → pin to a specific palette
 *
 * The resolved `theme` (after applying system follow) is what the rest of
 * the app uses; this preference is only what we persist.
 */
export type ThemePreference = Theme | "system";

const KEY = "antislot_theme";

const SUPPORTED_THEMES: Theme[] = [
  "white",
  "twitter-blue",
  "black",
  "sunset",
  "forest",
  "midnight",
  "rose",
  "mono-dark",
  "aurora",
  "ocean-deep",
  "lunar-calm",
];

const SUPPORTED_PREFERENCES: ThemePreference[] = ["system", ...SUPPORTED_THEMES];

function isThemePreference(value: string | null): value is ThemePreference {
  if (!value) return false;
  return (SUPPORTED_PREFERENCES as string[]).includes(value);
}

/**
 * Returns the user's stored preference. Defaults to "system" so dark-mode
 * users get a dark palette on first launch without doing anything.
 */
export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const stored = await SecureStore.getItemAsync(KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    // ignore
  }
  return "system";
}

export async function setThemePreference(pref: ThemePreference): Promise<void> {
  await SecureStore.setItemAsync(KEY, pref);
}

// --- Back-compat aliases for older imports ---
export async function getTheme(): Promise<Theme> {
  const pref = await getThemePreference();
  if (pref === "system") return "white";
  return pref;
}

export async function setTheme(theme: Theme): Promise<void> {
  await setThemePreference(theme);
}
