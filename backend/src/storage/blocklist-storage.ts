/**
 * Engel Listesi Depolama Yöneticisi
 * JSON dosyalarından engel listesi verisini okur/yazar
 * Yapı DB'ye hazırdır (PostgreSQL/MongoDB'ye kolayca taşınabilir)
 */

import fs from 'fs/promises';
import path from 'path';
import { BlocklistData, BlocklistEntry, BlocklistPattern } from '../types';
import { config } from '../config';

export class BlocklistStorage {
  private dataDir: string;
  private blocklistFile: string;
  private cache: BlocklistData | null = null;
  private lastCacheTime: number = 0;
  private cacheTTL = 5000; // 5 saniyelik önbellek

  constructor() {
    this.dataDir = path.resolve(config.dataDir);
    this.blocklistFile = path.resolve(config.blocklistFile);
  }

  /**
   * Depolamayı başlat - veri dizininin var olduğundan emin ol
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Engel listesi dosyası var mı kontrol et, yoksa varsayılan oluştur
      try {
        await fs.access(this.blocklistFile);
      } catch {
        await this.createDefaultBlocklist();
      }
    } catch (error) {
      throw new Error(`Engel listesi depolaması başlatılamadı: ${error}`);
    }
  }

  /**
   * Engel listesini dosyadan yükle (önbellekle)
   */
  async load(): Promise<BlocklistData> {
    const now = Date.now();
    
    // Önbellek tazeyse önbellek verisini döndür
    if (this.cache && (now - this.lastCacheTime) < this.cacheTTL) {
      return this.cache;
    }

    try {
      const data = await fs.readFile(this.blocklistFile, 'utf-8');
      const parsed: BlocklistData = JSON.parse(data);
      
      // Yapıyı doğrula
      this.validateBlocklistData(parsed);
      
      this.cache = parsed;
      this.lastCacheTime = now;
      
      return parsed;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        await this.createDefaultBlocklist();
        return this.load();
      }
      throw new Error(`Engel listesi yüklenemedi: ${error}`);
    }
  }

  /**
   * Engel listesini dosyaya kaydet
   */
  async save(data: BlocklistData): Promise<void> {
    try {
      // Kaydetmeden önce doğrula
      this.validateBlocklistData(data);
      
      // Dizinin var olduğundan emin ol
      await fs.mkdir(path.dirname(this.blocklistFile), { recursive: true });
      
      // Önce geçici dosyaya yaz, sonra yeniden adlandır (atomik işlem)
      const tempFile = `${this.blocklistFile}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      await fs.rename(tempFile, this.blocklistFile);
      
      // Önbelleği geçersiz kıl
      this.cache = data;
      this.lastCacheTime = Date.now();
    } catch (error) {
      throw new Error(`Engel listesi kaydedilemedi: ${error}`);
    }
  }

  /**
   * Alan adını engel listesine ekle
   */
  async addDomain(
    domain: string,
    reason: string = 'Manuel ekleme',
    customPatterns?: BlocklistPattern[]
  ): Promise<void> {
    const data = await this.load();
    const normalized = domain.toLowerCase().trim();
    const now = Date.now();

    // Alan adı zaten var mı kontrol et
    const existingIndex = data.entries.findIndex(e => e.domain === normalized);
    
    if (existingIndex >= 0) {
      // Mevcut girdiyi güncelle
      data.entries[existingIndex].updatedAt = now;
      data.entries[existingIndex].reason = reason;
      if (customPatterns) {
        data.entries[existingIndex].patterns = customPatterns;
      }
    } else {
      // Yeni girdi ekle
      const patterns = customPatterns || this.generatePatterns(normalized);
      data.entries.push({
        domain: normalized,
        patterns,
        addedAt: now,
        updatedAt: now,
        reason
      });
    }

    // Sürümü ve zaman damgasını artır
    if (config.autoVersionBump) {
      data.version += 1;
    }
    data.updatedAt = now;

    await this.save(data);
  }

  /**
   * Alan adını engel listesinden kaldır
   */
  async removeDomain(domain: string): Promise<boolean> {
    const data = await this.load();
    const normalized = domain.toLowerCase().trim();
    
    const initialLength = data.entries.length;
    data.entries = data.entries.filter(e => e.domain !== normalized);
    
    const removed = data.entries.length < initialLength;
    
    if (removed) {
      if (config.autoVersionBump) {
        data.version += 1;
      }
      data.updatedAt = Date.now();
      await this.save(data);
    }
    
    return removed;
  }

  /**
   * Tüm alan adlarını basit dizi olarak al
   */
  async getDomains(): Promise<string[]> {
    const data = await this.load();
    return data.entries.map(e => e.domain).sort();
  }

  /**
   * Sürüm ve updatedAt'i al
   */
  async getMetadata(): Promise<{ version: number; updatedAt: number }> {
    const data = await this.load();
    return {
      version: data.version,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Sürümü manuel artır
   */
  async bumpVersion(): Promise<number> {
    const data = await this.load();
    data.version += 1;
    data.updatedAt = Date.now();
    await this.save(data);
    return data.version;
  }

  /**
   * Bir alan adı için kalıp üret
   */
  private generatePatterns(domain: string): BlocklistPattern[] {
    const patterns: BlocklistPattern[] = [
      {
        pattern: domain,
        type: 'exact',
        weight: 1.0
      }
    ];

    // Alt alan adı kalıbı ekle
    const parts = domain.split('.');
    if (parts.length >= 2) {
      const rootDomain = parts.slice(-2).join('.');
      if (rootDomain !== domain) {
        patterns.push({
          pattern: rootDomain,
          type: 'subdomain',
          weight: 0.9
        });
      }
    }

    return patterns;
  }

  /**
   * Varsayılan engel listesini oluştur
   */
  private async createDefaultBlocklist(): Promise<void> {
    const defaultData: BlocklistData = {
      version: 1,
      updatedAt: Date.now(),
      entries: []
    };

    await this.save(defaultData);
  }

  /**
   * Engel listesi veri yapısını doğrula
   */
  private validateBlocklistData(data: any): asserts data is BlocklistData {
    if (!data || typeof data !== 'object') {
      throw new Error('Geçersiz engel listesi verisi: nesne olmalıdır');
    }
    if (typeof data.version !== 'number') {
      throw new Error('Geçersiz engel listesi verisi: version sayı olmalıdır');
    }
    if (typeof data.updatedAt !== 'number') {
      throw new Error('Geçersiz engel listesi verisi: updatedAt sayı olmalıdır');
    }
    if (!Array.isArray(data.entries)) {
      throw new Error('Geçersiz engel listesi verisi: entries bir dizi olmalıdır');
    }
  }

  /**
   * Önbelleği geçersiz kıl (testler için faydalı)
   */
  invalidateCache(): void {
    this.cache = null;
    this.lastCacheTime = 0;
  }
}
