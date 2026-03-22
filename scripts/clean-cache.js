const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const cleanAll = args.includes('--all');

console.log('🧹 Expo cache temizleniyor...\n');

// Temizlenecek klasörler ve dosyalar
const itemsToClean = [
  { path: path.join(projectRoot, '.expo'), name: '.expo klasörü' },
  { path: path.join(projectRoot, 'node_modules', '.cache'), name: 'node_modules/.cache' },
];

if (cleanAll) {
  itemsToClean.push(
    { path: path.join(projectRoot, '.expo'), name: '.expo klasörü (tümü)' },
  );
}

// Temizleme fonksiyonu
function removeItem(itemPath, itemName) {
  try {
    if (fs.existsSync(itemPath)) {
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`✅ ${itemName} silindi`);
      } else {
        fs.unlinkSync(itemPath);
        console.log(`✅ ${itemName} silindi`);
      }
      return true;
    } else {
      console.log(`ℹ️  ${itemName} bulunamadı (zaten temiz)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${itemName} silinirken hata: ${error.message}`);
    return false;
  }
}

// Metro cache temizleme (Windows için)
function cleanMetroCache() {
  const os = require('node:os');
  const tempDir = os.tmpdir();
  
  try {
    const tempFiles = fs.readdirSync(tempDir);
    let cleaned = 0;
    
    tempFiles.forEach(file => {
      if (file.startsWith('metro-') || file.startsWith('haste-map-')) {
        try {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          cleaned++;
        } catch (error) {
          // Sessizce devam et
        }
      }
    });
    
    if (cleaned > 0) {
      console.log(`✅ Metro cache temizlendi (${cleaned} öğe)`);
    } else {
      console.log(`ℹ️  Metro cache bulunamadı`);
    }
  } catch (error) {
    console.log(`ℹ️  Metro cache temizlenemedi: ${error.message}`);
  }
}

// Ana temizleme işlemi
let cleanedCount = 0;

console.log('Temizleniyor...\n');

itemsToClean.forEach(item => {
  if (removeItem(item.path, item.name)) {
    cleanedCount++;
  }
});

// Metro cache temizle
cleanMetroCache();

console.log('\n' + '='.repeat(50));
if (cleanedCount > 0) {
  console.log(`✅ Temizleme tamamlandı! (${cleanedCount} öğe temizlendi)`);
} else {
  console.log('ℹ️  Zaten temiz görünüyor.');
}
console.log('='.repeat(50));
console.log('\nŞimdi Expo\'yu başlatmak için:');
console.log('  npm start');
console.log('veya');
console.log('  npm run start:clear\n');
