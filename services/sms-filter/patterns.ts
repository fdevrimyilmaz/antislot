export interface Pattern {
  regex: RegExp;
  category: "gambling" | "scam" | "advertisement";
  description: string;
}

export const SPAM_PATTERNS: Pattern[] = [
  {
    regex: /https?:\/\/[^\s]+/gi,
    category: "gambling",
    description: "Contains HTTP/HTTPS URL",
  },
  {
    regex: /\bwww\.[^\s]+/gi,
    category: "advertisement",
    description: "Contains web URL",
  },
  {
    regex: /(bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly|adf\.ly|shorte\.st|cutt\.ly|rb\.gy|lnk\.bio)[^\s]*/gi,
    category: "scam",
    description: "Contains shortened URL service",
  },
  {
    regex: /\b[a-z0-9-]+\.(xyz|top|click|shop|win|live|bet|vip|pw|sbs)\b/gi,
    category: "gambling",
    description: "Contains suspicious domain TLD",
  },
  {
    regex: /(promo|kupon|code|kod)[\s:=-]*[A-Z0-9]{4,}/gi,
    category: "gambling",
    description: "Contains promo code pattern",
  },
  {
    regex: /(casino|slot|bahis|betting|freebet|jackpot|oran|iddaa)[\s\S]{0,35}(http|www|bit\.ly|tinyurl|link)/gi,
    category: "gambling",
    description: "Gambling keyword followed by link",
  },
  {
    regex: /(acil|hemen|simdi|son gun|limited time|urgent|hurry|now|last chance)/gi,
    category: "advertisement",
    description: "Contains urgency language",
  },
  {
    regex: /(tikla|click|uye ol|join|kayit ol|register|dogrula|verify|onayla|claim|redeem)[\s\S]{0,55}(http|www|bit\.ly|tinyurl|link)/gi,
    category: "scam",
    description: "Action word followed by link",
  },
  {
    regex: /(kredi karti|hesap|iban|account|wallet|payment|odeme)[\s\S]{0,40}(dogrula|verify|guncelle|update|onayla|confirm)/gi,
    category: "scam",
    description: "Financial verification lure",
  },
  {
    regex: /(whatsapp|telegram|signal)[\s\S]{0,30}(grup|group|link|katil|join)/gi,
    category: "scam",
    description: "Messaging app invitation",
  },
  {
    regex: /(ucretsiz donus|free spin|free bet|bedava bahis|deneme bonusu|welcome bonus)/gi,
    category: "gambling",
    description: "Free spin/free bet campaign",
  },
  {
    regex: /(deposit|withdraw|yatirim|cekim|cashout|para cek|para yatir)/gi,
    category: "gambling",
    description: "Deposit/withdrawal promotion",
  },
  {
    regex: /(\d+[\.,]\d+\s*(tl|try|usd|eur|gbp)|[$€£]\s*\d+)/gi,
    category: "advertisement",
    description: "Contains monetary amount",
  },
  {
    regex: /\d{8,}/g,
    category: "scam",
    description: "Contains very long number sequence",
  },
  {
    regex: /\b[A-Z0-9]{7,}\b/g,
    category: "scam",
    description: "Contains shouty alphanumeric token",
  },
];

const TRUSTED_SENDER_HINTS = [
  "bank",
  "banka",
  "ptt",
  "aras",
  "yurtici",
  "hepsijet",
  "migros",
  "vodafone",
  "turkcell",
  "turktelekom",
  "e-devlet",
  "edevlet",
  "otp",
  "kod"
];

export function analyzeSenderPattern(sender: string): {
  isSuspicious: boolean;
  reasons: string[];
  isTrustedLike: boolean;
} {
  const reasons: string[] = [];
  let isSuspicious = false;

  const raw = sender.trim();
  const normalized = raw.toLowerCase();

  if (!raw) {
    return { isSuspicious: false, reasons: [], isTrustedLike: false };
  }

  const isTrustedLike = TRUSTED_SENDER_HINTS.some((hint) => normalized.includes(hint));

  if (/^\+?\d{8,}$/.test(raw)) {
    isSuspicious = true;
    reasons.push("Sender is a long numeric address");
  }

  if (/^\d{6,}$/.test(raw)) {
    isSuspicious = true;
    reasons.push("Sender is numeric only");
  }

  if (/^[A-Z0-9]{7,}$/i.test(raw) && !isTrustedLike) {
    isSuspicious = true;
    reasons.push("Sender has random alphanumeric pattern");
  }

  if (/[^a-zA-Z0-9+\-_]/.test(raw)) {
    isSuspicious = true;
    reasons.push("Sender contains unusual characters");
  }

  return { isSuspicious, reasons, isTrustedLike };
}
