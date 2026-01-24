/**
 * AntiSlot Backend Yapılandırması
 */

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // İmza üretimi için HMAC gizli anahtarı
  // Üretimde ortam değişkeni veya gizli yönetim hizmeti kullanın
  hmacSecret: process.env.HMAC_SECRET || 'antislot-secret-key-change-in-production',
  
  // Önbellek ayarları
  cacheControl: {
    blocklist: 'public, max-age=3600, must-revalidate', // 1 saat
    patterns: 'public, max-age=7200, must-revalidate',  // 2 saat
    health: 'no-cache'
  },
  
  // Dosya yolları
  dataDir: process.env.DATA_DIR || './data',
  blocklistFile: process.env.BLOCKLIST_FILE || './data/blocklist.json',
  patternsFile: process.env.PATTERNS_FILE || './data/patterns.json',
  
  // Değişikliklerde sürüm artırma
  autoVersionBump: process.env.AUTO_VERSION_BUMP !== 'false',

  // Yapay zeka (ChatGPT) ayarları
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openAiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openAiTimeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '15000', 10),
  openAiMaxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '300', 10)
};
