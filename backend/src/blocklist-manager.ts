/**
 * Engel Listesi Yöneticisi
 * Kumar alan adlarına ait engel listelerinin saklanmasını ve alınmasını yönetir
 */

import fs from 'fs/promises';
import path from 'path';
import { BlocklistEntry, BlocklistPattern } from '../../services/gambling-blocker/domain-matcher';

export class BlocklistManager {
  private blocklistFile: string;
  private patternsFile: string;
  private cache: BlocklistEntry[] = [];
  private patternsCache: BlocklistPattern[] = [];
  private lastUpdated: number = 0;

  constructor() {
    const dataDir = path.join(__dirname, '../data');
    this.blocklistFile = path.join(dataDir, 'blocklist.json');
    this.patternsFile = path.join(dataDir, 'patterns.json');
  }

  /**
   * Engel listesini varsayılan girdilerle başlat
   */
  async initialize(): Promise<void> {
    try {
      // Veri dizininin var olduğundan emin ol
      const dataDir = path.dirname(this.blocklistFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Engel listesini yükle veya oluştur
      try {
        await this.loadBlocklist();
      } catch {
        await this.createDefaultBlocklist();
      }

      // Kalıpları yükle veya oluştur
      try {
        await this.loadPatterns();
      } catch {
        await this.createDefaultPatterns();
      }
    } catch (error) {
      console.error('Engel listesi başlatılamadı:', error);
      throw error;
    }
  }

  /**
   * Engel listesini dosyadan yükle
   */
  async loadBlocklist(): Promise<void> {
    try {
      const data = await fs.readFile(this.blocklistFile, 'utf-8');
      const parsed = JSON.parse(data);
      this.cache = parsed.entries || [];
      this.lastUpdated = parsed.lastUpdated || Date.now();
    } catch (error) {
      throw new Error(`Engel listesi yüklenemedi: ${error}`);
    }
  }

  /**
   * Kalıpları dosyadan yükle
   */
  async loadPatterns(): Promise<void> {
    try {
      const data = await fs.readFile(this.patternsFile, 'utf-8');
      const parsed = JSON.parse(data);
      this.patternsCache = parsed.patterns || [];
    } catch (error) {
      throw new Error(`Kalıplar yüklenemedi: ${error}`);
    }
  }

  /**
   * Engel listesini dosyaya kaydet
   */
  async saveBlocklist(): Promise<void> {
    try {
      const data = {
        entries: this.cache,
        lastUpdated: Date.now()
      };
      await fs.writeFile(this.blocklistFile, JSON.stringify(data, null, 2));
      this.lastUpdated = Date.now();
    } catch (error) {
      throw new Error(`Engel listesi kaydedilemedi: ${error}`);
    }
  }

  /**
   * Tüm engel listesi girdilerini al
   */
  async getBlocklist(): Promise<BlocklistEntry[]> {
    if (this.cache.length === 0) {
      await this.loadBlocklist();
    }
    return [...this.cache];
  }

  /**
   * Tüm kalıpları al
   */
  async getPatterns(): Promise<BlocklistPattern[]> {
    if (this.patternsCache.length === 0) {
      await this.loadPatterns();
    }
    return [...this.patternsCache];
  }

  /**
   * Son güncelleme zaman damgasını al
   */
  async getLastUpdated(): Promise<number> {
    return this.lastUpdated;
  }

  /**
   * Alan adını engel listesine ekle
   */
  async addDomain(
    domain: string,
    reason: string,
    customPatterns?: BlocklistPattern[]
  ): Promise<void> {
    const normalized = domain.toLowerCase().trim();

    // Zaten var mı kontrol et
    const exists = this.cache.find(e => e.domain === normalized);
    if (exists) {
      exists.lastSeen = Date.now();
      if (reason) {
        exists.reason = reason;
      }
    } else {
      // Sağlanmadıysa kalıpları üret
      const patterns = customPatterns || this.generatePatterns(normalized);

      this.cache.push({
        domain: normalized,
        patterns,
        lastSeen: Date.now(),
        reason
      });
    }

    await this.saveBlocklist();
  }

  /**
   * Bir alan adı için kalıplar üret
   */
  private generatePatterns(domain: string): BlocklistPattern[] {
    const patterns: BlocklistPattern[] = [
      {
        pattern: domain,
        type: 'exact',
        weight: 1.0
      },
      {
        pattern: domain,
        type: 'subdomain',
        weight: 0.9
      }
    ];

    // Temel alan adını çıkar (örn. sub.example.com → example.com)
    const parts = domain.split('.');
    if (parts.length >= 2) {
      const rootDomain = parts.slice(-2).join('.');
      if (rootDomain !== domain) {
        patterns.push({
          pattern: rootDomain,
          type: 'subdomain',
          weight: 0.8
        });
      }
    }

    return patterns;
  }

  /**
   * Yaygın kumar alan adlarıyla varsayılan engel listesini oluştur
   */
  private async createDefaultBlocklist(): Promise<void> {
    const defaultDomains = [
      'bet365.com',
      'betway.com',
      'bwin.com',
      'pinnacle.com',
      'williamhill.com',
      '888casino.com',
      'casino.com',
      'pokerstars.com',
      'partypoker.com',
      'bodog.com',
      'dafabet.com',
      'unibet.com',
      'coral.co.uk',
      'ladbrokes.com',
      'betfair.com'
    ];

    for (const domain of defaultDomains) {
      const patterns = this.generatePatterns(domain);
      this.cache.push({
        domain,
        patterns,
        lastSeen: Date.now(),
        reason: 'Varsayılan engel listesi girişi'
      });
    }

    await this.saveBlocklist();
  }

  /**
   * Varsayılan kalıpları oluştur
   */
  private async createDefaultPatterns(): Promise<void> {
    this.patternsCache = [
      {
        pattern: 'bet',
        type: 'contains',
        weight: 0.7
      },
      {
        pattern: 'casino',
        type: 'contains',
        weight: 0.8
      },
      {
        pattern: 'poker',
        type: 'contains',
        weight: 0.7
      },
      {
        pattern: 'slot',
        type: 'contains',
        weight: 0.7
      },
      {
        pattern: 'gambling',
        type: 'contains',
        weight: 0.9
      },
      {
        pattern: '^bet\\d+\\.',
        type: 'regex',
        weight: 0.8
      },
      {
        pattern: '^casino\\d+\\.',
        type: 'regex',
        weight: 0.8
      },
      {
        pattern: '^poker\\d+\\.',
        type: 'regex',
        weight: 0.8
      }
    ];

    try {
      await fs.writeFile(
        this.patternsFile,
        JSON.stringify({ patterns: this.patternsCache }, null, 2)
      );
    } catch (error) {
      console.error('Varsayılan kalıplar kaydedilemedi:', error);
    }
  }
}