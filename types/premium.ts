/**
 * Premium domain model — feature gate & server-authoritative state.
 * Premium = yetki katmanı, sadece bir sayfa değil.
 */

export type PremiumSource =
  | "trial"
  | "subscription_monthly"
  | "subscription_yearly"
  | "lifetime"
  | "code"
  | "admin";

/** Client-held cache of premium state. Server is source of truth. */
export type PremiumState = {
  isActive: boolean;
  source: PremiumSource | null;
  startedAt: number | null;
  expiresAt: number | null;
  trialEndsAt: number | null;
  features: string[];
  lastSync: number;
};

/** Feature gate keys — kontrol: hasFeature("blocker") */
export const PREMIUM_FEATURES = {
  blocker: "blocker",
  live_support: "live_support",
  advanced_stats: "advanced_stats",
  premium_sessions: "premium_sessions",
  premium_insights: "premium_insights",
  premium_ai_features: "premium_ai_features",
} as const;

export type PremiumFeatureId = keyof typeof PREMIUM_FEATURES;

/** Human-readable feature labels for UI */
export const PREMIUM_FEATURE_LABELS: Record<PremiumFeatureId, string> = {
  blocker: "Kumar engelleyici",
  live_support: "Canlı destek",
  advanced_stats: "Gelişmiş istatistikler",
  premium_sessions: "Premium seanslar",
  premium_insights: "Premium içgörüler",
  premium_ai_features: "Yapay ANTİ premium",
};

export const DEFAULT_PREMIUM_STATE: PremiumState = {
  isActive: false,
  source: null,
  startedAt: null,
  expiresAt: null,
  trialEndsAt: null,
  features: [],
  lastSync: 0,
};

/** API: GET /premium/status response */
export type PremiumStatusResponse = {
  ok: boolean;
  state: PremiumState;
};

/** API: POST /premium/sync — client sends local state, server returns authoritative */
export type PremiumSyncRequest = {
  localState: PremiumState;
};
export type PremiumSyncResponse = {
  ok: boolean;
  state: PremiumState;
};

/** API: POST /premium/activate — code or receipt activation */
export type PremiumActivateRequest = {
  code?: string;
  receipt?: string;
  platform?: "ios" | "android";
};
export type PremiumActivateResponse = {
  ok: boolean;
  state: PremiumState;
  error?: string;
};

/** API: POST /premium/restore — restore purchases */
export type PremiumRestoreRequest = {
  receipt?: string;
  platform?: "ios" | "android";
};
export type PremiumRestoreResponse = {
  ok: boolean;
  state: PremiumState;
  error?: string;
};
