import { ADVERTISEMENT_KEYWORDS, GAMBLING_KEYWORDS, SAFE_TRANSACTIONAL_KEYWORDS, SCAM_KEYWORDS } from "./keywords";
import { analyzeSenderPattern, SPAM_PATTERNS } from "./patterns";
import { normalizeSmsKeyword, normalizeSmsText, toCompactSmsText } from "./normalize";
import { SpamCategory, SpamDetectionResult, SMSMessage } from "./types";

export interface ClassifierOptions {
  customKeywords?: string[];
  strictMode?: boolean;
}

type JunkSignalInput = {
  rawBody: string;
  normalizedBody: string;
  sender: string;
  hasUrl: boolean;
  hasShortUrl: boolean;
  hasSuspiciousTld: boolean;
  hasScamKeyword: boolean;
  hasAdKeyword: boolean;
  hasGamblingKeyword: boolean;
  senderSuspicious: boolean;
};

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const SHORT_URL_REGEX = /(bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly|adf\.ly|shorte\.st|cutt\.ly|rb\.gy|lnk\.bio)/i;
const SUSPICIOUS_TLD_REGEX = /\b[a-z0-9-]+\.(xyz|top|click|shop|win|live|bet|vip|pw|sbs)\b/i;
const URGENCY_REGEX = /\b(acil|hemen|simdi|son gun|limited|urgent|hurry|now|last chance)\b/i;
const ACTION_REGEX = /\b(tikla|click|uye ol|join|register|verify|dogrula|onayla|claim|redeem)\b/i;
const MONEY_REGEX = /(\d+[\.,]\d+\s*(tl|try|usd|eur|gbp)|[$€£]\s*\d+)/i;
const MANY_DIGITS_REGEX = /\d{6,}/;
const OTP_REGEX = /\b(kod|code|otp|sifre|password|dogrulama)\b/i;
const OTP_NUMBER_REGEX = /\b\d{4,8}\b/;

export class SMSClassifier {
  private customKeywords: string[];
  private strictMode: boolean;

  constructor(options: ClassifierOptions = {}) {
    this.customKeywords = Array.from(
      new Set(
        (options.customKeywords || [])
          .map((keyword) => normalizeSmsKeyword(keyword))
          .filter((keyword) => keyword.length >= 2)
      )
    );
    this.strictMode = options.strictMode || false;
  }

  classify(message: SMSMessage): SpamDetectionResult {
    const rawBody = (message.body || "").trim();
    const sender = (message.sender || "").trim();

    if (!rawBody) {
      return {
        isSpam: false,
        category: SpamCategory.NORMAL,
        confidence: 0,
        reasons: ["Empty message"],
        matchedKeywords: [],
        matchedPatterns: [],
        matchedDomains: [],
        signalCount: 0,
        riskLevel: "low",
        recommendedAction: "allow",
      };
    }

    const normalizedBody = normalizeSmsText(rawBody);
    const compactBody = toCompactSmsText(normalizedBody);

    const categoryScores: Record<SpamCategory, number> = {
      [SpamCategory.NORMAL]: 0,
      [SpamCategory.GAMBLING]: 0,
      [SpamCategory.SCAM]: 0,
      [SpamCategory.ADVERTISEMENT]: 0,
    };

    const matchedKeywords: string[] = [];
    const matchedPatterns: string[] = [];
    const reasons: string[] = [];

    let keywordScore = 0;
    let patternScore = 0;
    let confidenceBonus = 0;

    const customMatches = this.checkKeywords(normalizedBody, compactBody, this.customKeywords);
    if (customMatches.length > 0) {
      matchedKeywords.push(...customMatches);
      keywordScore += 1.2 * customMatches.length;
      categoryScores[SpamCategory.GAMBLING] += 1.45 * customMatches.length;
      reasons.push(`Matched ${customMatches.length} custom keyword(s)`);
    }

    const gamblingMatches = this.checkKeywords(normalizedBody, compactBody, [
      ...GAMBLING_KEYWORDS.turkish,
      ...GAMBLING_KEYWORDS.english,
    ]);
    if (gamblingMatches.length > 0) {
      matchedKeywords.push(...gamblingMatches);
      keywordScore += 0.75 * gamblingMatches.length;
      categoryScores[SpamCategory.GAMBLING] += 0.9 * gamblingMatches.length;
      reasons.push(`Matched ${gamblingMatches.length} gambling keyword(s)`);
    }

    const scamMatches = this.checkKeywords(normalizedBody, compactBody, [
      ...SCAM_KEYWORDS.turkish,
      ...SCAM_KEYWORDS.english,
    ]);
    if (scamMatches.length > 0) {
      matchedKeywords.push(...scamMatches);
      keywordScore += 0.95 * scamMatches.length;
      categoryScores[SpamCategory.SCAM] += 1.1 * scamMatches.length;
      reasons.push(`Matched ${scamMatches.length} scam keyword(s)`);
    }

    const adMatches = this.checkKeywords(normalizedBody, compactBody, [
      ...ADVERTISEMENT_KEYWORDS.turkish,
      ...ADVERTISEMENT_KEYWORDS.english,
    ]);
    if (adMatches.length > 0) {
      matchedKeywords.push(...adMatches);
      keywordScore += 0.45 * adMatches.length;
      categoryScores[SpamCategory.ADVERTISEMENT] += 0.65 * adMatches.length;
      reasons.push(`Matched ${adMatches.length} advertisement keyword(s)`);
    }

    for (const pattern of SPAM_PATTERNS) {
      const matches = rawBody.match(pattern.regex);
      if (!matches || matches.length === 0) continue;

      matchedPatterns.push(pattern.description);
      patternScore += Math.min(0.5, 0.2 + matches.length * 0.14);

      if (pattern.category === "gambling") categoryScores[SpamCategory.GAMBLING] += 0.4;
      if (pattern.category === "scam") categoryScores[SpamCategory.SCAM] += 0.48;
      if (pattern.category === "advertisement") categoryScores[SpamCategory.ADVERTISEMENT] += 0.3;
    }

    const domains = this.extractDomains(rawBody);
    const hasUrl = domains.length > 0;
    const hasShortUrl = SHORT_URL_REGEX.test(rawBody);
    const hasSuspiciousTld = domains.some((domain) => SUSPICIOUS_TLD_REGEX.test(domain));
    const hasUrgency = URGENCY_REGEX.test(normalizedBody);
    const hasAction = ACTION_REGEX.test(normalizedBody);
    const hasMoney = MONEY_REGEX.test(rawBody);

    const senderAnalysis = analyzeSenderPattern(sender);
    if (senderAnalysis.isSuspicious) {
      confidenceBonus += 0.2;
      reasons.push(...senderAnalysis.reasons);
    }

    if (hasSuspiciousTld) {
      confidenceBonus += 0.24;
      categoryScores[SpamCategory.GAMBLING] += 0.3;
      categoryScores[SpamCategory.SCAM] += 0.35;
      reasons.push("Contains suspicious domain TLD");
    }

    if (hasUrl && (gamblingMatches.length > 0 || customMatches.length > 0)) {
      confidenceBonus += 0.55;
      categoryScores[SpamCategory.GAMBLING] += 0.5;
      reasons.push("Contains URL with gambling signal");
    }

    if (hasUrl && scamMatches.length > 0) {
      confidenceBonus += 0.55;
      categoryScores[SpamCategory.SCAM] += 0.55;
      reasons.push("Contains URL with scam signal");
    }

    if (hasShortUrl && (hasAction || hasUrgency || senderAnalysis.isSuspicious)) {
      confidenceBonus += 0.42;
      categoryScores[SpamCategory.SCAM] += 0.38;
      reasons.push("Short URL with manipulative context");
    }

    if (hasMoney && (hasUrl || hasAction)) {
      confidenceBonus += 0.18;
      categoryScores[SpamCategory.ADVERTISEMENT] += 0.2;
    }

    if (matchedPatterns.length >= 2) confidenceBonus += 0.28;
    if (matchedKeywords.length >= 3) confidenceBonus += 0.32;

    const hasSafeTransactionalKeyword = this.checkKeywords(
      normalizedBody,
      compactBody,
      SAFE_TRANSACTIONAL_KEYWORDS
    ).length > 0;
    const looksLikeOtp = OTP_REGEX.test(normalizedBody) && OTP_NUMBER_REGEX.test(rawBody);

    let safePenalty = 0;
    if (hasSafeTransactionalKeyword && looksLikeOtp && !hasUrl && gamblingMatches.length === 0 && customMatches.length === 0) {
      safePenalty += this.strictMode ? 0.34 : 0.48;
      categoryScores[SpamCategory.SCAM] -= 0.18;
      categoryScores[SpamCategory.ADVERTISEMENT] -= 0.14;
      reasons.push("Looks like transactional OTP message");
    }

    const junkSignals = this.getJunkSignals({
      rawBody,
      normalizedBody,
      sender,
      hasUrl,
      hasShortUrl,
      hasSuspiciousTld,
      hasScamKeyword: scamMatches.length > 0,
      hasAdKeyword: adMatches.length > 0,
      hasGamblingKeyword: gamblingMatches.length > 0 || customMatches.length > 0,
      senderSuspicious: senderAnalysis.isSuspicious,
    });

    if (junkSignals.count >= 3) {
      confidenceBonus += this.strictMode ? 0.62 : 0.52;
      reasons.push(`Junk-like combination detected (${junkSignals.count} signals)`);
      if (junkSignals.looksLikeScam) {
        categoryScores[SpamCategory.SCAM] += 0.38;
      } else {
        categoryScores[SpamCategory.ADVERTISEMENT] += 0.25;
      }
    }

    if (junkSignals.count >= 5) {
      confidenceBonus += 0.22;
    }

    const rawScore = keywordScore + patternScore + confidenceBonus - safePenalty;
    const confidence = Math.max(0, Math.min(0.99, rawScore / (this.strictMode ? 1.35 : 2.05)));

    const strongestCategory = this.pickTopCategory(categoryScores);

    const threshold = this.strictMode ? 0.28 : 0.42;
    let isSpam = confidence >= threshold && strongestCategory !== SpamCategory.NORMAL;

    if (!isSpam && customMatches.length > 0 && confidence >= 0.2) {
      isSpam = true;
    }

    if (!isSpam && junkSignals.count >= 5 && confidence >= 0.35) {
      isSpam = true;
    }

    if (hasSafeTransactionalKeyword && looksLikeOtp && !hasUrl && junkSignals.count <= 2) {
      isSpam = false;
    }

    const finalCategory = isSpam ? strongestCategory : SpamCategory.NORMAL;
    const riskLevel = this.getRiskLevel(confidence, junkSignals.count, isSpam);
    const recommendedAction = isSpam
      ? settingsActionForCategory(finalCategory, riskLevel)
      : "allow";

    return {
      isSpam,
      category: finalCategory,
      confidence: Math.round(confidence * 100) / 100,
      reasons: Array.from(new Set(reasons)).slice(0, 10),
      matchedKeywords: Array.from(new Set(matchedKeywords)),
      matchedPatterns: Array.from(new Set(matchedPatterns)),
      matchedDomains: domains,
      signalCount: junkSignals.count,
      riskLevel,
      recommendedAction,
    };
  }

  private checkKeywords(normalizedBody: string, compactBody: string, keywords: string[]): string[] {
    const matches: string[] = [];

    for (const keyword of keywords) {
      const normalizedKeyword = normalizeSmsKeyword(keyword);
      if (normalizedKeyword.length < 2) continue;

      const compactKeyword = toCompactSmsText(normalizedKeyword);
      const boundaryRegex = new RegExp(`\\b${this.escapeRegex(normalizedKeyword)}\\b`, "i");

      if (boundaryRegex.test(normalizedBody)) {
        matches.push(keyword);
        continue;
      }

      if (normalizedKeyword.includes(" ") && normalizedBody.includes(normalizedKeyword)) {
        matches.push(keyword);
        continue;
      }

      if (compactKeyword.length >= 4 && compactBody.includes(compactKeyword)) {
        matches.push(keyword);
        continue;
      }

      if (this.matchesWithSeparators(normalizedBody, normalizedKeyword)) {
        matches.push(keyword);
      }
    }

    return matches;
  }

  private matchesWithSeparators(normalizedBody: string, normalizedKeyword: string): boolean {
    if (normalizedKeyword.length < 4 || normalizedKeyword.includes(" ")) return false;
    const spreadRegex = new RegExp(normalizedKeyword.split("").map((c) => this.escapeRegex(c)).join("\\W*"), "i");
    return spreadRegex.test(normalizedBody);
  }

  private extractDomains(text: string): string[] {
    const matches = text.match(URL_REGEX) || [];
    const domains = matches
      .map((item) => item.replace(/^https?:\/\//i, "").replace(/^www\./i, ""))
      .map((item) => item.split(/[/?#]/)[0].toLowerCase())
      .filter((item) => item.length > 2);

    return Array.from(new Set(domains));
  }

  private getJunkSignals(input: JunkSignalInput): { count: number; looksLikeScam: boolean } {
    const {
      rawBody,
      normalizedBody,
      hasUrl,
      hasShortUrl,
      hasSuspiciousTld,
      hasScamKeyword,
      hasAdKeyword,
      hasGamblingKeyword,
      senderSuspicious,
    } = input;

    const hasUrgency = URGENCY_REGEX.test(normalizedBody);
    const hasAction = ACTION_REGEX.test(normalizedBody);
    const hasMoney = MONEY_REGEX.test(rawBody);
    const hasManyDigits = MANY_DIGITS_REGEX.test(rawBody);
    const hasAllCapsBurst = /\b[A-Z0-9]{7,}\b/.test(rawBody);

    const signals = [
      hasUrl,
      hasShortUrl,
      hasSuspiciousTld,
      senderSuspicious,
      hasUrgency,
      hasAction,
      hasMoney,
      hasManyDigits,
      hasAllCapsBurst,
      hasScamKeyword,
      hasAdKeyword && hasUrl,
      hasGamblingKeyword && hasUrl,
    ];

    const count = signals.filter(Boolean).length;
    const looksLikeScam =
      hasScamKeyword ||
      (senderSuspicious && hasUrl && hasUrgency) ||
      (hasAction && hasUrgency && hasManyDigits) ||
      (hasShortUrl && hasAction);

    return { count, looksLikeScam };
  }

  private pickTopCategory(scores: Record<SpamCategory, number>): SpamCategory {
    const ordered = [
      SpamCategory.SCAM,
      SpamCategory.GAMBLING,
      SpamCategory.ADVERTISEMENT,
    ];

    let top: SpamCategory = SpamCategory.NORMAL;
    let max = 0;

    for (const category of ordered) {
      const value = scores[category];
      if (value > max) {
        max = value;
        top = category;
      }
    }

    return max > 0 ? top : SpamCategory.NORMAL;
  }

  private getRiskLevel(
    confidence: number,
    signalCount: number,
    isSpam: boolean
  ): "low" | "medium" | "high" | "critical" {
    if (!isSpam) return confidence >= 0.25 ? "medium" : "low";
    if (confidence >= 0.78 || signalCount >= 7) return "critical";
    if (confidence >= 0.58 || signalCount >= 5) return "high";
    return "medium";
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  classifyBatch(messages: SMSMessage[]): SpamDetectionResult[] {
    return messages.map((message) => this.classify(message));
  }
}

function settingsActionForCategory(
  category: SpamCategory,
  riskLevel: "low" | "medium" | "high" | "critical"
): string {
  if (riskLevel === "critical") return "block_and_delete";
  if (riskLevel === "high") return "block";
  if (category === SpamCategory.ADVERTISEMENT && riskLevel === "medium") return "review_or_block";
  return "allow";
}
