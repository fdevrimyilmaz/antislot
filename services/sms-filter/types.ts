export enum SpamCategory {
  GAMBLING = 'gambling',
  SCAM = 'scam',
  ADVERTISEMENT = 'advertisement',
  NORMAL = 'normal',
}

export interface SpamDetectionResult {
  isSpam: boolean;
  category: SpamCategory;
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
}
