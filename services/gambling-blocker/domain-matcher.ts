/**
 * Kumar siteleri için alan adı eşleştirme ve kalıp tespiti
 * Hem backend hem de mobil uygulamalar tarafından kullanılır
 */

export interface BlocklistPattern {
  pattern: string;
  type: 'exact' | 'subdomain' | 'contains' | 'regex';
  weight: number;
}

export interface BlocklistEntry {
  domain: string;
  patterns: BlocklistPattern[];
  lastSeen: number;
  reason: string;
}

export class DomainMatcher {
  private exactDomains: Set<string> = new Set();
  private subdomainPatterns: Set<string> = new Set();
  private containsPatterns: string[] = [];
  private regexPatterns: RegExp[] = [];
  private whitelist: Set<string> = new Set();

  /**
   * Engel listesi girdilerini yükle
   */
  loadBlocklist(entries: BlocklistEntry[]): void {
    this.exactDomains.clear();
    this.subdomainPatterns.clear();
    this.containsPatterns = [];
    this.regexPatterns = [];

    for (const entry of entries) {
      const domain = entry.domain.toLowerCase().trim();
      
      // Beyaz liste kontrolü
      if (this.whitelist.has(domain)) {
        continue;
      }

      // Kalıpları işle
      for (const pattern of entry.patterns) {
        switch (pattern.type) {
          case 'exact':
            this.exactDomains.add(pattern.pattern.toLowerCase());
            break;
          case 'subdomain':
            this.subdomainPatterns.add(pattern.pattern.toLowerCase());
            break;
          case 'contains':
            this.containsPatterns.push(pattern.pattern.toLowerCase());
            break;
          case 'regex':
            try {
              this.regexPatterns.push(new RegExp(pattern.pattern, 'i'));
            } catch (e) {
              console.warn(`Geçersiz regex kalıbı: ${pattern.pattern}`);
            }
            break;
        }
      }
    }
  }

  /**
   * Beyaz listeyi yükle
   */
  loadWhitelist(domains: string[]): void {
    this.whitelist.clear();
    for (const domain of domains) {
      this.whitelist.add(domain.toLowerCase().trim());
    }
  }

  /**
   * Alan adının engellenip engellenmeyeceğini kontrol et
   */
  isBlocked(domain: string): boolean {
    if (!domain) return false;

    const normalized = domain.toLowerCase().trim();

    // Önce beyaz listeyi kontrol et
    if (this.whitelist.has(normalized)) {
      return false;
    }

    // Tam eşleşme
    if (this.exactDomains.has(normalized)) {
      return true;
    }

    // Temel alan adını çıkar (örn. sub.example.com → example.com)
    const parts = normalized.split('.');
    if (parts.length >= 2) {
      const baseDomain = parts.slice(-2).join('.');
      
      // Alt alan adı kalıp eşleşmesi
      for (const pattern of this.subdomainPatterns) {
        if (normalized === pattern || normalized.endsWith('.' + pattern)) {
          return true;
        }
        if (baseDomain === pattern) {
          return true;
        }
      }
    }

    // İçerir eşleşmesi
    for (const pattern of this.containsPatterns) {
      if (normalized.includes(pattern)) {
        return true;
      }
    }

    // Regex eşleşmesi
    for (const regex of this.regexPatterns) {
      if (regex.test(normalized)) {
        return true;
      }
    }

    return false;
  }

  /**
   * URL'den alan adı çıkar
   */
  extractDomain(url: string): string | null {
    try {
      // Protokolü kaldır
      let domain = url.replace(/^https?:\/\//, '');
      // Yolu kaldır
      domain = domain.split('/')[0];
      // Portu kaldır
      domain = domain.split(':')[0];
      // www önekini kaldır
      domain = domain.replace(/^www\./, '');
      return domain.toLowerCase().trim();
    } catch {
      return null;
    }
  }
}

/**
 * Anahtar kelimeler ve kalıplara göre olası kumar alan adlarını tespit et
 */
export class GamblingDomainDetector {
  private gamblingKeywords = [
    'bet', 'casino', 'poker', 'roulette', 'slot', 'gambling', 'wagering',
    'odds', 'stake', 'wager', 'jackpot', 'lotto', 'lottery', 'bingo',
    'betting', 'sportbook', 'sportsbook', 'parlay', 'blackjack'
  ];

  private suspiciousPatterns = [
    /bet\d+/i,
    /casino\d+/i,
    /poker\d+/i,
    /slot\d+/i,
    /gambling\d+/i,
  ];

  /**
   * Bilinen kumar alan adlarıyla benzerlik puanı hesapla
   */
  calculateSimilarity(domain: string, knownDomains: string[]): number {
    let maxSimilarity = 0;

    for (const known of knownDomains) {
      const similarity = this.stringSimilarity(
        domain.toLowerCase(),
        known.toLowerCase()
      );
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
   * Alan adı kumar anahtar kelimeleri içeriyor mu kontrol et
   */
  hasGamblingKeywords(domain: string): boolean {
    const lower = domain.toLowerCase();
    return this.gamblingKeywords.some(keyword => lower.includes(keyword));
  }

  /**
   * Alan adı şüpheli kalıplarla eşleşiyor mu kontrol et
   */
  matchesSuspiciousPattern(domain: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(domain));
  }

  /**
   * Alan adının kumarla ilişkili olma olasılığını tespit et
   */
  detectGamblingDomain(domain: string, knownGamblingDomains: string[]): {
    isGambling: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let confidence = 0;

    // Anahtar kelime kontrolü (ağırlık: 0.5)
    if (this.hasGamblingKeywords(domain)) {
      reasons.push('Kumar anahtar kelimeleri içeriyor');
      confidence += 0.5;
    }

    // Kalıp kontrolü (ağırlık: 0.3)
    if (this.matchesSuspiciousPattern(domain)) {
      reasons.push('Şüpheli kalıpla eşleşiyor');
      confidence += 0.3;
    }

    // Benzerlik kontrolü (ağırlık: 0.2)
    const similarity = this.calculateSimilarity(domain, knownGamblingDomains);
    if (similarity > 0.7) {
      reasons.push(`Bilinen kumar alan adına benzer (${(similarity * 100).toFixed(0)}%)`);
      confidence += 0.2 * similarity;
    }

    return {
      isGambling: confidence >= 0.5,
      confidence: Math.min(confidence, 1.0),
      reasons
    };
  }

  /**
   * Levenshtein mesafesine dayalı dize benzerliği
   */
  private stringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }
}