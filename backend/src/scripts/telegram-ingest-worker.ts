#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";

type TelegramUser = {
  id: number;
  username?: string;
};

type TelegramChat = {
  id: number;
  type?: string;
  title?: string;
  username?: string;
  first_name?: string;
};

type TelegramMessage = {
  text?: string;
  chat?: TelegramChat;
  from?: TelegramUser;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};

type TelegramUpdateApiResponse = {
  ok: boolean;
  result?: TelegramUpdate[];
  description?: string;
};

type TelegramSendApiResponse = {
  ok: boolean;
  description?: string;
};

type BlocklistApiResponse = {
  version?: number;
  domains?: string[];
};

type IngestResponse = {
  ok: boolean;
  addedCount?: number;
  added?: string[];
  skipped?: Array<{ input: string; reason: string }>;
  error?: {
    code?: string;
    message?: string;
  };
};

type WorkerConfig = {
  botToken: string;
  ingestToken: string;
  ingestBaseUrl: string;
  offsetFile: string;
  timeoutSec: number;
  maxBatch: number;
  dryRun: boolean;
  allowedChatIds: Set<number>;
  allowedUserIds: Set<number>;
  idleDelayMs: number;
  errorBackoffMs: number;
  telegramHttpTimeoutMs: number;
  telegramFetchRetries: number;
  ingestRetries: number;
  retryBaseMs: number;
};

type ParsedCommand =
  | { type: "block"; domain: string }
  | { type: "list" }
  | { type: "help" }
  | { type: "invalid"; reason: string };

function parseIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key}: expected a positive integer.`);
  }
  return parsed;
}

function parseNonNegativeIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${key}: expected a non-negative integer.`);
  }
  return parsed;
}

function parseCsvIdSet(value: string | undefined): Set<number> {
  if (!value) return new Set<number>();
  const result = new Set<number>();
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isFinite(parsed)) {
      result.add(parsed);
    }
  }
  return result;
}

function isValidDomainLabel(label: string): boolean {
  if (!label || label.length > 63) return false;
  if (label.startsWith("-") || label.endsWith("-")) return false;
  return /^[a-z0-9-]+$/.test(label);
}

function normalizeDomainCandidate(raw: string): string | null {
  const compact = raw.trim().toLowerCase();
  if (!compact) return null;

  let candidate = compact;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    try {
      candidate = new URL(candidate).hostname.toLowerCase();
    } catch {
      return null;
    }
  } else {
    candidate = candidate.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    candidate = candidate.split("/")[0];
    candidate = candidate.split("?")[0];
    candidate = candidate.split("#")[0];
  }

  candidate = candidate.replace(/\.+$/, "");
  if (candidate.startsWith("www.")) {
    candidate = candidate.slice(4);
  }
  candidate = candidate.split(":")[0];

  if (candidate.length < 4 || candidate.length > 253) return null;
  if (!candidate.includes(".")) return null;
  if (/[^a-z0-9.-]/.test(candidate)) return null;

  const labels = candidate.split(".");
  if (labels.some((label) => !isValidDomainLabel(label))) return null;
  if (labels.every((label) => /^\d+$/.test(label))) return null;
  return candidate;
}

function normalizeCommandToken(commandToken: string): string {
  const [head] = commandToken.split("@");
  return head.trim().toLowerCase();
}

function parseTelegramCommand(text: string): ParsedCommand | null {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const command = normalizeCommandToken(tokens[0]);

  if (command === "/start" || command === "/help") {
    return { type: "help" };
  }

  if (command === "/list") {
    if (tokens.length !== 1) {
      return { type: "invalid", reason: "Kullanim: /list" };
    }
    return { type: "list" };
  }

  if (command === "/block") {
    if (tokens.length !== 2) {
      return { type: "invalid", reason: "Kullanim: /block example.com" };
    }

    const normalized = normalizeDomainCandidate(tokens[1]);
    if (!normalized) {
      return { type: "invalid", reason: "Gecersiz domain. Ornek: /block example.com" };
    }
    return { type: "block", domain: normalized };
  }

  return null;
}

function buildHelpMessage(): string {
  return [
    "Kullanilabilir komutlar:",
    "/block example.com",
    "/list",
  ].join("\n");
}

function buildBlocklistMessages(domains: string[], version: number): string[] {
  if (domains.length === 0) {
    return [`Engel listesi bos. (v${version})`];
  }

  const maxMessageLength = 3600;
  const lines = domains.map((domain, index) => `${index + 1}. ${domain}`);
  const messages: string[] = [];
  let current = `Engel listesi v${version} (toplam ${domains.length}):\n`;

  for (const line of lines) {
    if (current.length + line.length + 1 > maxMessageLength) {
      messages.push(current.trimEnd());
      current = `...devam...\n${line}\n`;
      continue;
    }
    current += `${line}\n`;
  }

  if (current.trim().length > 0) {
    messages.push(current.trimEnd());
  }

  return messages;
}

function isAuthorizedMessage(config: WorkerConfig, message: TelegramMessage): boolean {
  const chatId = message.chat?.id;
  if (
    config.allowedChatIds.size > 0 &&
    (typeof chatId !== "number" || !config.allowedChatIds.has(chatId))
  ) {
    return false;
  }

  const fromId = message.from?.id;
  if (
    config.allowedUserIds.size > 0 &&
    (typeof fromId !== "number" || !config.allowedUserIds.has(fromId))
  ) {
    return false;
  }

  return true;
}

function pickMessage(update: TelegramUpdate): TelegramMessage | null {
  return (
    update.message ||
    update.edited_message ||
    update.channel_post ||
    update.edited_channel_post ||
    null
  );
}

async function readOffset(filePath: string): Promise<number> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { offset?: number };
    if (typeof parsed.offset === "number" && Number.isFinite(parsed.offset) && parsed.offset > 0) {
      return Math.floor(parsed.offset);
    }
    return 0;
  } catch {
    return 0;
  }
}

async function writeOffset(filePath: string, offset: number): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify({ offset }, null, 2), "utf8");
}

async function fetchTelegramUpdates(
  botToken: string,
  offset: number,
  timeoutSec: number,
  requestTimeoutMs: number,
  retries: number,
  retryBaseMs: number
): Promise<TelegramUpdate[]> {
  const params = new URLSearchParams();
  if (offset > 0) {
    params.set("offset", String(offset));
  }
  params.set("timeout", String(timeoutSec));
  params.set("allowed_updates", JSON.stringify(["message", "edited_message", "channel_post", "edited_channel_post"]));

  const url = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/getUpdates?${params.toString()}`;
  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
        requestTimeoutMs
      );

      if (!response.ok) {
        if (isRetryableHttpStatus(response.status) && attempt < maxAttempts) {
          const backoffMs = jitteredBackoff(attempt, retryBaseMs);
          console.warn(
            `Telegram getUpdates retrying after HTTP ${response.status} (attempt ${attempt}/${maxAttempts}, backoff=${backoffMs}ms)`
          );
          await sleep(backoffMs);
          continue;
        }
        throw new Error(`Telegram getUpdates failed (${response.status})`);
      }

      const body = (await response.json()) as TelegramUpdateApiResponse;
      if (!body.ok || !Array.isArray(body.result)) {
        throw new Error(`Telegram getUpdates returned error: ${body.description || "unknown"}`);
      }
      return body.result;
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < maxAttempts) {
        const backoffMs = jitteredBackoff(attempt, retryBaseMs);
        const code = extractErrorCode(error) || "UNKNOWN";
        console.warn(
          `Telegram getUpdates network retry (${code}) attempt ${attempt}/${maxAttempts}, backoff=${backoffMs}ms`
        );
        await sleep(backoffMs);
        continue;
      }
      throw error;
    }
  }

  return [];
}

async function postDomainsToIngest(
  ingestBaseUrl: string,
  ingestToken: string,
  domains: string[],
  dryRun: boolean,
  requestTimeoutMs: number,
  retries: number,
  retryBaseMs: number
): Promise<IngestResponse> {
  const endpoint = `${ingestBaseUrl.replace(/\/+$/, "")}/v1/internal/telegram/domains`;
  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ingestToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domains,
            source: "telegram-worker",
            reason: "auto-ingested from Telegram updates",
            dryRun,
          }),
        },
        requestTimeoutMs
      );

      const body = (await response.json().catch(() => ({}))) as IngestResponse;
      if (!response.ok) {
        if (isRetryableHttpStatus(response.status) && attempt < maxAttempts) {
          const backoffMs = jitteredBackoff(attempt, retryBaseMs);
          console.warn(
            `Telegram ingest retrying after HTTP ${response.status} (attempt ${attempt}/${maxAttempts}, backoff=${backoffMs}ms)`
          );
          await sleep(backoffMs);
          continue;
        }
        const errorMessage = body?.error?.message || `HTTP ${response.status}`;
        throw new Error(`Ingest request failed: ${errorMessage}`);
      }

      return body;
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < maxAttempts) {
        const backoffMs = jitteredBackoff(attempt, retryBaseMs);
        const code = extractErrorCode(error) || "UNKNOWN";
        console.warn(
          `Telegram ingest network retry (${code}) attempt ${attempt}/${maxAttempts}, backoff=${backoffMs}ms`
        );
        await sleep(backoffMs);
        continue;
      }
      throw error;
    }
  }

  return { ok: false };
}

async function fetchBlocklist(
  ingestBaseUrl: string,
  requestTimeoutMs: number,
  retries: number,
  retryBaseMs: number
): Promise<{ version: number; domains: string[] }> {
  const endpoint = `${ingestBaseUrl.replace(/\/+$/, "")}/v1/blocklist`;
  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
        requestTimeoutMs
      );

      if (!response.ok) {
        if (isRetryableHttpStatus(response.status) && attempt < maxAttempts) {
          const backoffMs = jitteredBackoff(attempt, retryBaseMs);
          console.warn(
            `Blocklist fetch retrying after HTTP ${response.status} (attempt ${attempt}/${maxAttempts}, backoff=${backoffMs}ms)`
          );
          await sleep(backoffMs);
          continue;
        }
        throw new Error(`Blocklist fetch failed (${response.status})`);
      }

      const body = (await response.json().catch(() => ({}))) as BlocklistApiResponse;
      const domains = Array.isArray(body?.domains) ? body.domains : null;
      const version =
        typeof body?.version === "number" && Number.isFinite(body.version) ? body.version : null;
      if (!domains || version === null) {
        throw new Error("Blocklist response malformed.");
      }
      return { version, domains };
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < maxAttempts) {
        const backoffMs = jitteredBackoff(attempt, retryBaseMs);
        const code = extractErrorCode(error) || "UNKNOWN";
        console.warn(
          `Blocklist fetch network retry (${code}) attempt ${attempt}/${maxAttempts}, backoff=${backoffMs}ms`
        );
        await sleep(backoffMs);
        continue;
      }
      throw error;
    }
  }

  throw new Error("Blocklist fetch retries exhausted.");
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  requestTimeoutMs: number,
  retries: number,
  retryBaseMs: number
): Promise<void> {
  const endpoint = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`;
  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
          }),
        },
        requestTimeoutMs
      );

      if (!response.ok) {
        if (isRetryableHttpStatus(response.status) && attempt < maxAttempts) {
          const backoffMs = jitteredBackoff(attempt, retryBaseMs);
          await sleep(backoffMs);
          continue;
        }
        throw new Error(`Telegram sendMessage failed (${response.status})`);
      }

      const body = (await response.json().catch(() => ({}))) as TelegramSendApiResponse;
      if (!body.ok) {
        if (attempt < maxAttempts) {
          const backoffMs = jitteredBackoff(attempt, retryBaseMs);
          await sleep(backoffMs);
          continue;
        }
        throw new Error(`Telegram sendMessage error: ${body.description || "unknown"}`);
      }
      return;
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < maxAttempts) {
        const backoffMs = jitteredBackoff(attempt, retryBaseMs);
        await sleep(backoffMs);
        continue;
      }
      throw error;
    }
  }
}

function humanizeSkipReason(reason: string | undefined): string {
  switch (reason) {
    case "already_exists":
      return "Zaten engel listesinde.";
    case "invalid_domain":
      return "Gecersiz domain.";
    case "duplicate_in_request":
      return "Ayni istekte tekrar eden domain.";
    default:
      return "Islem atlandi.";
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function isProductionEnv(): boolean {
  return (process.env.NODE_ENV || "").trim().toLowerCase() === "production";
}

function parseBooleanEnv(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitteredBackoff(attempt: number, baseMs: number): number {
  const cappedAttempt = Math.max(1, Math.min(attempt, 6));
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(baseMs * 2 ** (cappedAttempt - 1) * jitter);
}

function extractErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || !error) return undefined;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && code) return code;
  const cause = (error as { cause?: { code?: unknown } }).cause;
  if (cause && typeof cause.code === "string" && cause.code) return cause.code;
  return undefined;
}

function isRetryableNetworkError(error: unknown): boolean {
  const retryableCodes = new Set([
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EAI_AGAIN",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_SOCKET",
    "ABORT_ERR",
  ]);
  const code = extractErrorCode(error);
  if (code && retryableCodes.has(code)) {
    return true;
  }

  const message =
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message.toLowerCase()
      : "";
  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("socket") ||
    message.includes("timed out")
  );
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function runSinglePass(config: WorkerConfig, offset: number): Promise<number> {
  const updates = await fetchTelegramUpdates(
    config.botToken,
    offset,
    config.timeoutSec,
    config.telegramHttpTimeoutMs,
    config.telegramFetchRetries,
    config.retryBaseMs
  );
  if (updates.length === 0) {
    console.log("No new Telegram updates.");
    return offset;
  }

  let nextOffset = offset;
  let blockCommands = 0;
  let listCommands = 0;
  let helpCommands = 0;
  let ignored = 0;
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const update of updates) {
    if (update.update_id + 1 > nextOffset) {
      nextOffset = update.update_id + 1;
    }

    const message = pickMessage(update);
    if (!message) continue;
    const text = message?.text?.trim() || "";
    if (!text) continue;

    if (!isAuthorizedMessage(config, message)) {
      ignored += 1;
      continue;
    }

    const chatId = message?.chat?.id;
    if (typeof chatId !== "number") {
      ignored += 1;
      continue;
    }

    const command = parseTelegramCommand(text);
    if (!command) {
      ignored += 1;
      continue;
    }

    if (command.type === "invalid") {
      await sendTelegramMessage(
        config.botToken,
        chatId,
        `${command.reason}\n${buildHelpMessage()}`,
        config.telegramHttpTimeoutMs,
        config.telegramFetchRetries,
        config.retryBaseMs
      );
      continue;
    }

    if (command.type === "help") {
      helpCommands += 1;
      await sendTelegramMessage(
        config.botToken,
        chatId,
        buildHelpMessage(),
        config.telegramHttpTimeoutMs,
        config.telegramFetchRetries,
        config.retryBaseMs
      );
      continue;
    }

    if (command.type === "list") {
      listCommands += 1;
      const listData = await fetchBlocklist(
        config.ingestBaseUrl,
        config.telegramHttpTimeoutMs,
        config.ingestRetries,
        config.retryBaseMs
      );
      const chunks = buildBlocklistMessages(listData.domains, listData.version);
      for (const chunkText of chunks) {
        await sendTelegramMessage(
          config.botToken,
          chatId,
          chunkText,
          config.telegramHttpTimeoutMs,
          config.telegramFetchRetries,
          config.retryBaseMs
        );
        await sleep(150);
      }
      continue;
    }

    blockCommands += 1;
    const result = await postDomainsToIngest(
      config.ingestBaseUrl,
      config.ingestToken,
      [command.domain],
      config.dryRun,
      config.telegramHttpTimeoutMs,
      config.ingestRetries,
      config.retryBaseMs
    );
    const addedCount = Number(result.addedCount || 0);
    const skippedCount = Array.isArray(result.skipped) ? result.skipped.length : 0;
    totalAdded += addedCount;
    totalSkipped += skippedCount;

    const addedDomain =
      Array.isArray(result.added) && result.added.length > 0 ? result.added[0] : command.domain;
    const skippedReason =
      Array.isArray(result.skipped) && result.skipped.length > 0
        ? humanizeSkipReason(result.skipped[0]?.reason)
        : "";

    const replyText =
      addedCount > 0
        ? `${config.dryRun ? "[dry-run] " : ""}Engellendi: ${addedDomain}`
        : `${command.domain} icin islem yok. ${skippedReason}`;
    await sendTelegramMessage(
      config.botToken,
      chatId,
      replyText,
      config.telegramHttpTimeoutMs,
      config.telegramFetchRetries,
      config.retryBaseMs
    );
  }

  await writeOffset(config.offsetFile, nextOffset);

  if (blockCommands === 0 && listCommands === 0 && helpCommands === 0) {
    console.log(
      `Telegram updates processed, no supported command found. updates=${updates.length} ignored=${ignored}`
    );
    return nextOffset;
  }

  console.log(
    `Telegram command processing completed. updates=${updates.length} block=${blockCommands} list=${listCommands} help=${helpCommands} ignored=${ignored} added=${totalAdded} skipped=${totalSkipped} dryRun=${config.dryRun}`
  );
  return nextOffset;
}

function readConfig(): WorkerConfig | null {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const ingestToken = (process.env.TELEGRAM_INGEST_TOKEN || "").trim();
  const ingestBaseUrl = (process.env.TELEGRAM_INGEST_BASE_URL || "http://localhost:3000").trim();
  const offsetFile = path.resolve(process.env.TELEGRAM_OFFSET_FILE || "./data/telegram-offset.json");
  const timeoutSec = parseIntEnv("TELEGRAM_POLL_TIMEOUT_SEC", 5);
  const maxBatch = parseIntEnv(
    "TELEGRAM_WORKER_MAX_BATCH",
    parseIntEnv("TELEGRAM_INGEST_MAX_DOMAINS", 50)
  );
  const dryRun = parseBooleanEnv(process.env.TELEGRAM_DRY_RUN, false);
  const allowedChatIds = parseCsvIdSet(process.env.TELEGRAM_ALLOWED_CHAT_IDS);
  const allowedUserIds = parseCsvIdSet(process.env.TELEGRAM_ALLOWED_USER_IDS);
  const idleDelayMs = parseIntEnv("TELEGRAM_IDLE_DELAY_MS", 2000);
  const errorBackoffMs = parseIntEnv("TELEGRAM_ERROR_BACKOFF_MS", 10000);
  const telegramHttpTimeoutMs = parseIntEnv("TELEGRAM_HTTP_TIMEOUT_MS", 15000);
  const telegramFetchRetries = parseNonNegativeIntEnv("TELEGRAM_FETCH_RETRIES", 3);
  const ingestRetries = parseNonNegativeIntEnv("TELEGRAM_INGEST_RETRIES", 2);
  const retryBaseMs = parseIntEnv("TELEGRAM_RETRY_BASE_MS", 1500);

  const missing: string[] = [];
  if (!botToken) {
    missing.push("TELEGRAM_BOT_TOKEN");
  }
  if (!ingestToken) {
    missing.push("TELEGRAM_INGEST_TOKEN");
  }

  if (missing.length > 0) {
    if (isProductionEnv()) {
      throw new Error(`${missing.join(" and ")} is required.`);
    }
    console.warn(
      `Telegram worker disabled in non-production: missing ${missing.join(
        ", "
      )}. Add them to backend/.env and restart worker.`
    );
    return null;
  }

  return {
    botToken,
    ingestToken,
    ingestBaseUrl,
    offsetFile,
    timeoutSec,
    maxBatch,
    dryRun,
    allowedChatIds,
    allowedUserIds,
    idleDelayMs,
    errorBackoffMs,
    telegramHttpTimeoutMs,
    telegramFetchRetries,
    ingestRetries,
    retryBaseMs,
  };
}

async function main(): Promise<void> {
  const runOnce = process.argv.includes("--once");
  const continuous =
    !runOnce && parseBooleanEnv(process.env.TELEGRAM_WORKER_CONTINUOUS, false);
  const config = readConfig();

  if (!config) {
    if (runOnce || !continuous) {
      return;
    }
    while (true) {
      await sleep(60_000);
    }
    return;
  }

  let offset = await readOffset(config.offsetFile);

  if (!continuous) {
    await runSinglePass(config, offset);
    return;
  }

  console.log(
    `Telegram worker started in continuous mode. pollTimeoutSec=${config.timeoutSec} httpTimeoutMs=${config.telegramHttpTimeoutMs} fetchRetries=${config.telegramFetchRetries} ingestRetries=${config.ingestRetries} allowedChats=${config.allowedChatIds.size} allowedUsers=${config.allowedUserIds.size} idleDelayMs=${config.idleDelayMs} errorBackoffMs=${config.errorBackoffMs}`
  );

  while (true) {
    try {
      offset = await runSinglePass(config, offset);
      await sleep(config.idleDelayMs);
    } catch (error) {
      const code = extractErrorCode(error) || "UNKNOWN";
      const message =
        typeof error === "object" &&
        error &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : String(error);
      console.error(`Telegram worker pass failed: code=${code} message=${message}`);
      await sleep(config.errorBackoffMs);
    }
  }
}

main().catch((error) => {
  const code = extractErrorCode(error) || "UNKNOWN";
  const message =
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : String(error);
  console.error(`Telegram ingest worker failed: code=${code} message=${message}`);
  process.exit(1);
});
