const normalizeFlag = (value: string | undefined, defaultWhenMissing = false): boolean => {
  if (!value) return defaultWhenMissing;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

/** SMS role (filter, etc.) - default disabled for store policy safety */
export const ENABLE_SMS_ROLE = normalizeFlag(
  process.env.EXPO_PUBLIC_ENABLE_SMS_ROLE,
  false
);

/** In-app purchase - default disabled until store products are live */
export const ENABLE_IAP = normalizeFlag(
  process.env.EXPO_PUBLIC_ENABLE_IAP,
  false
);

/** Premium code activation UI - default disabled for IAP-only release */
export const ENABLE_PREMIUM_CODE_ACTIVATION = normalizeFlag(
  process.env.EXPO_PUBLIC_ENABLE_PREMIUM_CODE_ACTIVATION,
  false
);

/** Notifications - default disabled until push credentials are configured */
export const ENABLE_NOTIFICATIONS = normalizeFlag(
  process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS,
  false
);

/**
 * Premium free mode override.
 * Security default is false, so premium gates stay locked unless this is explicitly enabled.
 */
export const PREMIUM_FREE_FOR_NOW =
  process.env.EXPO_PUBLIC_PREMIUM_FREE_FOR_NOW === "true";
