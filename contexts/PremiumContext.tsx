import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearPremium,
  getPremiumState,
  setPremiumActive,
  type PremiumState,
} from "@/store/premiumStore";

type PremiumContextValue = {
  state: PremiumState | null;
  loading: boolean;
  isPremium: boolean;
  refresh: () => Promise<void>;
  activateCode: () => Promise<void>;
  clear: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PremiumState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const next = await getPremiumState();
    setState(next);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const next = await getPremiumState();
        if (mounted) {
          setState(next);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<PremiumContextValue>(
    () => ({
      state,
      loading,
      isPremium: Boolean(state?.isActive),
      refresh,
      activateCode: async () => {
        const next = await setPremiumActive("code");
        setState(next);
      },
      clear: async () => {
        const next = await clearPremium();
        setState(next);
      },
    }),
    [loading, state]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremiumContext(): PremiumContextValue {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremiumContext must be used inside PremiumProvider");
  }
  return context;
}
