import * as SecureStore from "expo-secure-store";

/**
 * "Pledge" = bugün için günlük taahhüt — I Am Sober pattern'i.
 * Kullanıcı her sabah uygulamayı açtığında bir tek satırlık söz verir.
 * Streak persisted, tek satırlık intention saklı tutulur.
 */

const TODAY_PLEDGE_KEY = "antislot_pledge_today";
const PLEDGE_STREAK_KEY = "antislot_pledge_streak";
const LAST_PLEDGE_DATE_KEY = "antislot_pledge_last_date";

export type PledgeRecord = {
  date: string; // YYYY-MM-DD local
  intention: string;
  createdAt: number;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getTodayPledge(): Promise<PledgeRecord | null> {
  try {
    const raw = await SecureStore.getItemAsync(TODAY_PLEDGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PledgeRecord;
    if (parsed.date !== todayKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getPledgeStreak(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(PLEDGE_STREAK_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function savePledge(intention: string): Promise<{ pledge: PledgeRecord; streak: number }> {
  const today = todayKey();
  const pledge: PledgeRecord = {
    date: today,
    intention: intention.trim(),
    createdAt: Date.now(),
  };
  await SecureStore.setItemAsync(TODAY_PLEDGE_KEY, JSON.stringify(pledge));

  // Streak — increments only if yesterday's pledge was also made.
  const lastDate = await SecureStore.getItemAsync(LAST_PLEDGE_DATE_KEY);
  const prevStreak = await getPledgeStreak();
  let nextStreak: number;
  if (lastDate === yesterdayKey()) {
    nextStreak = prevStreak + 1;
  } else if (lastDate === today) {
    nextStreak = prevStreak;
  } else {
    nextStreak = 1;
  }
  await SecureStore.setItemAsync(PLEDGE_STREAK_KEY, String(nextStreak));
  await SecureStore.setItemAsync(LAST_PLEDGE_DATE_KEY, today);
  return { pledge, streak: nextStreak };
}
