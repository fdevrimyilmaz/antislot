#!/usr/bin/env node

/**
 * Alan Adı Öneri Betiği
 * Gözlemlenen alan adlarını analiz eder ve engel listesine eklenmesi gerekenleri önerir
 *
 * Kullanım:
 *   npm run suggest <observed_domains.txt>
 *   veya
 *   node dist/scripts/suggest-domains.js <observed_domains.txt>
 */

import fs from 'fs';
import path from 'path';
import { BlocklistStorage } from '../storage/blocklist-storage';
import { PatternsStorage } from '../storage/patterns-storage';
import { DomainSuggestor, Suggestion } from '../services/domain-suggestor';

interface OutputFormat {
  suggestions: Suggestion[];
  summary: {
    totalAnalyzed: number;
    suggested: number;
    minConfidence: number;
    averageConfidence: number;
  };
  timestamp: number;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Kullanım: npm run suggest <observed_domains.txt>');
    console.error('   veya: node dist/scripts/suggest-domains.js <observed_domains.txt>');
    process.exit(1);
  }

  const inputFile = args[0];
  
  // Gözlemlenen alan adlarını oku
  let observedDomains: string[] = [];
  try {
    const content = fs.readFileSync(inputFile, 'utf-8');
    observedDomains = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .filter(domain => {
        // Temel alan adı doğrulaması
        return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain);
      });
  } catch (error) {
    console.error(`Dosya okunurken hata ${inputFile}:`, error);
    process.exit(1);
  }

  if (observedDomains.length === 0) {
    console.error('Girdi dosyasında geçerli alan adı bulunamadı');
    process.exit(1);
  }

  console.log(`${observedDomains.length} gözlemlenen alan adı analiz ediliyor...\n`);

  // Önericiyi başlat
  const blocklistStorage = new BlocklistStorage();
  const patternsStorage = new PatternsStorage();
  const suggestor = new DomainSuggestor(blocklistStorage, patternsStorage, {
    minConfidence: 50,
    similarityThreshold: 0.7
  });

  await suggestor.initialize();

  // Alan adlarını analiz et
  const suggestions = await suggestor.suggestDomains(observedDomains);

  // Özeti hesapla
  const summary = {
    totalAnalyzed: observedDomains.length,
    suggested: suggestions.length,
    minConfidence: suggestions.length > 0 ? Math.min(...suggestions.map(s => s.confidence)) : 0,
    averageConfidence: suggestions.length > 0
      ? Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length)
      : 0
  };

  // Çıktıyı oluştur
  const output: OutputFormat = {
    suggestions,
    summary,
    timestamp: Date.now()
  };

  // Sonuçları göster
  console.log('=' .repeat(80));
  console.log('ALAN ADI ÖNERİLERİ');
  console.log('=' .repeat(80));
  console.log(`Toplam analiz edilen: ${summary.totalAnalyzed}`);
  console.log(`Engel için önerilen: ${summary.suggested}`);
  console.log(`Ortalama güven: ${summary.averageConfidence}%`);
  console.log(`Minimum güven: ${summary.minConfidence}%`);
  console.log('');

  if (suggestions.length === 0) {
    console.log('Engel için önerilen alan adı yok (güven < 50%)');
  } else {
    console.log('Sıralı Öneriler:');
    console.log('');

    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.domain} [${suggestion.confidence}%]`);
      console.log(`   Nedenler: ${suggestion.reasons.join('; ')}`);
      if (suggestion.matchedPatterns.length > 0) {
        console.log(`   Kalıplar: ${suggestion.matchedPatterns.join(', ')}`);
      }
      if (suggestion.keywordScore !== undefined || suggestion.similarityScore !== undefined) {
        const scores = [];
        if (suggestion.keywordScore !== undefined) scores.push(`anahtarKelimeler: ${suggestion.keywordScore.toFixed(2)}`);
        if (suggestion.similarityScore !== undefined) scores.push(`benzerlik: ${(suggestion.similarityScore * 100).toFixed(0)}%`);
        if (suggestion.trickScore !== undefined) scores.push(`hileler: ${(suggestion.trickScore * 100).toFixed(0)}%`);
        console.log(`   Puanlar: ${scores.join(', ')}`);
      }
      console.log('');
    });
  }

  // JSON çıktısını yaz
  const outputFile = path.join(path.dirname(inputFile), 'suggestions_output.json');
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`\nJSON çıktısı şuraya yazıldı: ${outputFile}`);

  // Kolay inceleme için CSV çıktısı yaz
  const csvFile = path.join(path.dirname(inputFile), 'suggestions_output.csv');
  const csvRows: string[] = [];
  
  // CSV alanlarını kaçışlamak için yardımcı
  const escapeCsv = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };
  
  // CSV başlığı
  csvRows.push('AlanAdi,Güven,Nedenler,Kalıplar');
  
  // CSV satırları
  suggestions.forEach(s => {
    const reasons = s.reasons.join('; ');
    const patterns = s.matchedPatterns.join('; ');
    csvRows.push([
      escapeCsv(s.domain),
      s.confidence.toString(),
      escapeCsv(reasons),
      escapeCsv(patterns)
    ].join(','));
  });
  
  fs.writeFileSync(csvFile, csvRows.join('\n'));
  console.log(`CSV çıktısı şuraya yazıldı: ${csvFile}`);
}

// Betiği çalıştır
main().catch(error => {
  console.error('Hata:', error);
  process.exit(1);
});
