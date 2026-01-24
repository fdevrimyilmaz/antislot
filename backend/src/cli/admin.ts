#!/usr/bin/env node

/**
 * AntiSlot Engel Listesi Yönetimi için Yönetici CLI Betiği
 * Kullanım:
 *   npm run admin add <domain> [reason]
 *   npm run admin remove <domain>
 *   npm run admin list
 *   npm run admin bump-version [blocklist|patterns|both]
 *   npm run admin stats
 */

import { BlocklistStorage } from '../storage/blocklist-storage';
import { PatternsStorage } from '../storage/patterns-storage';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const blocklistStorage = new BlocklistStorage();
  const patternsStorage = new PatternsStorage();

  try {
    await blocklistStorage.initialize();
    await patternsStorage.initialize();

    switch (command) {
      case 'add':
        await handleAdd(blocklistStorage, args);
        break;
      case 'remove':
        await handleRemove(blocklistStorage, args);
        break;
      case 'list':
        await handleList(blocklistStorage);
        break;
      case 'bump-version':
        await handleBumpVersion(blocklistStorage, patternsStorage, args);
        break;
      case 'stats':
        await handleStats(blocklistStorage, patternsStorage);
        break;
      default:
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('Hata:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleAdd(storage: BlocklistStorage, args: string[]) {
  if (args.length < 2) {
    console.error('Kullanım: npm run admin add <domain> [reason]');
    process.exit(1);
  }

  const domain = args[1];
  const reason = args[2] || 'CLI üzerinden manuel ekleme';

  await storage.addDomain(domain, reason);
  const metadata = await storage.getMetadata();

  console.log(`✅ Alan adı eklendi: ${domain}`);
  console.log(`   Neden: ${reason}`);
  console.log(`   Engel listesi sürümü: ${metadata.version}`);
}

async function handleRemove(storage: BlocklistStorage, args: string[]) {
  if (args.length < 2) {
    console.error('Kullanım: npm run admin remove <domain>');
    process.exit(1);
  }

  const domain = args[1];
  const removed = await storage.removeDomain(domain);

  if (removed) {
    const metadata = await storage.getMetadata();
    console.log(`✅ Alan adı kaldırıldı: ${domain}`);
    console.log(`   Engel listesi sürümü: ${metadata.version}`);
  } else {
    console.log(`ℹ️  Alan adı bulunamadı: ${domain}`);
  }
}

async function handleList(storage: BlocklistStorage) {
  const domains = await storage.getDomains();
  const metadata = await storage.getMetadata();

  console.log(`Engel listesi (sürüm ${metadata.version}, ${domains.length} alan adı):`);
  console.log('');

  if (domains.length === 0) {
    console.log('  (boş)');
  } else {
    domains.forEach(domain => {
      console.log(`  - ${domain}`);
    });
  }
}

async function handleBumpVersion(
  blocklistStorage: BlocklistStorage,
  patternsStorage: PatternsStorage,
  args: string[]
) {
  const target = args[1] || 'both';

  if (target === 'blocklist' || target === 'both') {
    const version = await blocklistStorage.bumpVersion();
    console.log(`✅ Engel listesi sürümü yükseltildi: ${version}`);
  }

  if (target === 'patterns' || target === 'both') {
    const version = await patternsStorage.bumpVersion();
    console.log(`✅ Kalıplar sürümü yükseltildi: ${version}`);
  }
}

async function handleStats(
  blocklistStorage: BlocklistStorage,
  patternsStorage: PatternsStorage
) {
  const blocklistMeta = await blocklistStorage.getMetadata();
  const patternsMeta = await patternsStorage.getMetadata();
  const domains = await blocklistStorage.getDomains();
  const patternsData = await patternsStorage.load();

  console.log('📊 AntiSlot Backend İstatistikleri');
  console.log('');
  console.log('Engel listesi:');
  console.log(`  Sürüm: ${blocklistMeta.version}`);
  console.log(`  Güncellendi: ${new Date(blocklistMeta.updatedAt).toISOString()}`);
  console.log(`  Alan adları: ${domains.length}`);
  console.log('');
  console.log('Kalıplar:');
  console.log(`  Sürüm: ${patternsMeta.version}`);
  console.log(`  Güncellendi: ${new Date(patternsMeta.updatedAt).toISOString()}`);
  console.log(`  Kalıplar: ${patternsData.patterns.length}`);
}

function printUsage() {
  console.log('AntiSlot Yönetici CLI');
  console.log('');
  console.log('Komutlar:');
  console.log('  add <domain> [reason]     Alan adını engel listesine ekle');
  console.log('  remove <domain>           Alan adını engel listesinden kaldır');
  console.log('  list                      Engellenen tüm alan adlarını listele');
  console.log('  bump-version [target]     Sürümü artır (blocklist|patterns|both)');
  console.log('  stats                     İstatistikleri göster');
  console.log('');
  console.log('Örnekler:');
  console.log('  npm run admin add bet365.com "Bilinen kumar sitesi"');
  console.log('  npm run admin remove bet365.com');
  console.log('  npm run admin list');
  console.log('  npm run admin bump-version both');
}

// CLI'yi çalıştır
main().catch(console.error);
