/**
 * AntiSlot Backend Configuration
 */

export type AiProvider = 'gemini' | 'openai';

function resolveAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  if (raw === 'gemini') return 'gemini';
  if (raw === 'openai') return 'openai';
  if ((process.env.GEMINI_API_KEY || '').trim()) return 'gemini';
  return 'openai';
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

  // AI provider and model settings
  aiProvider: resolveAiProvider(),
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openAiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openAiTimeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '15000', 10),
  openAiMaxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '300', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiBaseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
};
