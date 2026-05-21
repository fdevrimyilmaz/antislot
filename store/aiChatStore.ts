import * as SecureStore from "expo-secure-store";

import { reportError } from "@/services/monitoring";

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
    reportError(error, { scope: "aiChatStore.load", level: "warning" });
    return [];
  }
}

export async function saveAiMessages(messages: AiMessage[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    reportError(error, {
      scope: "aiChatStore.save",
      extra: { count: messages.length },
    });
    throw error;
  }
}

export async function clearAiMessages(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (error) {
    reportError(error, { scope: "aiChatStore.clear", level: "warning" });
  }
}
