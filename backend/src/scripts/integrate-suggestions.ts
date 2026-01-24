#!/usr/bin/env node

/**
 * Entegrasyon Betiği: Yüksek güvenli önerileri otomatik ekleme
 *
 * Bu betik suggestions_output.json dosyasını okur ve belirli bir
 * güven eşiğinin üzerindeki alan adlarını engel listesine ekler.
 *
 * Kullanım:
 *   npm run integrate-suggestions <suggestions_output.json> [min-confidence]
 *
 * Örnek:
 *   npm run integrate-suggestions data/suggestions_output.json 80
 */

import fs from 'fs';
import { BlocklistStorage } from '../storage/blocklist-storage';
import { Suggestion } from '../services/domain-suggestor';

interface SuggestionsFile {
  suggestions: Suggestion[];
  summary: any;
  timestamp: number;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Kullanım: npm run integrate-suggestions <suggestions_output.json> [min-confidence]');
    process.exit(1);
  }

  const suggestionsFile = args[0];
  const minConfidence = args[1] ? parseInt(args[1], 10) : 80;

  // Önerileri oku
  let suggestionsData: SuggestionsFile;
  try {
    const content = fs.readFileSync(suggestionsFile, 'utf-8');
    suggestionsData = JSON.parse(content);
  } catch (error) {
    console.error(`Öneri dosyası okunurken hata:`, error);
    process.exit(1);
  }

  const suggestions = suggestionsData.suggestions.filter(
    s => s.confidence >= minConfidence
  );

  if (suggestions.length === 0) {
    console.log(`Güven >= ${minConfidence}% olan öneri bulunamadı`);
    process.exit(0);
  }

  console.log(`Güven >= ${minConfidence}% olan ${suggestions.length} alan adı ekleniyor...\n`);

  // Engel listesi depolamasını başlat
  const blocklistStorage = new BlocklistStorage();
  await blocklistStorage.initialize();

  let added = 0;
  let skipped = 0;

  for (const suggestion of suggestions) {
    try {
      const reason = `Otomatik öneri: ${suggestion.reasons.join('; ')} (güven: ${suggestion.confidence}%)`;
      await blocklistStorage.addDomain(suggestion.domain, reason);
      console.log(`✅ Eklendi: ${suggestion.domain} [${suggestion.confidence}%]`);
      added++;
    } catch (error) {
      console.error(`❌ ${suggestion.domain} eklenemedi:`, error);
      skipped++;
    }
  }

  const metadata = await blocklistStorage.getMetadata();
  
  console.log('\n' + '='.repeat(80));
  console.log('Özet:');
  console.log(`  Eklendi: ${added}`);
  console.log(`  Atlandı: ${skipped}`);
  console.log(`  Engel listesi sürümü: ${metadata.version}`);
  console.log(`  Engel listesindeki toplam alan adı: ${(await blocklistStorage.getDomains()).length}`);
  console.log('='.repeat(80));
}

main().catch(error => {
  console.error('Hata:', error);
  process.exit(1);
});
