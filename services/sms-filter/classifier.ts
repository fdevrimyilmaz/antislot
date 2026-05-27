import {
  JunkSubtype,
  SmsAction,
  SMSMessage,
  SpamCategory,
  SpamDetectionResult,
} from './types';
import {
  GAMBLING_KEYWORDS,
  SCAM_KEYWORDS,
  POLITICAL_KEYWORDS,
  PROMOTION_KEYWORDS,
  TRANSACTION_KEYWORDS,
} from './keywords';
import { SPAM_PATTERNS, analyzeSenderPattern } from './patterns';

export interface ClassifierOptions {
  customKeywords?: string[];
  communityKeywords?: string[];
  strictMode?: boolean;
}

/**
 * Junkman-style SMS classifier — fully on-device, deterministic.
 *
 * Decision flow:
 *   1. Score signals: gambling / scam / political / promo keyword & regex hits.
 *   2. Score the transaction SHIELD. Strong transaction signals (e.g. an OTP
 *      keyword + a short numeric code in the body) HARD-PIN the action to
 *      `transaction` so we never junk a real bank/cargo SMS.
 *   3. Without shield protection, the highest-scoring junk-flavored category
 *      wins, gated by `strictMode`'s lower threshold.
 *
 * The output `action` maps 1:1 to iOS `ILMessageFilterAction`, so the iOS
 * extension can take it as-is.
 */
export class SMSClassifier {
  private customKeywords: string[];
  private communityKeywords: string[];
  private strictMode: boolean;

  constructor(options: ClassifierOptions = {}) {
    this.customKeywords = options.customKeywords ?? [];
    this.communityKeywords = options.communityKeywords ?? [];
    this.strictMode = options.strictMode ?? false;
  }

  classify(message: SMSMessage): SpamDetectionResult {
    const body = message.body.toLowerCase().trim();
    const sender = message.sender ?? '';

    const matchedKeywords: string[] = [];
    const matchedPatterns: string[] = [];
    const reasons: string[] = [];

    const customHits = this.checkKeywords(body, this.customKeywords);
    const communityHits = this.checkKeywords(body, this.communityKeywords);
    const gamblingHits = this.checkKeywords(body, [
      ...GAMBLING_KEYWORDS.turkish, ...GAMBLING_KEYWORDS.english,
    ]);
    const scamHits = this.checkKeywords(body, [
      ...SCAM_KEYWORDS.turkish, ...SCAM_KEYWORDS.english,
    ]);
    const politicalHits = this.checkKeywords(body, [
      ...POLITICAL_KEYWORDS.turkish, ...POLITICAL_KEYWORDS.english,
    ]);
    const promotionHits = this.checkKeywords(body, [
      ...PROMOTION_KEYWORDS.turkish, ...PROMOTION_KEYWORDS.english,
    ]);
    const transactionHits = this.checkKeywords(body, [
      ...TRANSACTION_KEYWORDS.turkish, ...TRANSACTION_KEYWORDS.english,
    ]);

    matchedKeywords.push(
      ...customHits, ...communityHits, ...gamblingHits, ...scamHits,
      ...politicalHits, ...promotionHits, ...transactionHits,
    );

    let gamblingScore = gamblingHits.length * 0.6;
    let scamScore = scamHits.length * 0.8;
    let politicalScore = politicalHits.length * 0.7;
    let promotionScore = promotionHits.length * 0.4;
    let transactionScore = transactionHits.length * 0.9;

    if (customHits.length > 0) {
      gamblingScore += customHits.length * 0.9;
      reasons.push(`${customHits.length} özel anahtar kelime eşleşti`);
    }
    if (communityHits.length > 0) {
      gamblingScore += communityHits.length * 0.7;
      reasons.push(`${communityHits.length} topluluk listesi kelimesi eşleşti`);
    }
    if (gamblingHits.length > 0) reasons.push(`Kumar: ${gamblingHits.length} kelime`);
    if (scamHits.length > 0) reasons.push(`Dolandırıcılık: ${scamHits.length} kelime`);
    if (politicalHits.length > 0) reasons.push(`Siyasi reklam: ${politicalHits.length} kelime`);
    if (promotionHits.length > 0) reasons.push(`Promosyon: ${promotionHits.length} kelime`);
    if (transactionHits.length > 0) reasons.push(`İşlem sinyali: ${transactionHits.length} kelime`);

    for (const pattern of SPAM_PATTERNS) {
      if (pattern.regex.test(body)) {
        matchedPatterns.push(pattern.description);
        reasons.push(`Desen: ${pattern.description}`);
        if (pattern.category === 'gambling') gamblingScore += 0.5;
        else if (pattern.category === 'scam') scamScore += 0.5;
        else if (pattern.category === 'advertisement') promotionScore += 0.3;
      }
      pattern.regex.lastIndex = 0;
    }

    const hasUrl = /https?:\/\/|www\.|bit\.ly|tinyurl/i.test(body);
    const hasShortNumericCode = /\b\d{4,8}\b/.test(message.body);

    if (hasUrl) {
      if (gamblingHits.length > 0) gamblingScore += 0.5;
      if (scamHits.length > 0) scamScore += 0.5;
      if (politicalHits.length > 0) politicalScore += 0.4;
    }

    if (sender) {
      const senderAnalysis = analyzeSenderPattern(sender);
      if (senderAnalysis.isSuspicious) {
        reasons.push(...senderAnalysis.reasons);
        scamScore += 0.2;
      }
    }

    // Transaction shield: a strong OTP/bank signal pins the action.
    // We require either two distinct transaction keywords, or one keyword
    // plus a short numeric code — the canonical OTP shape.
    const shielded =
      transactionHits.length >= 2 ||
      (transactionHits.length >= 1 && hasShortNumericCode);

    if (shielded) {
      return finalize({
        category: SpamCategory.TRANSACTION,
        action: 'transaction',
        junkSubtype: null,
        confidence: clamp01(0.6 + transactionScore * 0.2),
        reasons: ['İşlem korumalı: doğrulama kodu / banka / kargo sinyali baskın', ...reasons],
        matchedKeywords,
        matchedPatterns,
      });
    }

    const scores: { subtype: JunkSubtype; score: number }[] = [
      { subtype: 'gambling', score: gamblingScore },
      { subtype: 'scam', score: scamScore },
      { subtype: 'political', score: politicalScore },
    ];
    scores.sort((a, b) => b.score - a.score);
    const topJunk = scores[0];

    const junkThreshold = this.strictMode ? 0.55 : 0.85;
    const promoThreshold = this.strictMode ? 0.45 : 0.7;

    if (topJunk.score >= junkThreshold) {
      return finalize({
        category: SpamCategory.JUNK,
        action: 'junk',
        junkSubtype: topJunk.subtype,
        confidence: clamp01(topJunk.score / 2.0),
        reasons,
        matchedKeywords,
        matchedPatterns,
      });
    }

    if (promotionScore >= promoThreshold) {
      return finalize({
        category: SpamCategory.PROMOTION,
        action: 'promotion',
        junkSubtype: null,
        confidence: clamp01(promotionScore / 1.5),
        reasons,
        matchedKeywords,
        matchedPatterns,
      });
    }

    return finalize({
      category: SpamCategory.NORMAL,
      action: 'allow',
      junkSubtype: null,
      confidence: clamp01(Math.max(topJunk.score, promotionScore) / 2.0),
      reasons: reasons.length > 0 ? reasons : ['Zayıf veya hiç sinyal yok'],
      matchedKeywords,
      matchedPatterns,
    });
  }

  classifyBatch(messages: SMSMessage[]): SpamDetectionResult[] {
    return messages.map((m) => this.classify(m));
  }

  private checkKeywords(body: string, keywords: string[]): string[] {
    const matches: string[] = [];
    for (const keyword of keywords) {
      const lower = keyword.toLowerCase();
      // Multi-word phrases bypass the word-boundary check (\b doesn't span spaces).
      if (lower.includes(' ')) {
        if (body.includes(lower)) matches.push(keyword);
        continue;
      }
      const rx = new RegExp(`\\b${escapeRegex(lower)}\\b`, 'i');
      if (rx.test(body)) matches.push(keyword);
    }
    return matches;
  }
}

function finalize(partial: Omit<SpamDetectionResult, 'isSpam'>): SpamDetectionResult {
  const isSpam =
    partial.category === SpamCategory.JUNK ||
    partial.category === SpamCategory.PROMOTION;
  return {
    ...partial,
    isSpam,
    confidence: Math.round(partial.confidence * 100) / 100,
    matchedKeywords: [...new Set(partial.matchedKeywords)],
    matchedPatterns: [...new Set(partial.matchedPatterns)],
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export type { SmsAction };
