/**
 * Telegram admin bot integration.
 *
 * The blocklist is admin-managed: end users of the mobile app cannot add or
 * remove blocked domains. An operator sends commands to the Telegram bot, and
 * this service handles them after verifying admin membership.
 *
 * Setup
 * -----
 * 1. Create a bot via @BotFather and obtain a token.
 * 2. Generate a long random TELEGRAM_WEBHOOK_SECRET (e.g. `openssl rand -hex 32`).
 * 3. Set the webhook:
 *    curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *         -d "url=https://api.antislot.app/v1/telegram/webhook/<SECRET>" \
 *         -d "secret_token=<SECRET>"
 * 4. Get your chat ID by messaging the bot once, then add it to
 *    TELEGRAM_ADMIN_CHAT_IDS (comma-separated list of numeric IDs).
 *
 * Supported commands
 * ------------------
 *   /block <domain>     Probe and (if alive) add to the blocklist.
 *   /unblock <domain>   Remove a domain from the blocklist.
 *   /check <domain>     Probe a domain without modifying the list.
 *   /list [n]           Show the last N domains (default 20, max 100).
 *   /help               Print this help text.
 */

import type { BlocklistStorage } from '../storage/blocklist-storage';
import { normalizeDomain, probeDomain } from './domain-probe';
import { config } from '../config';

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
    from?: { username?: string; first_name?: string };
  };
};

const TELEGRAM_API = 'https://api.telegram.org';
const LIST_DEFAULT = 20;
const LIST_MAX = 100;

function isAdminChat(chatId: number | undefined): boolean {
  if (typeof chatId !== 'number') return false;
  return config.telegramAdminChatIds.includes(chatId);
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  const token = config.telegramBotToken;
  if (!token) return;
  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Best-effort: never throw from notification path.
  }
}

function helpText(): string {
  return [
    '*Antislot Admin Bot*',
    '',
    '`/block <domain>`  — alan adını doğrula ve listeye ekle',
    '`/unblock <domain>`  — listeden çıkar',
    '`/check <domain>`  — sadece doğrula',
    '`/list [n]`  — son n alan adı (varsayılan 20)',
    '`/help`  — bu yardım metni',
    '',
    'Yalnızca yapılandırılmış admin chat ID listesi yanıt alır.',
  ].join('\n');
}

function fmtProbe(result: Awaited<ReturnType<typeof probeDomain>>): string {
  const lines: string[] = [];
  lines.push(`Domain: \`${result.domain}\``);
  lines.push(`Durum: ${result.alive ? '✅ aktif' : '⛔ pasif'}`);
  lines.push(`DNS: ${result.dns.ok ? `OK (${result.dns.addresses?.[0] ?? '?'})` : `FAIL (${result.dns.error ?? '?'})`}`);
  if (result.http.ok || result.http.error !== 'skipped') {
    lines.push(`HTTP: ${result.http.ok ? `${result.http.status}` : `FAIL (${result.http.error ?? '?'})`}`);
  }
  lines.push(`Süre: ${result.durationMs}ms`);
  return lines.join('\n');
}

type Handler = (args: string[], storage: BlocklistStorage) => Promise<string>;

const handlers: Record<string, Handler> = {
  '/help': async () => helpText(),
  '/start': async () => helpText(),

  '/block': async (args, storage) => {
    const raw = args[0];
    if (!raw) return 'Kullanım: `/block <domain>`';
    const domain = normalizeDomain(raw);
    if (!domain) return `⚠️ Geçersiz alan adı: \`${raw}\``;
    const result = await probeDomain(domain);
    if (!result.alive) {
      return [
        '❌ Domain doğrulanamadı, listeye eklenmedi.',
        '',
        fmtProbe(result),
      ].join('\n');
    }
    await storage.addDomain(domain, 'telegram-admin');
    return [
      '✅ Engel listesine eklendi.',
      '',
      fmtProbe(result),
    ].join('\n');
  },

  '/unblock': async (args, storage) => {
    const raw = args[0];
    if (!raw) return 'Kullanım: `/unblock <domain>`';
    const domain = normalizeDomain(raw);
    if (!domain) return `⚠️ Geçersiz alan adı: \`${raw}\``;
    const removed = await storage.removeDomain(domain);
    return removed
      ? `🗑️ Kaldırıldı: \`${domain}\``
      : `ℹ️ Listede yok: \`${domain}\``;
  },

  '/check': async (args) => {
    const raw = args[0];
    if (!raw) return 'Kullanım: `/check <domain>`';
    const domain = normalizeDomain(raw);
    if (!domain) return `⚠️ Geçersiz alan adı: \`${raw}\``;
    const result = await probeDomain(domain);
    return fmtProbe(result);
  },

  '/list': async (args, storage) => {
    const parsed = args[0] ? parseInt(args[0], 10) : LIST_DEFAULT;
    const n = Number.isFinite(parsed) ? Math.min(LIST_MAX, Math.max(1, parsed)) : LIST_DEFAULT;
    const domains = await storage.getDomains();
    const tail = domains.slice(-n);
    if (tail.length === 0) return 'Liste boş.';
    return [
      `*Engel Listesi* — toplam ${domains.length}, son ${tail.length}:`,
      '',
      tail.map((d) => `• \`${d}\``).join('\n'),
    ].join('\n');
  },
};

function parseCommand(text: string): { command: string; args: string[] } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;
  // Strip @botname suffix from "/block@my_bot"
  const tokens = trimmed.split(/\s+/);
  const head = tokens[0].split('@')[0].toLowerCase();
  return { command: head, args: tokens.slice(1) };
}

export type HandleUpdateResult = {
  ok: boolean;
  reason?: 'no_bot_token' | 'no_message' | 'not_admin' | 'unknown_command' | 'handler_error';
};

export async function handleTelegramUpdate(
  update: TelegramUpdate,
  storage: BlocklistStorage,
  logger?: { error?: (...args: unknown[]) => void }
): Promise<HandleUpdateResult> {
  if (!config.telegramBotToken) {
    return { ok: false, reason: 'no_bot_token' };
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  const text = message?.text;
  if (!message || typeof chatId !== 'number' || !text) {
    return { ok: false, reason: 'no_message' };
  }

  if (!isAdminChat(chatId)) {
    // Silently drop non-admin chats; do not respond to avoid revealing the bot.
    return { ok: false, reason: 'not_admin' };
  }

  const parsed = parseCommand(text);
  if (!parsed) {
    await sendMessage(chatId, helpText());
    return { ok: true };
  }

  const handler = handlers[parsed.command];
  if (!handler) {
    await sendMessage(chatId, `Bilinmeyen komut: \`${parsed.command}\`\n\n${helpText()}`);
    return { ok: false, reason: 'unknown_command' };
  }

  try {
    const reply = await handler(parsed.args, storage);
    await sendMessage(chatId, reply);
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown error';
    logger?.error?.({ command: parsed.command, error: msg }, 'telegram handler failed');
    await sendMessage(chatId, `❌ Komut başarısız: \`${msg}\``);
    return { ok: false, reason: 'handler_error' };
  }
}
