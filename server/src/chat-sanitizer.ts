export type ClientMessage = {
  role?: string;
  content?: string;
};

export type ChatRole = "user" | "assistant";

export type SanitizedClientMessage = {
  role: ChatRole;
  content: string;
};

const ALLOWED_ROLES: ReadonlySet<ChatRole> = new Set<ChatRole>(["user", "assistant"]);

const MAX_HISTORY_ITEMS = 10;
const MAX_CONTENT_LENGTH = 1200;

export function sanitizeClientMessages(rawMessages: unknown): SanitizedClientMessage[] {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .filter((item): item is ClientMessage => typeof item === "object" && item !== null)
    .map((item) => ({
      role: typeof item.role === "string" ? item.role : "",
      content: typeof item.content === "string" ? item.content.trim() : "",
    }))
    .filter(
      (item): item is { role: ChatRole; content: string } =>
        ALLOWED_ROLES.has(item.role as ChatRole)
    )
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, MAX_CONTENT_LENGTH),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_ITEMS);
}
