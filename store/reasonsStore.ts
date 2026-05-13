import * as SecureStore from "expo-secure-store";

/**
 * "Reasons" — kullanıcının kişisel "neden bırakıyorum" kart koleksiyonu.
 * Krizde / dürtü anında telefonu açıp okuyabileceği somut sebepler.
 *
 * I Am Sober ve benzer uygulamalarda en güçlü pattern bu — soyut "kötü
 * birşey" yerine kişisel ve duygusal "kızımın yüzü", "annemin sağlığı",
 * "borçtan kurtulmak" gibi maddeler.
 */

const KEY = "antislot_reasons";

export type Reason = {
  id: string;
  text: string;
  emoji?: string;
  createdAt: number;
};

export async function getReasons(): Promise<Reason[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Reason[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(reasons: Reason[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(reasons));
}

export async function addReason(text: string, emoji?: string): Promise<Reason[]> {
  const trimmed = text.trim();
  if (!trimmed) return getReasons();
  const reasons = await getReasons();
  const next: Reason = {
    id: `reason_${Date.now()}`,
    text: trimmed.slice(0, 280),
    emoji,
    createdAt: Date.now(),
  };
  const updated = [next, ...reasons];
  await saveAll(updated);
  return updated;
}

export async function removeReason(id: string): Promise<Reason[]> {
  const reasons = await getReasons();
  const updated = reasons.filter((r) => r.id !== id);
  await saveAll(updated);
  return updated;
}

export async function updateReason(id: string, text: string): Promise<Reason[]> {
  const reasons = await getReasons();
  const updated = reasons.map((r) =>
    r.id === id ? { ...r, text: text.trim().slice(0, 280) } : r
  );
  await saveAll(updated);
  return updated;
}
