import * as SecureStore from "expo-secure-store";

const BLOCKED_KEY = "antislot_blocked_count";
const ALLOWED_KEY = "antislot_allowed_count";

export async function getFilterStats(): Promise<{ blocked: number; allowed: number }> {
  const blockedStr = await SecureStore.getItemAsync(BLOCKED_KEY);
  const allowedStr = await SecureStore.getItemAsync(ALLOWED_KEY);
  const blocked = blockedStr ? parseInt(blockedStr, 10) : 0;
  const allowed = allowedStr ? parseInt(allowedStr, 10) : 0;
  return { blocked, allowed };
}

export async function incrementBlocked(): Promise<void> {
  const stats = await getFilterStats();
  await SecureStore.setItemAsync(BLOCKED_KEY, (stats.blocked + 1).toString());
}

export async function incrementAllowed(): Promise<void> {
  const stats = await getFilterStats();
  await SecureStore.setItemAsync(ALLOWED_KEY, (stats.allowed + 1).toString());
}

export async function resetFilterStats(): Promise<void> {
  await SecureStore.deleteItemAsync(BLOCKED_KEY);
  await SecureStore.deleteItemAsync(ALLOWED_KEY);
}
