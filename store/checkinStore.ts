import * as SecureStore from "expo-secure-store";

const LAST_CHECKIN_KEY = "antislot_last_checkin";
const CHECKIN_HISTORY_KEY = "antislot_checkin_history";
const MAX_HISTORY = 60; // keep last ~2 months

export type CheckinMood = "kotu" | "zor" | "idare" | "iyi" | "harika";
export type CheckinEntry = {
  date: string; // YYYY-MM-DD local
  urge: number; // 0-10
  mood: CheckinMood;
  note?: string;
  createdAt: number;
};

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getTodayCheckin(): Promise<CheckinEntry | null> {
  try {
    const raw = await SecureStore.getItemAsync(LAST_CHECKIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckinEntry;
    if (parsed.date !== todayKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCheckin(input: Omit<CheckinEntry, "date" | "createdAt">): Promise<CheckinEntry> {
  const entry: CheckinEntry = {
    ...input,
    date: todayKey(),
    createdAt: Date.now(),
  };
  await SecureStore.setItemAsync(LAST_CHECKIN_KEY, JSON.stringify(entry));

  try {
    const historyRaw = await SecureStore.getItemAsync(CHECKIN_HISTORY_KEY);
    const history: CheckinEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    const filtered = history.filter((h) => h.date !== entry.date);
    const next = [entry, ...filtered].slice(0, MAX_HISTORY);
    await SecureStore.setItemAsync(CHECKIN_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }

  return entry;
}

export async function getCheckinHistory(): Promise<CheckinEntry[]> {
  try {
    const raw = await SecureStore.getItemAsync(CHECKIN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CheckinEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
