import { storage } from "@/lib/storage";
import { SharedConfig } from "@/react-native-bridge/SharedConfigModule";

const BLOCKED_KEY = "antislot_blocked_count";
const ALLOWED_KEY = "antislot_allowed_count";
const SECURE_STORAGE = { type: "secure" } as const;

function parseCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function getFilterStats(): Promise<{ blocked: number; allowed: number }> {
  const blockedRaw = await storage.get<unknown>(BLOCKED_KEY, SECURE_STORAGE);
  const allowedRaw = await storage.get<unknown>(ALLOWED_KEY, SECURE_STORAGE);
  const localBlocked = parseCount(blockedRaw);
  const allowed = parseCount(allowedRaw);
  const nativeBlocked = await SharedConfig.getSmsBlockedCount();
  const blocked = Math.max(localBlocked, nativeBlocked);
  return { blocked, allowed };
}

export async function incrementBlocked(): Promise<void> {
  const stats = await getFilterStats();
  await storage.set(BLOCKED_KEY, (stats.blocked + 1).toString(), SECURE_STORAGE);
}

export async function incrementAllowed(): Promise<void> {
  const stats = await getFilterStats();
  await storage.set(ALLOWED_KEY, (stats.allowed + 1).toString(), SECURE_STORAGE);
}

export async function resetFilterStats(): Promise<void> {
  await storage.remove(BLOCKED_KEY, SECURE_STORAGE);
  await storage.remove(ALLOWED_KEY, SECURE_STORAGE);
  await SharedConfig.resetSmsBlockedCount();
}
