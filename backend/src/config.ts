/**
 * AntiSlot Backend Configuration
 */

/** Only Google Gemini is supported. The mobile-app consent prompt and
 *  the App Privacy declaration name Google as the sole AI processor; do
 *  not reintroduce other providers without updating those disclosures. */
export type AiProvider = 'gemini';

function parseAccessCodes(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length > 0);
}

function parseAdminChatIds(raw: string | undefined): number[] {
  return (raw || '')
    .split(',')
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value));
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Secret key for signature generation.
  hmacSecret: process.env.HMAC_SECRET || 'antislot-secret-key-change-in-production',

  // Cache headers
  cacheControl: {
    blocklist: 'public, max-age=3600, must-revalidate',
    patterns: 'public, max-age=7200, must-revalidate',
    health: 'no-cache'
  },

  // File paths
  dataDir: process.env.DATA_DIR || './data',
  blocklistFile: process.env.BLOCKLIST_FILE || './data/blocklist.json',
  patternsFile: process.env.PATTERNS_FILE || './data/patterns.json',

  // Versioning behavior
  autoVersionBump: process.env.AUTO_VERSION_BUMP !== 'false',

  // AI provider (Google Gemini — the only supported provider)
  aiProvider: 'gemini' as AiProvider,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiBaseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  // 2048 covers ~1100–1400 Turkish words — well beyond any single reply
  // we expect, but bounded so user overrides can't balloon the call.
  geminiMaxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '2048', 10),

  // Premium access codes (server-side validation). Comma-separated list via env.
  // Codes are normalized to uppercase. If empty, the redeem endpoint refuses all attempts.
  premiumAccessCodes: parseAccessCodes(process.env.PREMIUM_ACCESS_CODES),

  // Telegram admin bot — for admin-only blocklist management.
  // The webhook path is `/v1/telegram/webhook/<secret>`; the secret MUST match.
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  telegramAdminChatIds: parseAdminChatIds(process.env.TELEGRAM_ADMIN_CHAT_IDS),
};
