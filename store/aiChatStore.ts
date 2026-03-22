import { getJSON, remove, setJSON } from "@/lib/storage";

export type AiMessageRole = "user" | "assistant";

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: number;
};

const STORAGE_KEY = "antislot_ai_messages";
const USAGE_KEY = "antislot_ai_usage_v1";
const MAX_STORED_MESSAGES = 120;
const MAX_MESSAGE_LENGTH = 4000;

export type AiUsage = {
  /** YYYY-MM-DD formatında tarih (cihaz saatine göre) */
  date: string;
  /** O gün gönderilen kullanıcı mesajı sayısı */
  messagesToday: number;
};

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeAiMessage(item: unknown): AiMessage | null {
  if (!item || typeof item !== "object") return null;
  const candidate = item as Partial<AiMessage>;

  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const role = candidate.role === "user" || candidate.role === "assistant" ? candidate.role : null;
  const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
  const createdAt =
    typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt)
      ? Math.trunc(candidate.createdAt)
      : Date.now();

  if (!id || !role || !content) return null;
  return {
    id,
    role,
    content: content.slice(0, MAX_MESSAGE_LENGTH),
    createdAt,
  };
}

function normalizeAiMessages(value: unknown): AiMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeAiMessage(item))
    .filter((item): item is AiMessage => item != null)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_STORED_MESSAGES);
}

export async function loadAiMessages(): Promise<AiMessage[]> {
  try {
    const parsed = await getJSON<AiMessage[]>(STORAGE_KEY);
    return normalizeAiMessages(parsed);
  } catch (error) {
    console.error("AI mesajları yüklenirken hata:", error);
    return [];
  }
}

export async function saveAiMessages(messages: AiMessage[]): Promise<void> {
  try {
    await setJSON(STORAGE_KEY, normalizeAiMessages(messages));
  } catch (error) {
    console.error("AI mesajları kaydedilirken hata:", error);
    throw error;
  }
}

export async function clearAiMessages(): Promise<void> {
  try {
    await remove(STORAGE_KEY);
  } catch (error) {
    console.error("AI mesajları silinirken hata:", error);
  }
}

export async function loadAiUsage(): Promise<AiUsage> {
  try {
    const parsed = await getJSON<AiUsage>(USAGE_KEY);
    const today = getTodayKey();

    if (!parsed) {
      return { date: today, messagesToday: 0 };
    }

    if (!parsed?.date || typeof parsed.messagesToday !== "number") {
      return { date: today, messagesToday: 0 };
    }

    // Tarih değişmişse sayaç sıfırla
    if (parsed.date !== today) {
      return { date: today, messagesToday: 0 };
    }

    return parsed;
  } catch (error) {
    console.error("AI kullanım verisi yüklenirken hata:", error);
    return { date: getTodayKey(), messagesToday: 0 };
  }
}

export async function incrementAiUsage(): Promise<AiUsage> {
  const current = await loadAiUsage();
  const next: AiUsage = {
    date: getTodayKey(),
    messagesToday: current.messagesToday + 1,
  };

  try {
    await setJSON(USAGE_KEY, next);
  } catch (error) {
    console.error("AI kullanım verisi kaydedilirken hata:", error);
  }

  return next;
}
