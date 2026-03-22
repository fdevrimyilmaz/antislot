export type UiLanguage = "tr" | "en";

export function normalizeUiLanguage(
  value: unknown,
  fallback: UiLanguage = "en"
): UiLanguage {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const base = trimmed.toLowerCase().split(/[-_]/)[0];
  if (base === "tr") return "tr";
  if (base === "en") return "en";
  return "en";
}

