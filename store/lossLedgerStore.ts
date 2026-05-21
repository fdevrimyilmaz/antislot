import * as SecureStore from "expo-secure-store";

/**
 * Loss Ledger — historical / lifetime losses estimate.
 *
 * Quitzilla pattern: when the user faces the true total of what they've
 * lost (across years) it becomes a powerful anti-relapse mirror. Entries
 * are user-provided estimates per period; the sum is what matters.
 */

const KEY = "antislot_loss_ledger";

export type LossEntry = {
  id: string;
  /** Period label (e.g. "2023", "Son 6 ay"). */
  period: string;
  amount: number; // TRY
  note?: string;
  createdAt: number;
};

export async function getLossLedger(): Promise<LossEntry[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LossEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

async function saveAll(entries: LossEntry[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(entries));
}

export async function addLossEntry(
  input: Omit<LossEntry, "id" | "createdAt">
): Promise<LossEntry[]> {
  const entries = await getLossLedger();
  const entry: LossEntry = {
    ...input,
    id: `loss_${Date.now()}`,
    createdAt: Date.now(),
  };
  const updated = [entry, ...entries];
  await saveAll(updated);
  return updated.sort((a, b) => b.createdAt - a.createdAt);
}

export async function removeLossEntry(id: string): Promise<LossEntry[]> {
  const entries = await getLossLedger();
  const updated = entries.filter((e) => e.id !== id);
  await saveAll(updated);
  return updated;
}

export function totalLoss(entries: LossEntry[]): number {
  return entries.reduce((s, e) => s + (Number.isFinite(e.amount) ? e.amount : 0), 0);
}
