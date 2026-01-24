/**
 * Alan Adı Öneri Servisi
 * Gözlemlenen alan adlarını analiz eder ve engel listesine eklenmesi gerekenleri önerir
 */

import { BlocklistStorage } from '../storage/blocklist-storage';
import { PatternsStorage } from '../storage/patterns-storage';

export interface Suggestion {
  domain: string;
  confidence: number; // 0-100
  reasons: string[];
  matchedPatterns: string[];
  similarityScore?: number;
  keywordScore?: number;
  trickScore?: number;
}

export interface SuggestorConfig {
  minConfidence: number; // Öneri için minimum güven (varsayılan: 50)
  keywordWeights: Record<string, number>; // Özel anahtar kelime ağırlıkları
  similarityThreshold: number; // Dikkate alınacak minimum benzerlik (varsayılan: 0.7)
}

export class DomainSuggestor {
  private blocklistStorage: BlocklistStorage;
  private patternsStorage: PatternsStorage;
  private blockedDomains: Set<string> = new Set();
  private patterns: Array<{ pattern: string; type: string; weight: number }> = [];
  private config: SuggestorConfig;

  // Kumar anahtar kelimeleri (genişletilebilir)
  private gamblingKeywords = [
    'bet', 'casino', 'bahis', 'slot', 'wager', 'poker', 'roulette',
    'jackpot', 'lottery', 'bingo', 'gambling', 'wagering', 'odds',
    'stake', 'pari', 'sportbook', 'sportsbook', 'parlay', 'blackjack',
    'craps', 'baccarat', 'keno', 'scratch', 'pachinko'
  ];

  // Şüpheli TLD'ler
  private suspiciousTLDs = ['.bet', '.casino', '.poker', '.games', '.win'];

  // Yaygın kumar ile ilişkili sayı kalıpları
  private numberPatterns = [/bet\d+/i, /casino\d+/i, /\d+bet/i, /\d+casino/i, /\d+bahis/i, /bahis\d+/i];

  constructor(
    blocklistStorage: BlocklistStorage,
    patternsStorage: PatternsStorage,
    config: Partial<SuggestorConfig> = {}
  ) {
    this.blocklistStorage = blocklistStorage;
    this.patternsStorage = patternsStorage;
    this.config = {
      minConfidence: config.minConfidence || 50,
      keywordWeights: config.keywordWeights || {},
      similarityThreshold: config.similarityThreshold || 0.7
    };
  }

  /**
   * Başlat - engel listesi ve kalıpları yükle
   */
  async initialize(): Promise<void> {
    await this.blocklistStorage.initialize();
    await this.patternsStorage.initialize();

    const domains = await this.blocklistStorage.getDomains();
    this.blockedDomains = new Set(domains.map(d => d.toLowerCase()));

    const patternsData = await this.patternsStorage.load();
    this.patterns = patternsData.patterns;
  }

  /**
   * Tek bir alan adını analiz eder ve öneri döner
   */
  async analyzeDomain(domain: string): Promise<Suggestion> {
    const normalized = domain.toLowerCase().trim();
    const reasons: string[] = [];
    const matchedPatterns: string[] = [];
    let confidence = 0;

    // Zaten engelliyse atla
    if (this.blockedDomains.has(normalized)) {
      return {
        domain: normalized,
        confidence: 0,
        reasons: ['Zaten engel listesinde'],
        matchedPatterns: []
      };
    }

    // 1. Anahtar kelime puanlaması
    const keywordResult = this.scoreKeywords(normalized);
    if (keywordResult.score > 0) {
      confidence += keywordResult.score;
      reasons.push(...keywordResult.reasons);
      matchedPatterns.push(...keywordResult.matchedKeywords);
    }

    // 2. Engellenen alan adlarına Levenshtein benzerliği
    const similarityResult = this.calculateSimilarity(normalized);
    if (similarityResult.score > 0) {
      confidence += similarityResult.score * 30; // Ağırlık: en fazla 30 puan
      reasons.push(...similarityResult.reasons);
      if (similarityResult.matchedDomain) {
        matchedPatterns.push(`similar:${similarityResult.matchedDomain}`);
      }
    }

    // 3. TLD ve alt alan adı hilelerini tespit et
    const trickResult = this.detectTricks(normalized);
    if (trickResult.score > 0) {
      confidence += trickResult.score * 25; // Ağırlık: en fazla 25 puan
      reasons.push(...trickResult.reasons);
      matchedPatterns.push(...trickResult.matchedPatterns);
    }

    // 4. Mevcut kalıplarla eşleştirme
    const patternResult = this.matchExistingPatterns(normalized);
    if (patternResult.score > 0) {
      confidence += patternResult.score * 20; // Ağırlık: en fazla 20 puan
      reasons.push(...patternResult.reasons);
      matchedPatterns.push(...patternResult.matchedPatterns);
    }

    // Güveni 100 ile sınırla
    confidence = Math.min(confidence, 100);

    return {
      domain: normalized,
      confidence: Math.round(confidence),
      reasons: [...new Set(reasons)], // Yinelenenleri kaldır
      matchedPatterns: [...new Set(matchedPatterns)],
      keywordScore: keywordResult.score,
      similarityScore: similarityResult.score,
      trickScore: trickResult.score
    };
  }

  /**
   * Alan adını kumar anahtar kelimelerine göre puanla
   */
  private scoreKeywords(domain: string): {
    score: number;
    reasons: string[];
    matchedKeywords: string[];
  } {
    const reasons: string[] = [];
    const matchedKeywords: string[] = [];
    let score = 0;

    for (const keyword of this.gamblingKeywords) {
      if (domain.includes(keyword)) {
        const weight = this.config.keywordWeights[keyword] || 1.0;
        const keywordScore = 30 * weight; // Taban: anahtar kelimeler için en fazla 30 puan
        score += keywordScore;
        
        // Yanlış pozitifler için düşür (örn. "bet" → "abet")
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(domain)) {
          reasons.push(`Kumar anahtar kelimesi içeriyor: "${keyword}"`);
          matchedKeywords.push(keyword);
        } else {
          // Kısmi eşleşme - düşük skor
          score -= keywordScore * 0.3;
        }
      }
    }

    // Birden çok anahtar kelime için bonus
    if (matchedKeywords.length > 1) {
      const bonus = matchedKeywords.length * 5;
      score += Math.min(bonus, 15); // En fazla 15 bonus puan
      reasons.push(`${matchedKeywords.length} kumar anahtar kelimesi içeriyor`);
    }

    return {
      score: Math.min(score, 50), // Anahtar kelime puanını 50 ile sınırla
      reasons,
      matchedKeywords
    };
  }

  /**
   * Engellenen alan adlarına karşı Levenshtein benzerliği hesapla
   */
  private calculateSimilarity(domain: string): {
    score: number;
    reasons: string[];
    matchedDomain?: string;
  } {
    let maxSimilarity = 0;
    let matchedDomain: string | undefined;

    for (const blocked of this.blockedDomains) {
      const similarity = this.levenshteinSimilarity(domain, blocked);
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        matchedDomain = blocked;
      }
    }

    const reasons: string[] = [];
    if (maxSimilarity >= this.config.similarityThreshold) {
      const similarityPercent = Math.round(maxSimilarity * 100);
      reasons.push(
        `Engelli alan adına yüksek benzerlik (${similarityPercent}%): ${matchedDomain}`
      );
    } else if (maxSimilarity > 0.5) {
      reasons.push(
        `Engelli alan adlarına orta benzerlik (${Math.round(maxSimilarity * 100)}%)`
      );
    }

    return {
      score: maxSimilarity,
      reasons,
      matchedDomain: maxSimilarity >= this.config.similarityThreshold ? matchedDomain : undefined
    };
  }

  /**
   * Alan adı hilelerini tespit et (TLD manipülasyonu, alt alan adı hileleri, ayna alan adları)
   */
  private detectTricks(domain: string): {
    score: number;
    reasons: string[];
    matchedPatterns: string[];
  } {
    const reasons: string[] = [];
    const matchedPatterns: string[] = [];
    let score = 0;

    // 1. Şüpheli TLD tespiti
    for (const tld of this.suspiciousTLDs) {
      if (domain.endsWith(tld)) {
        score += 1.0;
        reasons.push(`Şüpheli TLD kullanıyor: ${tld}`);
        matchedPatterns.push(`tld:${tld}`);
      }
    }

    // 2. Sayı kalıbı tespiti (bet123, 123bet, casino456)
    for (const pattern of this.numberPatterns) {
      if (pattern.test(domain)) {
        score += 0.8;
        reasons.push(`Sayı kalıbıyla eşleşiyor: ${pattern.source}`);
        matchedPatterns.push(`number-pattern:${pattern.source}`);
      }
    }

    // 3. Tireli kumar alan adları (bet-365, casino-online)
    const hyphenPattern = /(bet|casino|poker|slot|bahis)[-_]([a-z0-9]+)/i;
    if (hyphenPattern.test(domain)) {
      score += 0.7;
      reasons.push('Tireli kumar anahtar kelimesi içeriyor');
      matchedPatterns.push('hyphenated-keyword');
    }

    // 4. Ayna alan adı tespiti (ters çevirme, karakter değişimleri)
    const mirrorScore = this.detectMirrorDomains(domain);
    if (mirrorScore > 0) {
      score += mirrorScore;
      reasons.push('Olası ayna/hileli alan adı');
      matchedPatterns.push('mirror-domain');
    }

    // 5. Alt alan adı hile tespiti (www.bet365.com → bet365-www.com)
    if (this.detectSubdomainTrick(domain)) {
      score += 0.6;
      reasons.push('Alt alan adı manipülasyonu tespit edildi');
      matchedPatterns.push('subdomain-trick');
    }

    // 6. Karakter ikame hileleri (bet365 → betЗ65, O yerine 0)
    if (this.detectCharacterSubstitution(domain)) {
      score += 0.5;
      reasons.push('Karakter ikamesi tespit edildi');
      matchedPatterns.push('char-substitution');
    }

    return {
      score: Math.min(score, 1.0), // 0-1 aralığına normalize et
      reasons,
      matchedPatterns
    };
  }

  /**
   * Ayna alan adlarını tespit et (ters çevrilmiş, karakter değiştirilmiş varyasyonlar)
   */
  private detectMirrorDomains(domain: string): number {
    // Ana kısmı çıkar (TLD hariç)
    const parts = domain.split('.');
    const mainPart = parts[0];

    // Engellenen bir alan adının ters çevrilmiş hali mi kontrol et
    for (const blocked of this.blockedDomains) {
      const blockedMain = blocked.split('.')[0];
      if (mainPart === blockedMain.split('').reverse().join('')) {
        return 0.8;
      }

      // Yaygın karakter değişimleri (i->l, o->0 vb.) kontrol et
      const normalizedMain = mainPart
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/5/g, 's');
      const normalizedBlocked = blockedMain
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/5/g, 's');
      
      if (normalizedMain === normalizedBlocked && mainPart !== blockedMain) {
        return 0.6;
      }
    }

    return 0;
  }

  /**
   * Alt alan adı hilelerini tespit et (www.domain → domain-www)
   */
  private detectSubdomainTrick(domain: string): boolean {
    // Alan adı manipüle edilmiş alt alan adı gibi görünüyor mu kontrol et
    const commonSubdomains = ['www', 'm', 'mobile', 'app', 'secure'];
    const parts = domain.split('.');
    
    if (parts.length >= 2) {
      const mainPart = parts[parts.length - 2];
      // Ana kısım yaygın alt alan adıyla bitiyor mu kontrol et
      for (const subdomain of commonSubdomains) {
        if (mainPart.endsWith(`-${subdomain}`) || mainPart.startsWith(`${subdomain}-`)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Karakter ikamesini tespit et (0->O, 1->I vb.)
   */
  private detectCharacterSubstitution(domain: string): boolean {
    // Yer değiştirme olabilecek şüpheli karakter kalıplarını kontrol et
    const suspiciousPatterns = [
      /\d+[a-z]+bet/i,  // 123bet
      /bet\d+[a-z]+/i,  // bet123x
      /[0-5]+bet/i,     // Harf gibi görünen sayılar
      /bet[0-5]+/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(domain));
  }

  /**
   * Alan adını mevcut kalıplarla eşleştir
   */
  private matchExistingPatterns(domain: string): {
    score: number;
    reasons: string[];
    matchedPatterns: string[];
  } {
    const reasons: string[] = [];
    const matchedPatterns: string[] = [];
    let totalScore = 0;

    for (const pattern of this.patterns) {
      let matches = false;

      switch (pattern.type) {
        case 'exact':
          if (domain === pattern.pattern) {
            matches = true;
          }
          break;
        case 'subdomain':
          if (domain.endsWith('.' + pattern.pattern) || domain === pattern.pattern) {
            matches = true;
          }
          break;
        case 'contains':
          if (domain.includes(pattern.pattern)) {
            matches = true;
          }
          break;
        case 'regex':
          try {
            const regex = new RegExp(pattern.pattern, 'i');
            if (regex.test(domain)) {
              matches = true;
            }
          } catch (e) {
            // Geçersiz regex, atla
          }
          break;
      }

      if (matches) {
        const score = pattern.weight;
        totalScore += score;
        reasons.push(`Kalıpla eşleşiyor: ${pattern.pattern} (${pattern.type})`);
        matchedPatterns.push(`${pattern.type}:${pattern.pattern}`);
      }
    }

    return {
      score: Math.min(totalScore, 1.0), // Normalize et
      reasons,
      matchedPatterns
    };
  }

  /**
   * Levenshtein benzerliğini hesapla (0-1)
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Boş dizeleri ele al
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Matris oluştur
    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Matrisi doldur
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // silme
          matrix[i][j - 1] + 1,      // ekleme
          matrix[i - 1][j - 1] + cost // değiştirme
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }

  /**
   * Birden çok alan adını analiz eder ve sıralı öneriler döner
   */
  async suggestDomains(observedDomains: string[]): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    for (const domain of observedDomains) {
      const suggestion = await this.analyzeDomain(domain);
      
      // Minimum güvenin üzerindeki önerileri dahil et
      if (suggestion.confidence >= this.config.minConfidence) {
        suggestions.push(suggestion);
      }
    }

    // Güvene göre sırala (azalan)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}
