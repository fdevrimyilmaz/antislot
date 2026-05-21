import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

/**
 * Streak-milestone celebration tracker.
 *
 * Each celebration is keyed by `dayThreshold`. When the user crosses a
 * threshold, we record it here so we don't show the same celebration
 * twice. State persists to SecureStore so a relaunch right after hitting
 * a milestone doesn't pop the modal again.
 */

const STORE_KEY = "antislot_celebrations_v1";

/** Ordered ascending. The "next milestone" is the first one ≥ current streak. */
export const MILESTONE_THRESHOLDS = [1, 3, 7, 14, 30, 60, 90, 180, 365] as const;

export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number];

export type MilestoneCopy = {
  threshold: MilestoneThreshold;
  title: string;
  message: string;
  emoji: string;
};

const COPY_BY_THRESHOLD: Record<MilestoneThreshold, MilestoneCopy> = {
  1: {
    threshold: 1,
    title: "İlk gün!",
    message: "İlk adım her zaman en büyüğüdür. Bugün başladın — bu bile cesaret.",
    emoji: "🌱",
  },
  3: {
    threshold: 3,
    title: "3 gün — momentum",
    message: "İlk 72 saatte beyin yeniden öğrenmeye başlar. İçindeki ses güçleniyor.",
    emoji: "🔥",
  },
  7: {
    threshold: 7,
    title: "1 hafta!",
    message: "Yedi gün — bir alışkanlığın kırılmasının ilk gerçek eşiği. Devam et.",
    emoji: "⭐",
  },
  14: {
    threshold: 14,
    title: "2 hafta",
    message: "Dopamin temel seviyen yeniden ayarlanıyor. Uyku, odak, sakinlik geri geliyor.",
    emoji: "💎",
  },
  30: {
    threshold: 30,
    title: "1 ay temiz!",
    message: "30 gün — kalıcı sinir bağlantıları kuruluyor. Yeni bir norm yaratıyorsun.",
    emoji: "🏆",
  },
  60: {
    threshold: 60,
    title: "2 ay!",
    message: "İki ay önce hiç yapamayacağını sandığın şeyi yaptın. Sen artık başka birisin.",
    emoji: "🌟",
  },
  90: {
    threshold: 90,
    title: "90 gün — büyük dönüm",
    message: "Üç ay, bağımlılık tedavisinin altın eşiğidir. Beynin gerçekten değişti.",
    emoji: "👑",
  },
  180: {
    threshold: 180,
    title: "Yarım yıl!",
    message: "6 ay — yeni kimlik artık geçici bir hâl değil, kalıcı bir karakter.",
    emoji: "🎯",
  },
  365: {
    threshold: 365,
    title: "1 YIL!",
    message: "365 gün. Senin için söylenecek tek söz: olağanüstü. Bir yıl önce başlamıştın.",
    emoji: "🌈",
  },
};

export function getMilestoneCopy(threshold: MilestoneThreshold): MilestoneCopy {
  return COPY_BY_THRESHOLD[threshold];
}

/** The highest milestone the user has already passed at `streak` days. */
export function highestPassedMilestone(streak: number): MilestoneThreshold | null {
  let best: MilestoneThreshold | null = null;
  for (const t of MILESTONE_THRESHOLDS) {
    if (streak >= t) best = t;
    else break;
  }
  return best;
}

type StoredShape = {
  /** Last threshold the user explicitly saw a celebration for. */
  celebratedUpTo: number;
};

type StoreShape = {
  hydrated: boolean;
  celebratedUpTo: number;
  hydrate: () => Promise<void>;
  markCelebrated: (threshold: MilestoneThreshold) => Promise<void>;
};

async function persist(value: StoredShape) {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(value));
}

export const useCelebrationStore = create<StoreShape>((set, get) => ({
  hydrated: false,
  celebratedUpTo: 0,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (!raw) {
        set({ hydrated: true, celebratedUpTo: 0 });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<StoredShape>;
      const v =
        typeof parsed.celebratedUpTo === "number" && parsed.celebratedUpTo >= 0
          ? parsed.celebratedUpTo
          : 0;
      set({ hydrated: true, celebratedUpTo: v });
    } catch {
      set({ hydrated: true, celebratedUpTo: 0 });
    }
  },
  markCelebrated: async (threshold) => {
    if (get().celebratedUpTo >= threshold) return;
    await persist({ celebratedUpTo: threshold });
    set({ celebratedUpTo: threshold });
  },
}));

/**
 * Given the current streak and the last celebrated threshold, return the
 * milestone to celebrate next (or null when there's nothing new).
 */
export function pendingCelebration(
  streak: number,
  celebratedUpTo: number
): MilestoneThreshold | null {
  // We celebrate the HIGHEST passed milestone that is > celebratedUpTo —
  // jumping straight to the most impressive one if the user has been away.
  const passed = highestPassedMilestone(streak);
  if (passed === null) return null;
  if (passed <= celebratedUpTo) return null;
  return passed;
}
