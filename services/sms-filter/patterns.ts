export interface Pattern {
  regex: RegExp;
  category: 'gambling' | 'scam' | 'advertisement';
  description: string;
}

export const SPAM_PATTERNS: Pattern[] = [
  {
    regex: /https?:\/\/[^\s]+/gi,
    category: 'gambling',
    description: 'Contains HTTP/HTTPS URL',
  },
  {
    regex: /(bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly|adf\.ly|shorte\.st)[^\s]*/gi,
    category: 'gambling',
    description: 'Contains shortened URL service',
  },
  {
    regex: /(promo|kupon|code|kod)[\s:]*[A-Z0-9]{4,}/gi,
    category: 'gambling',
    description: 'Contains promo code pattern',
  },
  {
    regex: /\d{10,}/g,
    category: 'scam',
    description: 'Contains long number sequence',
  },
  {
    regex: /(\d+[\.,]\d+\s*(TL|TRY|USD|EUR|£|\$)|₺\s*\d+)/gi,
    category: 'advertisement',
    description: 'Contains monetary amount',
  },
  {
    regex: /%\s*\d+|oran\s*[:=]\s*\d+|\d+\.\d+\s*oran/gi,
    category: 'gambling',
    description: 'Contains percentage or odds',
  },
  {
    regex: /(acil|hemen|şimdi|bugün|son gün|limited time|urgent|hurry|now)/gi,
    category: 'advertisement',
    description: 'Contains urgency language',
  },
  {
    regex: /(tıkla|click|üye ol|join|kayıt ol|register|başla|start)[\s\S]{0,50}(http|www|bit\.ly|link)/gi,
    category: 'gambling',
    description: 'Action word followed by link',
  },
  // Gambling-specific number patterns (betting codes, ticket numbers)
  {
    regex: /(kupon|ticket|bilet)[\s:]*#?\d{4,}/gi,
    category: 'gambling',
    description: 'Gambling ticket/coupon number',
  },
  {
    regex: /(free\s*spin|ücretsiz\s*dönüş|free\s*bet|bedava\s*bahis)/gi,
    category: 'gambling',
    description: 'Free spin or free bet offer',
  },
  {
    regex: /(deposit|withdraw|çekim|yatırım|yükleme)\s*(bonus|fırsat|kampanya)?/gi,
    category: 'gambling',
    description: 'Deposit/withdrawal promotion',
  },
  {
    regex: /(vip|premium|özel\s*üye|high\s*roller)/gi,
    category: 'gambling',
    description: 'VIP gambling invitation',
  },
  {
    regex: /(telegram|whatsapp|signal)\s*(link|grup|group)/gi,
    category: 'scam',
    description: 'Messaging app invite',
  },
  {
    regex: /(casino|bet|bahis|slot)\s*(link|giriş|site|adres|domain)/gi,
    category: 'gambling',
    description: 'Gambling site access',
  },
  {
    regex: /(bonus|promo|kampanya)\s*(kodu|code)\s*[:=]?\s*[A-Z0-9]{4,}/gi,
    category: 'gambling',
    description: 'Bonus or promo code',
  },
  {
    regex: /(canlı|live)\s*(casino|bet|bahis)/gi,
    category: 'gambling',
    description: 'Live betting mention',
  },
];

export function analyzeSenderPattern(sender: string): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let isSuspicious = false;

  // Check if sender is a random-looking number (many digits)
  if (/^\d{10,}$/.test(sender)) {
    isSuspicious = true;
    reasons.push('Sender is a long number sequence');
  }

  if (/^\d+$/.test(sender) && sender.length >= 6) {
    isSuspicious = true;
    reasons.push('Sender is numeric only');
  }

  if (/^[A-Z0-9]{6,}$/i.test(sender) && !sender.includes(' ') && !sender.includes('-')) {
    isSuspicious = true;
    reasons.push('Sender has unusual alphanumeric pattern');
  }

  if (/^(\+?\d{1,3})?\d{8,}$/.test(sender)) {
    isSuspicious = true;
    reasons.push('Sender resembles bulk SMS number');
  }

  return { isSuspicious, reasons };
}
