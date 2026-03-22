/**
 * Premium feature-gate hook.
 * Use: if (!hasFeature("blocker")) showPremiumGate();
 * When PREMIUM_FREE_FOR_NOW is true, everyone is treated as premium.
 */

import { PREMIUM_FREE_FOR_NOW } from "@/constants/featureFlags";
import { usePremiumStore } from "@/store/premiumStore";
import type { PremiumFeatureId } from "@/types/premium";

export function usePremium() {
  const state = usePremiumStore((s) => s.state);
  const hasFeatureStore = usePremiumStore((s) => s.hasFeature);
  const loading = usePremiumStore((s) => s.loading);
  const syncError = usePremiumStore((s) => s.syncError);

  const isActive = PREMIUM_FREE_FOR_NOW || state.isActive;
  const hasFeature = (featureName: PremiumFeatureId | string) =>
    PREMIUM_FREE_FOR_NOW || hasFeatureStore(featureName);

  return {
    isActive,
    hasFeature,
    source: state.source,
    expiresAt: state.expiresAt,
    trialEndsAt: state.trialEndsAt,
    features: state.features,
    lastSync: state.lastSync,
    loading,
    syncError,
  };
}
