/**
 * Junkman-style classification model.
 *
 * The classifier maps every SMS to one of four top-level actions, mirroring
 * iOS `ILMessageFilterAction` so the result drops straight into the
 * MessageFilterExtension without translation:
 *
 *   - allow        → Normal mail; stays in the user's inbox
 *   - transaction  → Bank OTP, cargo, e-government; PROTECTED, never junked
 *   - promotion    → Marketing/discount SMS; goes to the Promotions tab
 *   - junk         → Gambling, scam, political ads, phishing; goes to Junk
 *
 * `junkSubtype` carries the *reason* something hit Junk so the UI can show
 * the user "kumar tespit edildi" rather than a generic "spam".
 */
export type SmsAction = 'allow' | 'transaction' | 'promotion' | 'junk';

export type JunkSubtype = 'gambling' | 'scam' | 'political' | 'spam';

export enum SpamCategory {
  NORMAL = 'normal',
  TRANSACTION = 'transaction',
  PROMOTION = 'promotion',
  JUNK = 'junk',
}

export interface SpamDetectionResult {
  isSpam: boolean;
  category: SpamCategory;
  action: SmsAction;
  junkSubtype: JunkSubtype | null;
  confidence: number;
  reasons: string[];
  matchedKeywords: string[];
  matchedPatterns: string[];
}

export interface SMSMessage {
  body: string;
  sender: string;
  timestamp?: number;
}

export interface FilterSettings {
  enabled: boolean;
  customKeywords: string[];
  autoDeleteDays: number | null;
  strictMode: boolean;
  communityListEnabled: boolean;
}
