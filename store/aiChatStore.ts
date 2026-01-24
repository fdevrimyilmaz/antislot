import * as SecureStore from "expo-secure-store";

export type AiMessageRole = "user" | "assistant";

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: number;
};

const STORAGE_KEY = "antislot_ai_messages";

export async function loadAiMessages(): Promise<AiMessage[]> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as AiMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("AI mesajları yüklenirken hata:", error);
    return [];
  }
}

export async function saveAiMessages(messages: AiMessage[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("AI mesajları kaydedilirken hata:", error);
    throw error;
  }
}

export async function clearAiMessages(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (error) {
    console.error("AI mesajları silinirken hata:", error);
  }
}
