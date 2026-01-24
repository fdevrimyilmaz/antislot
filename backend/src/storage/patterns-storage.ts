/**
 * Kalıp Depolama Yöneticisi
 * JSON dosyalarından kalıp kurallarını okur/yazar
 * Yapı DB'ye hazırdır
 */

import fs from 'fs/promises';
import path from 'path';
import { PatternData, BlocklistPattern } from '../types';
import { config } from '../config';

export class PatternsStorage {
  private patternsFile: string;
  private cache: PatternData | null = null;
  private lastCacheTime: number = 0;
  private cacheTTL = 5000; // 5 saniyelik önbellek

  constructor() {
    this.patternsFile = path.resolve(config.patternsFile);
  }

  /**
   * Depolamayı başlat - dosyanın var olduğundan emin ol
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.patternsFile), { recursive: true });
      
      // Kalıp dosyası var mı kontrol et, yoksa varsayılan oluştur
      try {
        await fs.access(this.patternsFile);
      } catch {
        await this.createDefaultPatterns();
      }
    } catch (error) {
      throw new Error(`Kalıp depolaması başlatılamadı: ${error}`);
    }
  }

  /**
   * Kalıpları dosyadan yükle (önbellekle)
   */
  async load(): Promise<PatternData> {
    const now = Date.now();
    
    // Önbellek tazeyse önbellek verisini döndür
    if (this.cache && (now - this.lastCacheTime) < this.cacheTTL) {
      return this.cache;
    }

    try {
      const data = await fs.readFile(this.patternsFile, 'utf-8');
      const parsed: PatternData = JSON.parse(data);
      
      // Yapıyı doğrula
      this.validatePatternData(parsed);
      
      this.cache = parsed;
      this.lastCacheTime = now;
      
      return parsed;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        await this.createDefaultPatterns();
        return this.load();
      }
      throw new Error(`Kalıplar yüklenemedi: ${error}`);
    }
  }

  /**
   * Kalıpları dosyaya kaydet
   */
  async save(data: PatternData): Promise<void> {
    try {
      // Kaydetmeden önce doğrula
      this.validatePatternData(data);
      
      // Dizinin var olduğundan emin ol
      await fs.mkdir(path.dirname(this.patternsFile), { recursive: true });
      
      // Önce geçici dosyaya yaz, sonra yeniden adlandır (atomik işlem)
      const tempFile = `${this.patternsFile}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      await fs.rename(tempFile, this.patternsFile);
      
      // Önbelleği geçersiz kıl
      this.cache = data;
      this.lastCacheTime = Date.now();
    } catch (error) {
      throw new Error(`Kalıplar kaydedilemedi: ${error}`);
    }
  }

  /**
   * Kalıp ekle
   */
  async addPattern(pattern: BlocklistPattern): Promise<void> {
    const data = await this.load();
    const now = Date.now();

    // Kalıp zaten var mı kontrol et (tam eşleşme)
    const exists = data.patterns.some(
      p => p.pattern === pattern.pattern && p.type === pattern.type
    );

    if (!exists) {
      data.patterns.push(pattern);
      
      if (config.autoVersionBump) {
        data.version += 1;
      }
      data.updatedAt = now;
      await this.save(data);
    }
  }

  /**
   * Kalıbı kaldır
   */
  async removePattern(pattern: string, type: BlocklistPattern['type']): Promise<boolean> {
    const data = await this.load();
    
    const initialLength = data.patterns.length;
    data.patterns = data.patterns.filter(
      p => !(p.pattern === pattern && p.type === type)
    );
    
    const removed = data.patterns.length < initialLength;
    
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
   * Varsayılan kalıpları oluştur
   */
  private async createDefaultPatterns(): Promise<void> {
    const defaultPatterns: BlocklistPattern[] = [
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
      }
    ];

    const defaultData: PatternData = {
      version: 1,
      updatedAt: Date.now(),
      patterns: defaultPatterns
    };

    await this.save(defaultData);
  }

  /**
   * Kalıp veri yapısını doğrula
   */
  private validatePatternData(data: any): asserts data is PatternData {
    if (!data || typeof data !== 'object') {
      throw new Error('Geçersiz kalıp verisi: nesne olmalıdır');
    }
    if (typeof data.version !== 'number') {
      throw new Error('Geçersiz kalıp verisi: version sayı olmalıdır');
    }
    if (typeof data.updatedAt !== 'number') {
      throw new Error('Geçersiz kalıp verisi: updatedAt sayı olmalıdır');
    }
    if (!Array.isArray(data.patterns)) {
      throw new Error('Geçersiz kalıp verisi: patterns bir dizi olmalıdır');
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
