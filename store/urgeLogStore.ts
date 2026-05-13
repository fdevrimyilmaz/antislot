import * as SecureStore from "expo-secure-store";

/**
 * Urge log — every time the user feels a gambling urge they can tap a
 * button and log it. Over time this produces a pattern (time of day,
 * trigger, intensity, did-resist) that beats abstract advice.
 *
 * Kept fully on-device; max 200 entries to bound storage size.
 */

const KEY = "antislot_urge_log";
const MAX_ENTRIES = 200;

export type UrgeTrigger =
  | "stres"
  | "sikinti"
  | "yalniz"
  | "kayip"
  | "ofke"
  | "alkol"
  | "reklam"
  | "diger";

export type UrgeEntry = {
  id: string;
  createdAt: number;
  intensity: number; // 0-10
  trigger: UrgeTrigger;
  resisted: boolean;
  note?: string;
};

export async function getUrgeLog(): Promise<UrgeEntry[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UrgeEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

async function saveAll(entries: UrgeEntry[]): Promise<void> {
  const trimmed = entries.slice(0, MAX_ENTRIES);
  await SecureStore.setItemAsync(KEY, JSON.stringify(trimmed));
}

export async function logUrge(
  input: Omit<UrgeEntry, "id" | "createdAt">
): Promise<UrgeEntry[]> {
  const entries = await getUrgeLog();
  const entry: UrgeEntry = {
    ...input,
    id: `urge_${Date.now()}`,
    createdAt: Date.now(),
  };
  const updated = [entry, ...entries];
  await saveAll(updated);
  return updated.sort((a, b) => b.createdAt - a.createdAt);
}

export async function removeUrge(id: string): Promise<UrgeEntry[]> {
  const entries = await getUrgeLog();
  const updated = entries.filter((e) => e.id !== id);
  await saveAll(updated);
  return updated;
}

export type UrgeStats = {
  total: number;
  resistedCount: number;
  resistanceRate: number; // 0-1
  avgIntensity: number;
  byTrigger: Record<UrgeTrigger, number>;
  byHour: number[]; // 24-length
};

const ALL_TRIGGERS: UrgeTrigger[] = [
  "stres",
  "sikinti",
  "yalniz",
  "kayip",
  "ofke",
  "alkol",
  "reklam",
  "diger",
];

export function computeStats(entries: UrgeEntry[]): UrgeStats {
  if (entries.length === 0) {
    return {
      total: 0,
      resistedCount: 0,
      resistanceRate: 0,
      avgIntensity: 0,
      byTrigger: Object.fromEntries(ALL_TRIGGERS.map((t) => [t, 0])) as Record<UrgeTrigger, number>,
      byHour: Array.from({ length: 24 }, () => 0),
    };
  }

  const resistedCount = entries.filter((e) => e.resisted).length;
  const intensitySum = entries.reduce((s, e) => s + e.intensity, 0);
  const byTrigger = Object.fromEntries(ALL_TRIGGERS.map((t) => [t, 0])) as Record<
    UrgeTrigger,
    number
  >;
  const byHour = Array.from({ length: 24 }, () => 0);

  for (const e of entries) {
    byTrigger[e.trigger] = (byTrigger[e.trigger] ?? 0) + 1;
    const h = new Date(e.createdAt).getHours();
    byHour[h] += 1;
  }

  return {
    total: entries.length,
    resistedCount,
    resistanceRate: resistedCount / entries.length,
    avgIntensity: intensitySum / entries.length,
    byTrigger,
    byHour,
  };
}
