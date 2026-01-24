import { SpamCategory, SpamDetectionResult, SMSMessage } from './types';
import { GAMBLING_KEYWORDS, SCAM_KEYWORDS, ADVERTISEMENT_KEYWORDS } from './keywords';
import { SPAM_PATTERNS, analyzeSenderPattern } from './patterns';

export interface ClassifierOptions {
  customKeywords?: string[];
  strictMode?: boolean;
}

export class SMSClassifier {
  private customKeywords: string[];
  private strictMode: boolean;

  constructor(options: ClassifierOptions = {}) {
    this.customKeywords = options.customKeywords || [];
    this.strictMode = options.strictMode || false;
  }

  /**
   * Classify an SMS message
   */
  classify(message: SMSMessage): SpamDetectionResult {
    const body = message.body.toLowerCase().trim();
    const sender = message.sender || '';

    const matchedKeywords: string[] = [];
    const matchedPatterns: string[] = [];
    const reasons: string[] = [];
    let confidence = 0;
    let keywordScore = 0;
    let patternScore = 0;
    let category = SpamCategory.NORMAL;

    const customMatches = this.checkKeywords(body, this.customKeywords);
    if (customMatches.length > 0) {
      matchedKeywords.push(...customMatches);
      keywordScore += 0.9 * customMatches.length;
      reasons.push(`Matched ${customMatches.length} custom keyword(s)`);
      category = SpamCategory.GAMBLING; // Assume gambling for custom keywords
    }

    // Check gambling keywords
    const gamblingMatches = this.checkKeywords(body, [
      ...GAMBLING_KEYWORDS.turkish,
      ...GAMBLING_KEYWORDS.english,
    ]);
    if (gamblingMatches.length > 0) {
      matchedKeywords.push(...gamblingMatches);
      keywordScore += 0.6 * gamblingMatches.length;
      reasons.push(`Matched ${gamblingMatches.length} gambling keyword(s)`);
      if (category === SpamCategory.NORMAL) {
        category = SpamCategory.GAMBLING;
      }
    }

    const scamMatches = this.checkKeywords(body, [
      ...SCAM_KEYWORDS.turkish,
      ...SCAM_KEYWORDS.english,
    ]);
    if (scamMatches.length > 0) {
      matchedKeywords.push(...scamMatches);
      keywordScore += 0.8 * scamMatches.length;
      reasons.push(`Matched ${scamMatches.length} scam keyword(s)`);
      if (category === SpamCategory.NORMAL || category === SpamCategory.ADVERTISEMENT) {
        category = SpamCategory.SCAM;
      }
    }

    const adMatches = this.checkKeywords(body, [
      ...ADVERTISEMENT_KEYWORDS.turkish,
      ...ADVERTISEMENT_KEYWORDS.english,
    ]);
    if (adMatches.length > 0 && category === SpamCategory.NORMAL) {
      matchedKeywords.push(...adMatches);
      keywordScore += 0.4 * adMatches.length;
      reasons.push(`Matched ${adMatches.length} advertisement keyword(s)`);
      category = SpamCategory.ADVERTISEMENT;
    }

    for (const pattern of SPAM_PATTERNS) {
      const matches = body.match(pattern.regex);
      if (matches) {
        matchedPatterns.push(pattern.description);
        patternScore += 0.5;
        reasons.push(`Matched pattern: ${pattern.description}`);

        if (category === SpamCategory.NORMAL) {
          if (pattern.category === 'gambling') category = SpamCategory.GAMBLING;
          else if (pattern.category === 'scam') category = SpamCategory.SCAM;
          else if (pattern.category === 'advertisement') category = SpamCategory.ADVERTISEMENT;
        }
      }
    }

    if (sender) {
      const senderAnalysis = analyzeSenderPattern(sender);
      if (senderAnalysis.isSuspicious) {
        reasons.push(...senderAnalysis.reasons);
        confidence += 0.3;
      }
    }

    // Stronger signals
    const hasUrl = /https?:\/\/|www\./i.test(body);
    if (hasUrl && gamblingMatches.length > 0) {
      confidence += 0.5;
      reasons.push('Contains URL with gambling keywords');
      category = SpamCategory.GAMBLING;
    }
    if (hasUrl && scamMatches.length > 0) {
      confidence += 0.5;
      reasons.push('Contains URL with scam keywords');
      category = SpamCategory.SCAM;
    }
    if (matchedPatterns.length >= 2) {
      confidence += 0.4;
    }
    if (matchedKeywords.length >= 3) {
      confidence += 0.4;
    }

    const totalScore = keywordScore + patternScore + confidence;
    confidence = Math.min(1, totalScore / (this.strictMode ? 1.4 : 2.1));
    const threshold = this.strictMode ? 0.35 : 0.5;
    const isSpam = confidence >= threshold && category !== SpamCategory.NORMAL;

    return {
      isSpam,
      category,
      confidence: Math.round(confidence * 100) / 100,
      reasons,
      matchedKeywords: [...new Set(matchedKeywords)],
      matchedPatterns: [...new Set(matchedPatterns)],
    };
  }

  private checkKeywords(body: string, keywords: string[]): string[] {
    const matches: string[] = [];

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(keywordLower)}\\b`, 'gi');
      if (wordBoundaryRegex.test(body)) {
        matches.push(keyword);
      } else if (keywordLower.includes(' ') && body.includes(keywordLower)) {
        matches.push(keyword);
      }
    }

    return matches;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  classifyBatch(messages: SMSMessage[]): SpamDetectionResult[] {
    return messages.map(msg => this.classify(msg));
  }
}
