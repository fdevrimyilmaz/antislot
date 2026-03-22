import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, getJSON, setJSON } from "@/lib/storage";
import { anonymousLogin } from "@/services/auth";

const CLIENT_ID_KEY = (STORAGE_KEYS as Record<string, string>).CLIENT_ID || "antislot_client_id";
const LEGACY_UID_KEY = "APP_USER_UID";

function randomClientId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function readLegacyUid(): Promise<string | null> {
  try {
    const legacyUid = await AsyncStorage.getItem(LEGACY_UID_KEY);
    if (!legacyUid) return null;

    const normalized = legacyUid.trim();
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

export async function getClientIdentity(): Promise<string> {
  try {
    const firebaseUid = await anonymousLogin();
    if (firebaseUid) return firebaseUid;
  } catch {
    // Fall through to local id.
  }

  const existing = await getJSON<string>(CLIENT_ID_KEY);
  if (existing) return existing;

  const legacyUid = await readLegacyUid();
  if (legacyUid) {
    await setJSON(CLIENT_ID_KEY, legacyUid);
    return legacyUid;
  }

  const created = randomClientId();
  await setJSON(CLIENT_ID_KEY, created);
  return created;
}
