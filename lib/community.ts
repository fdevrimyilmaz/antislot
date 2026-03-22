import {
  DataSnapshot,
  limitToLast,
  onDisconnect,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
} from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth, rtdb } from "@/lib/firebase";
import { logOnce } from "@/lib/logOnce";
import { anonymousLogin } from "@/services/auth";

export type CommunityRoomId =
  | "kriz"
  | "kumar"
  | "finans"
  | "motivasyon"
  | "gunluk"
  | "dinleme";

export type CommunityRoom = {
  id: CommunityRoomId;
  name: string;
  description: string;
  emoji: string;
};

export const COMMUNITY_ROOMS: CommunityRoom[] = [
  {
    id: "kriz",
    name: "Chat",
    description:
      "Kullanici adiyla ortak sohbet. Acil durumlarda hizli yazisma alani.",
    emoji: "\u{1F4AC}",
  },
  {
    id: "kumar",
    name: "Kumar",
    description: "Kumar durtusu ve geri donus riskleri icin.",
    emoji: "\u{1F3B0}",
  },
  {
    id: "finans",
    name: "Finans",
    description: "Maddi kaygilar ve borc yonetimi uzerine.",
    emoji: "\u{1F4B3}",
  },
  {
    id: "motivasyon",
    name: "Motivasyon",
    description: "Kucuk basarilar ve hedef paylasimlari.",
    emoji: "\u{1F525}",
  },
  {
    id: "gunluk",
    name: "Gunluk",
    description: "Gunun nasil gectigini toplulukla paylas.",
    emoji: "\u{1F4D3}",
  },
  {
    id: "dinleme",
    name: "Dinleme",
    description: "Sadece dinlenmek ve dinlemek isteyenler icin.",
    emoji: "\u{1F442}",
  },
];

export type CommunityMessage = {
  id: string;
  roomId: CommunityRoomId | "direct";
  userId: string;
  username: string;
  text: string;
  createdAt: number;
};

export const LIVE_SUPPORT_AGENT = {
  id: (
    process.env.EXPO_PUBLIC_LIVE_SUPPORT_AGENT_ID ?? "live_support_agent"
  ).trim(),
  nameTR: (
    process.env.EXPO_PUBLIC_LIVE_SUPPORT_AGENT_NAME_TR ?? "Canli Destek Uzmani"
  ).trim(),
  nameEN: (
    process.env.EXPO_PUBLIC_LIVE_SUPPORT_AGENT_NAME_EN ??
    "Live Support Specialist"
  ).trim(),
};

export const COMMUNITY_AI_BOT = {
  id: (process.env.EXPO_PUBLIC_COMMUNITY_AI_BOT_ID ?? "community_ai_gpt4_bot").trim(),
  nameTR: (process.env.EXPO_PUBLIC_COMMUNITY_AI_BOT_NAME_TR ?? "ChatGPT-4").trim(),
  nameEN: (process.env.EXPO_PUBLIC_COMMUNITY_AI_BOT_NAME_EN ?? "ChatGPT-4").trim(),
};

type LocalCommunityState = {
  roomMessages: Partial<Record<CommunityRoomId, CommunityMessage[]>>;
  roomPresence: Partial<Record<CommunityRoomId, string[]>>;
  directMessages: Record<string, CommunityMessage[]>;
};

const LOCAL_STORAGE_KEY = "@antislot/community/local-v1";
const LOCAL_UID_KEY = "@antislot/community/local-uid-v1";
const LOCAL_CHAT_BOT_ID = "local_support_bot";
const LOCAL_CHAT_BOT_NAME = "Destek Botu";
const DEFAULT_USERNAME = "Kullanici";
const MAX_LOCAL_MESSAGES = 120;
const MAX_MESSAGE_TEXT_LENGTH = 500;
const SEND_RATE_WINDOW_MS = 20_000;
const SEND_RATE_LIMIT = 6;
const DUPLICATE_MESSAGE_WINDOW_MS = 45_000;
const REMOTE_WRITE_TIMEOUT_MS = 8_000;

const CONTACT_LINK_PATTERN =
  /(t\.me\/|wa\.me\/|discord\.gg\/|instagram\.com\/|telegram|whatsapp|discord)/i;
const HARASSMENT_PATTERN =
  /\b(aptal|salak|gerizekali|idiot|stupid|kill yourself|go die|die)\b/i;
const GAMBLING_PATTERN = /\b(bahis|kumar|casino|slot|iddaa|bet|odds|roulette|poker)\b/i;
const TACTIC_PATTERN =
  /\b(taktik|strateji|sistem|kupon|oran|tahmin|tip|tips|prediction|guaranteed win|sure win)\b/i;
const RECOVERY_INTENT_PATTERN =
  /\b(birak|birakma|kurtul|uzak dur|stop|quit|avoid|recover|recovery)\b/i;

export type CommunitySendErrorCode =
  | "community_message_blocked"
  | "community_rate_limited"
  | "community_duplicate_message";

type SendGuardState = {
  windowStartedAt: number;
  countInWindow: number;
  lastMessage: string;
  lastMessageAt: number;
};

const roomMessageSubscribers = new Map<
  CommunityRoomId,
  Set<(messages: CommunityMessage[]) => void>
>();
const roomOnlineSubscribers = new Map<
  CommunityRoomId,
  Set<(count: number) => void>
>();
const directMessageSubscribers = new Map<
  string,
  Set<(messages: CommunityMessage[]) => void>
>();
const sendGuardStore = new Map<string, SendGuardState>();

let localStateCache: LocalCommunityState | null = null;
let localStateInFlight: Promise<LocalCommunityState> | null = null;
let forceLocalCommunityMode = false;

function shouldUseLocalCommunityMode(): boolean {
  return !rtdb || forceLocalCommunityMode;
}

function enableLocalCommunityMode(trigger: string, error?: unknown): void {
  const switchedNow = !forceLocalCommunityMode;
  forceLocalCommunityMode = true;
  if (!__DEV__ || !switchedNow) return;

  const reason =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  logOnce(
    "Community:RTDB:fallback",
    `Firebase baglantisi kullanilamiyor. Topluluk yerel moda gecirildi (${trigger}${reason ? `: ${reason}` : ""}).`
  );
}

function normalizeUsername(value: unknown): string {
  if (typeof value !== "string") return "";
  const compact = value.trim().replace(/\s+/g, " ");
  return compact.slice(0, 32);
}

function normalizeMessageText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_MESSAGE_TEXT_LENGTH);
}

function createSendError(code: CommunitySendErrorCode): Error & { code: CommunitySendErrorCode } {
  const error = new Error(code) as Error & { code: CommunitySendErrorCode };
  error.code = code;
  return error;
}

export function getCommunitySendErrorCode(error: unknown): CommunitySendErrorCode | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { code?: unknown; message?: unknown };
  if (
    candidate.code === "community_message_blocked" ||
    candidate.code === "community_rate_limited" ||
    candidate.code === "community_duplicate_message"
  ) {
    return candidate.code;
  }
  if (
    candidate.message === "community_message_blocked" ||
    candidate.message === "community_rate_limited" ||
    candidate.message === "community_duplicate_message"
  ) {
    return candidate.message;
  }
  return null;
}

function shouldBlockMessageForSafety(messageText: string): boolean {
  const lower = messageText.toLocaleLowerCase();
  const digitCount = (messageText.match(/\d/g) ?? []).length;
  if (digitCount >= 10) return true;
  if (CONTACT_LINK_PATTERN.test(messageText)) return true;
  if (HARASSMENT_PATTERN.test(lower)) return true;

  const isGamblingTactic = GAMBLING_PATTERN.test(lower) && TACTIC_PATTERN.test(lower);
  if (isGamblingTactic && !RECOVERY_INTENT_PATTERN.test(lower)) {
    return true;
  }

  return false;
}

function guardOutgoingMessage(userId: string, messageText: string): void {
  if (isAutomatedRoomSender(userId)) return;
  if (shouldBlockMessageForSafety(messageText)) {
    throw createSendError("community_message_blocked");
  }

  const key = userId.trim() || "unknown";
  const now = Date.now();
  const previous = sendGuardStore.get(key);

  if (previous) {
    if (
      previous.lastMessage === messageText &&
      now - previous.lastMessageAt < DUPLICATE_MESSAGE_WINDOW_MS
    ) {
      throw createSendError("community_duplicate_message");
    }
    if (now - previous.windowStartedAt < SEND_RATE_WINDOW_MS) {
      if (previous.countInWindow >= SEND_RATE_LIMIT) {
        throw createSendError("community_rate_limited");
      }
      sendGuardStore.set(key, {
        windowStartedAt: previous.windowStartedAt,
        countInWindow: previous.countInWindow + 1,
        lastMessage: messageText,
        lastMessageAt: now,
      });
      return;
    }
  }

  sendGuardStore.set(key, {
    windowStartedAt: now,
    countInWindow: 1,
    lastMessage: messageText,
    lastMessageAt: now,
  });
}

function supportAgentName(): string {
  return LIVE_SUPPORT_AGENT.nameTR || LIVE_SUPPORT_AGENT.nameEN || "Canli Destek";
}

function communityAiBotName(): string {
  return COMMUNITY_AI_BOT.nameTR || COMMUNITY_AI_BOT.nameEN || "ChatGPT-4";
}

function isAutomatedRoomSender(userId: string): boolean {
  if (!userId) return false;
  if (userId === COMMUNITY_AI_BOT.id) return true;
  if (userId === LOCAL_CHAT_BOT_ID) return true;
  if (userId === LIVE_SUPPORT_AGENT.id) return true;
  if (userId.startsWith("agent")) return true;
  return false;
}

function fallbackUsernameFromUserId(userId: string): string {
  if (!userId) return DEFAULT_USERNAME;
  if (userId === COMMUNITY_AI_BOT.id) return communityAiBotName();
  if (userId === LOCAL_CHAT_BOT_ID) return LOCAL_CHAT_BOT_NAME;
  if (userId === LIVE_SUPPORT_AGENT.id) return supportAgentName();
  if (userId.startsWith("agent")) return supportAgentName();
  return DEFAULT_USERNAME;
}

function resolveMessageUsername(value: unknown, userId: string): string {
  return normalizeUsername(value) || fallbackUsernameFromUserId(userId);
}

function directThreadId(userId: string, agentId: string): string {
  return `agent_${agentId}__user_${userId}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutCode: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutCode));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function parseDirectMessagesSnapshot(
  snapshot: DataSnapshot,
): CommunityMessage[] {
  const raw = snapshot.val() as Record<
    string,
    {
      userId?: unknown;
      username?: unknown;
      text?: unknown;
      createdAt?: unknown;
    }
  > | null;

  if (!raw) return [];

  const items: CommunityMessage[] = Object.entries(raw)
    .map(([key, value]) => {
      const userId =
        typeof value.userId === "string" && value.userId.length > 0
          ? value.userId
          : "unknown";
      const username = resolveMessageUsername(value.username, userId);
      const text = normalizeMessageText(value.text);
      const createdAtValue =
        typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
          ? value.createdAt
          : Date.now();

      if (!text) return null;

      return {
        id: key,
        roomId: "direct",
        userId,
        username,
        text,
        createdAt: createdAtValue,
      } as CommunityMessage;
    })
    .filter((m): m is CommunityMessage => m != null);

  items.sort((a, b) => a.createdAt - b.createdAt);
  return items;
}

function warnCommunityDisabled() {
  if (__DEV__) {
    logOnce(
      "Community:RTDB:unavailable",
      "Firebase RTDB kullanilamiyor. Topluluk ozellikleri yerel (offline) moda alindi."
    );
  }
}

function parseMessagesSnapshot(
  roomId: CommunityRoomId,
  snapshot: DataSnapshot,
): CommunityMessage[] {
  const raw = snapshot.val() as Record<
    string,
    {
      userId?: unknown;
      username?: unknown;
      text?: unknown;
      createdAt?: unknown;
    }
  > | null;

  if (!raw) return [];

  const items: CommunityMessage[] = Object.entries(raw)
    .map(([key, value]) => {
      const userId =
        typeof value.userId === "string" && value.userId.length > 0
          ? value.userId
          : "unknown";
      const username = resolveMessageUsername(value.username, userId);
      const text = normalizeMessageText(value.text);
      const createdAtValue =
        typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
          ? value.createdAt
          : Date.now();

      if (!text) return null;

      return {
        id: key,
        roomId,
        userId,
        username,
        text,
        createdAt: createdAtValue,
      } as CommunityMessage;
    })
    .filter((m): m is CommunityMessage => m != null);

  items.sort((a, b) => a.createdAt - b.createdAt);
  return items;
}

function createDefaultLocalState(): LocalCommunityState {
  return {
    roomMessages: {},
    roomPresence: {},
    directMessages: {},
  };
}

function sortMessages(messages: CommunityMessage[]): CommunityMessage[] {
  return [...messages].sort((a, b) => a.createdAt - b.createdAt);
}

function normalizeLocalMessages(
  value: unknown,
  roomId: CommunityRoomId | "direct"
): CommunityMessage[] {
  if (!Array.isArray(value)) return [];

  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Partial<CommunityMessage>;
      const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
      const userId =
        typeof candidate.userId === "string" ? candidate.userId.trim() : "";
      const username = resolveMessageUsername(candidate.username, userId);
      const text = normalizeMessageText(candidate.text);
      const createdAt =
        typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt)
          ? Math.trunc(candidate.createdAt)
          : Date.now();

      if (!id || !userId || !text) return null;
      return {
        id,
        roomId,
        userId,
        username,
        text,
        createdAt,
      } satisfies CommunityMessage;
    })
    .filter((item): item is CommunityMessage => item != null);

  return sortMessages(parsed).slice(-MAX_LOCAL_MESSAGES);
}

function normalizeLocalPresence(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    ),
  ];
}

function normalizeLocalState(raw: unknown): LocalCommunityState {
  if (!raw || typeof raw !== "object") {
    return createDefaultLocalState();
  }

  const candidate = raw as Partial<LocalCommunityState>;
  const roomMessages: Partial<Record<CommunityRoomId, CommunityMessage[]>> = {};
  const roomPresence: Partial<Record<CommunityRoomId, string[]>> = {};

  for (const room of COMMUNITY_ROOMS) {
    roomMessages[room.id] = normalizeLocalMessages(
      candidate.roomMessages?.[room.id],
      room.id
    );
    roomPresence[room.id] = normalizeLocalPresence(candidate.roomPresence?.[room.id]);
  }

  const directMessages: Record<string, CommunityMessage[]> = {};
  if (candidate.directMessages && typeof candidate.directMessages === "object") {
    for (const [threadId, messages] of Object.entries(candidate.directMessages)) {
      if (!threadId.trim()) continue;
      directMessages[threadId] = normalizeLocalMessages(messages, "direct");
    }
  }

  return {
    roomMessages,
    roomPresence,
    directMessages,
  };
}

async function getLocalState(): Promise<LocalCommunityState> {
  if (localStateCache) return localStateCache;
  if (localStateInFlight) return localStateInFlight;

  localStateInFlight = (async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        const initial = createDefaultLocalState();
        localStateCache = initial;
        return initial;
      }

      const parsed = normalizeLocalState(JSON.parse(raw));
      localStateCache = parsed;
      return parsed;
    } catch {
      const fallback = createDefaultLocalState();
      localStateCache = fallback;
      return fallback;
    } finally {
      localStateInFlight = null;
    }
  })();

  return localStateInFlight;
}

async function saveLocalState(state: LocalCommunityState): Promise<void> {
  localStateCache = state;
  try {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // local fallback persistence errors are non-fatal
  }
}

async function updateLocalState(
  updater: (draft: LocalCommunityState) => void
): Promise<LocalCommunityState> {
  const current = await getLocalState();

  const roomMessages: Partial<Record<CommunityRoomId, CommunityMessage[]>> = {};
  const roomPresence: Partial<Record<CommunityRoomId, string[]>> = {};
  for (const room of COMMUNITY_ROOMS) {
    roomMessages[room.id] = [...(current.roomMessages[room.id] ?? [])];
    roomPresence[room.id] = [...(current.roomPresence[room.id] ?? [])];
  }

  const draft: LocalCommunityState = {
    roomMessages,
    roomPresence,
    directMessages: Object.fromEntries(
      Object.entries(current.directMessages).map(([key, messages]) => [key, [...messages]])
    ),
  };

  updater(draft);
  await saveLocalState(draft);
  return draft;
}

function subscribeRoomMessages(
  roomId: CommunityRoomId,
  callback: (messages: CommunityMessage[]) => void
): () => void {
  const existing = roomMessageSubscribers.get(roomId) ?? new Set();
  existing.add(callback);
  roomMessageSubscribers.set(roomId, existing);

  return () => {
    const current = roomMessageSubscribers.get(roomId);
    if (!current) return;
    current.delete(callback);
    if (current.size === 0) {
      roomMessageSubscribers.delete(roomId);
    }
  };
}

function subscribeDirectMessages(
  threadId: string,
  callback: (messages: CommunityMessage[]) => void
): () => void {
  const existing = directMessageSubscribers.get(threadId) ?? new Set();
  existing.add(callback);
  directMessageSubscribers.set(threadId, existing);

  return () => {
    const current = directMessageSubscribers.get(threadId);
    if (!current) return;
    current.delete(callback);
    if (current.size === 0) {
      directMessageSubscribers.delete(threadId);
    }
  };
}

function subscribeRoomOnline(
  roomId: CommunityRoomId,
  callback: (count: number) => void
): () => void {
  const existing = roomOnlineSubscribers.get(roomId) ?? new Set();
  existing.add(callback);
  roomOnlineSubscribers.set(roomId, existing);

  return () => {
    const current = roomOnlineSubscribers.get(roomId);
    if (!current) return;
    current.delete(callback);
    if (current.size === 0) {
      roomOnlineSubscribers.delete(roomId);
    }
  };
}

function getRoomOnlineCount(state: LocalCommunityState, roomId: CommunityRoomId): number {
  const roomPresence = state.roomPresence[roomId] ?? [];
  return Math.max(1, roomPresence.length);
}

function emitRoomMessages(roomId: CommunityRoomId, state: LocalCommunityState): void {
  const subscribers = roomMessageSubscribers.get(roomId);
  if (!subscribers || subscribers.size === 0) return;
  const payload = sortMessages(state.roomMessages[roomId] ?? []);
  subscribers.forEach((callback) => callback(payload));
}

function emitDirectMessages(threadId: string, state: LocalCommunityState): void {
  const subscribers = directMessageSubscribers.get(threadId);
  if (!subscribers || subscribers.size === 0) return;
  const payload = sortMessages(state.directMessages[threadId] ?? []);
  subscribers.forEach((callback) => callback(payload));
}

function emitRoomOnlineCount(roomId: CommunityRoomId, state: LocalCommunityState): void {
  const subscribers = roomOnlineSubscribers.get(roomId);
  if (!subscribers || subscribers.size === 0) return;
  const count = getRoomOnlineCount(state, roomId);
  subscribers.forEach((callback) => callback(count));
}

function createLocalMessage(
  roomId: CommunityRoomId | "direct",
  userId: string,
  username: string,
  text: string
): CommunityMessage {
  const now = Date.now();
  const normalizedText = normalizeMessageText(text);
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    roomId,
    userId,
    username,
    text: normalizedText,
    createdAt: now,
  };
}

function buildLocalDirectReply(text: string): string {
  const normalized = text.toLowerCase();

  if (/acil|kriz|panic|suicide|kendime zarar/.test(normalized)) {
    return "Canli destek: acil risk varsa hemen 112'yi ara. Sonra guvenli bir alana gecip burada devam edelim.";
  }

  if (/yalniz|alone|lonely/.test(normalized)) {
    return "Canli destek: yalnizlik tetikleyici olabilir. Guvendigin birine bir satir mesaj atip donebilirsin.";
  }

  return "Canli destek: mesajini aldim. 4 derin nefes al ve bugun icin tek net guvenli adimini yaz.";
}

export function listenToRoomMessages(
  roomId: CommunityRoomId,
  callback: (messages: CommunityMessage[]) => void,
): () => void {
  const database = rtdb;
  if (!database || shouldUseLocalCommunityMode()) {
    warnCommunityDisabled();
    callback([]);
    void getLocalState().then((state) => {
      callback(sortMessages(state.roomMessages[roomId] ?? []));
    });
    return subscribeRoomMessages(roomId, callback);
  }

  const messagesRef = query(
    ref(database, `community/rooms/${roomId}/messages`),
    orderByChild("createdAt"),
    limitToLast(200),
  );

  let localUnsubscribe: (() => void) | null = null;
  const switchToLocal = (error?: unknown) => {
    if (localUnsubscribe) return;
    enableLocalCommunityMode("listen-room-messages", error);
    warnCommunityDisabled();
    callback([]);
    void getLocalState().then((state) => {
      callback(sortMessages(state.roomMessages[roomId] ?? []));
    });
    localUnsubscribe = subscribeRoomMessages(roomId, callback);
  };

  const unsubscribe = onValue(
    messagesRef,
    (snapshot) => {
      if (localUnsubscribe) return;
      callback(parseMessagesSnapshot(roomId, snapshot));
    },
    (error) => {
      switchToLocal(error);
    }
  );

  return () => {
    unsubscribe();
    localUnsubscribe?.();
  };
}

export function listenToDirectSupportMessages(
  userId: string,
  agentId: string,
  callback: (messages: CommunityMessage[]) => void,
): () => void {
  const database = rtdb;
  if (!database || shouldUseLocalCommunityMode()) {
    warnCommunityDisabled();
    const threadId = directThreadId(userId, agentId);
    callback([]);
    void getLocalState().then((state) => {
      callback(sortMessages(state.directMessages[threadId] ?? []));
    });
    return subscribeDirectMessages(threadId, callback);
  }

  const threadId = directThreadId(userId, agentId);
  const messagesRef = query(
    ref(database, `community/direct/${threadId}/messages`),
    orderByChild("createdAt"),
    limitToLast(200),
  );

  let localUnsubscribe: (() => void) | null = null;
  const switchToLocal = (error?: unknown) => {
    if (localUnsubscribe) return;
    enableLocalCommunityMode("listen-direct-messages", error);
    warnCommunityDisabled();
    callback([]);
    void getLocalState().then((state) => {
      callback(sortMessages(state.directMessages[threadId] ?? []));
    });
    localUnsubscribe = subscribeDirectMessages(threadId, callback);
  };

  const unsubscribe = onValue(
    messagesRef,
    (snapshot) => {
      if (localUnsubscribe) return;
      callback(parseDirectMessagesSnapshot(snapshot));
    },
    (error) => {
      switchToLocal(error);
    }
  );

  return () => {
    unsubscribe();
    localUnsubscribe?.();
  };
}

export function listenToRoomOnlineCount(
  roomId: CommunityRoomId,
  callback: (count: number) => void,
): () => void {
  const database = rtdb;
  if (!database || shouldUseLocalCommunityMode()) {
    warnCommunityDisabled();
    callback(1);
    void getLocalState().then((state) => {
      callback(getRoomOnlineCount(state, roomId));
    });
    return subscribeRoomOnline(roomId, callback);
  }

  const presenceRef = ref(database, `community/rooms/${roomId}/presence`);
  let localUnsubscribe: (() => void) | null = null;
  const switchToLocal = (error?: unknown) => {
    if (localUnsubscribe) return;
    enableLocalCommunityMode("listen-room-online", error);
    warnCommunityDisabled();
    callback(1);
    void getLocalState().then((state) => {
      callback(getRoomOnlineCount(state, roomId));
    });
    localUnsubscribe = subscribeRoomOnline(roomId, callback);
  };

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      if (localUnsubscribe) return;
      const raw = snapshot.val() as Record<string, unknown> | null;
      const count = raw ? Object.keys(raw).length : 0;
      callback(count);
    },
    (error) => {
      switchToLocal(error);
    }
  );

  return () => {
    unsubscribe();
    localUnsubscribe?.();
  };
}

export async function ensureAnonymousUser(): Promise<string> {
  if (auth && !forceLocalCommunityMode) {
    try {
      const uid = await anonymousLogin();
      return uid;
    } catch (error) {
      enableLocalCommunityMode("anonymous-login", error);
    }
  }

  warnCommunityDisabled();

  const storedUid = (await AsyncStorage.getItem(LOCAL_UID_KEY))?.trim();
  if (storedUid) {
    return storedUid;
  }

  const generatedUid = `local_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  try {
    await AsyncStorage.setItem(LOCAL_UID_KEY, generatedUid);
  } catch {
    // non-fatal for local mode
  }
  return generatedUid;
}

export async function sendRoomMessage(
  roomId: CommunityRoomId,
  userId: string,
  username: string,
  text: string,
  applyGuard = true,
): Promise<void> {
  const trimmed = normalizeMessageText(text);
  const trimmedUsername = normalizeUsername(username);
  if (!trimmed || !trimmedUsername) return;
  if (applyGuard) {
    guardOutgoingMessage(userId, trimmed);
  }

  const database = rtdb;
  if (!database || shouldUseLocalCommunityMode()) {
    warnCommunityDisabled();

    const updated = await updateLocalState((state) => {
      const roomMessages = state.roomMessages[roomId] ?? [];
      roomMessages.push(createLocalMessage(roomId, userId, trimmedUsername, trimmed));
      state.roomMessages[roomId] = roomMessages.slice(-MAX_LOCAL_MESSAGES);

      if (!isAutomatedRoomSender(userId)) {
        const roomPresence = state.roomPresence[roomId] ?? [];
        if (!roomPresence.includes(userId)) {
          roomPresence.push(userId);
        }
        state.roomPresence[roomId] = roomPresence;
      }
    });

    emitRoomMessages(roomId, updated);
    emitRoomOnlineCount(roomId, updated);
    return;
  }

  try {
    const messagesRef = ref(database, `community/rooms/${roomId}/messages`);
    const messageRef = push(messagesRef);
    const now = Date.now();
    await withTimeout(
      set(messageRef, {
        userId,
        username: trimmedUsername,
        text: trimmed,
        createdAt: now,
      }),
      REMOTE_WRITE_TIMEOUT_MS,
      "community-send-room-timeout"
    );

    if (isAutomatedRoomSender(userId)) {
      return;
    }

    const presenceRef = ref(database, `community/rooms/${roomId}/presence/${userId}`);
    await withTimeout(
      set(presenceRef, {
        joinedAt: now,
        lastActiveAt: now,
      }),
      REMOTE_WRITE_TIMEOUT_MS,
      "community-presence-update-timeout"
    );
    await withTimeout(
      onDisconnect(presenceRef).remove(),
      REMOTE_WRITE_TIMEOUT_MS,
      "community-presence-disconnect-timeout"
    );
  } catch (error) {
    enableLocalCommunityMode("send-room-message", error);
    await sendRoomMessage(roomId, userId, trimmedUsername, trimmed, false);
  }
}

export async function sendDirectSupportMessage(
  userId: string,
  agentId: string,
  senderId: string,
  senderUsername: string,
  text: string,
  applyGuard = true,
): Promise<void> {
  const trimmed = normalizeMessageText(text);
  const trimmedSenderUsername = normalizeUsername(senderUsername);
  if (!trimmed || !trimmedSenderUsername) return;
  if (applyGuard) {
    guardOutgoingMessage(senderId, trimmed);
  }

  const database = rtdb;
  if (!database || shouldUseLocalCommunityMode()) {
    warnCommunityDisabled();

    const threadId = directThreadId(userId, agentId);
    const updated = await updateLocalState((state) => {
      const threadMessages = state.directMessages[threadId] ?? [];
      threadMessages.push(
        createLocalMessage("direct", senderId, trimmedSenderUsername, trimmed)
      );

      if (senderId !== agentId) {
        const reply = buildLocalDirectReply(trimmed);
        threadMessages.push(
          createLocalMessage(
            "direct",
            agentId || LIVE_SUPPORT_AGENT.id || "agent",
            supportAgentName(),
            reply
          )
        );
      }

      state.directMessages[threadId] = threadMessages.slice(-MAX_LOCAL_MESSAGES);
    });

    emitDirectMessages(threadId, updated);
    return;
  }

  try {
    const threadId = directThreadId(userId, agentId);
    const messagesRef = ref(database, `community/direct/${threadId}/messages`);
    const messageRef = push(messagesRef);
    const now = Date.now();
    await withTimeout(
      set(messageRef, {
        userId: senderId,
        username: trimmedSenderUsername,
        text: trimmed,
        createdAt: now,
      }),
      REMOTE_WRITE_TIMEOUT_MS,
      "community-send-direct-timeout"
    );
  } catch (error) {
    enableLocalCommunityMode("send-direct-message", error);
    await sendDirectSupportMessage(
      userId,
      agentId,
      senderId,
      trimmedSenderUsername,
      trimmed,
      false
    );
  }
}

export async function joinRoomPresence(
  roomId: CommunityRoomId,
  userId: string,
): Promise<() => Promise<void>> {
  const database = rtdb;
  if (!database || shouldUseLocalCommunityMode()) {
    warnCommunityDisabled();

    const updated = await updateLocalState((state) => {
      const presence = state.roomPresence[roomId] ?? [];
      if (!presence.includes(userId)) {
        presence.push(userId);
      }
      state.roomPresence[roomId] = presence;
    });
    emitRoomOnlineCount(roomId, updated);

    return async () => {
      const state = await updateLocalState((draft) => {
        const presence = draft.roomPresence[roomId] ?? [];
        draft.roomPresence[roomId] = presence.filter((id) => id !== userId);
      });
      emitRoomOnlineCount(roomId, state);
    };
  }

  try {
    const presenceRef = ref(database, `community/rooms/${roomId}/presence/${userId}`);

    const now = Date.now();
    await set(presenceRef, {
      joinedAt: now,
      lastActiveAt: now,
    });
    await onDisconnect(presenceRef).remove();

    // Return a cleanup function to call when the screen unmounts.
    return async () => {
      try {
        await onDisconnect(presenceRef).cancel();
      } catch {
        // ignore
      }
      try {
        await remove(presenceRef);
      } catch {
        // ignore
      }
    };
  } catch (error) {
    enableLocalCommunityMode("join-room-presence", error);
    return joinRoomPresence(roomId, userId);
  }
}

export async function joinDirectSupportPresence(
  userId: string,
  agentId: string,
  participantId: string,
): Promise<() => Promise<void>> {
  const database = rtdb;
  if (!database || shouldUseLocalCommunityMode()) {
    warnCommunityDisabled();

    const threadId = directThreadId(userId, agentId);
    await updateLocalState((state) => {
      const key = "kriz" as CommunityRoomId;
      const presence = state.roomPresence[key] ?? [];
      if (!presence.includes(participantId)) {
        presence.push(participantId);
      }
      state.roomPresence[key] = presence;

      if (!state.directMessages[threadId]) {
        state.directMessages[threadId] = [];
      }

      const hasAgentIntro = state.directMessages[threadId].some(
        (message) => message.userId === (agentId || LIVE_SUPPORT_AGENT.id)
      );

      if (!hasAgentIntro) {
        state.directMessages[threadId].push(
          createLocalMessage(
            "direct",
            agentId || LIVE_SUPPORT_AGENT.id || LOCAL_CHAT_BOT_ID,
            supportAgentName(),
            "Baglantin hazir. Durumunu kisaca yazar misin?"
          )
        );
      }
    }).then((state) => {
      emitDirectMessages(threadId, state);
    });

    return async () => {
      // Local direct presence cleanup is optional in offline mode.
    };
  }

  try {
    const threadId = directThreadId(userId, agentId);
    const presenceRef = ref(
      database,
      `community/direct/${threadId}/presence/${participantId}`,
    );

    const now = Date.now();
    await set(presenceRef, {
      joinedAt: now,
      lastActiveAt: now,
    });
    await onDisconnect(presenceRef).remove();

    return async () => {
      try {
        await onDisconnect(presenceRef).cancel();
      } catch {
        // ignore
      }
      try {
        await remove(presenceRef);
      } catch {
        // ignore
      }
    };
  } catch (error) {
    enableLocalCommunityMode("join-direct-presence", error);
    return joinDirectSupportPresence(userId, agentId, participantId);
  }
}

export function getRoomMeta(
  id?: string | string[] | undefined,
): CommunityRoom | null {
  if (!id) return null;
  const roomId = Array.isArray(id) ? id[0] : id;
  const found = COMMUNITY_ROOMS.find((room) => room.id === roomId);
  return found ?? null;
}
