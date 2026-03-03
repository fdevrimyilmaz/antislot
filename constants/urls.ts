/**
 * Centralized URLs for store compliance and app links.
 * Keep this aligned with app.json expo.extra and store-metadata URLs.
 */

const DEFAULT_WEBSITE_BASE_URL = "https://antislot-legal.vercel.app";

function normalizeBaseUrl(value?: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return DEFAULT_WEBSITE_BASE_URL;
  return trimmed.replace(/\/+$/, "");
}

export const SUPPORT_EMAIL = "support@antislot.app";

/** Base URL for legal/support pages. Override in EAS with EXPO_PUBLIC_WEBSITE_BASE_URL if needed. */
export const WEBSITE_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_WEBSITE_BASE_URL);

/** Privacy Policy URL required for App Store Connect and Play Console. */
export const PRIVACY_POLICY_URL = `${WEBSITE_BASE_URL}/privacy`;

/** Terms URL required/recommended for stores. */
export const TERMS_URL = `${WEBSITE_BASE_URL}/terms`;

/** Public support page URL. */
export const SUPPORT_URL = `${WEBSITE_BASE_URL}/support`;
