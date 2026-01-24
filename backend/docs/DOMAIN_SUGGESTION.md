# Alan Adı Öneri Sistemi

Gözlemlenen alan adlarını analiz ederek engel listesine eklenmesi gerekenleri öneren otomatik alan adı öneri sistemi.

## Genel Bakış

Alan adı öneri sistemi, olası kumar alan adlarını belirlemek için birden fazla sezgisel yöntem kullanır:

1. **Anahtar Kelime Puanlama** - Kumarla ilgili anahtar kelimeleri tespit eder (bet, casino, bahis, slot, vb.)
2. **Levenshtein Benzerliği** - Mevcut engellenen alan adlarıyla karşılaştırır
3. **Hile Tespiti** - Alan adı manipülasyon tekniklerini belirler (TLD hileleri, alt alan adı hileleri, ayna alan adları)
4. **Kalıp Eşleştirme** - Mevcut engel listesi kalıplarıyla eşleştirir

## Hızlı Başlangıç

### 1. Girdi Dosyasını Hazırlayın

Gözlemlenen alan adlarını içeren bir dosya oluşturun (her satırda bir alan adı):

```bash
# observed_domains.txt
bet365.com
betway.com
bet365-new.com
casino365.net
```

### 2. Öneri Betiğini Çalıştırın

```bash
npm run suggest data/observed_domains.txt
```

### 3. Çıktıyı İnceleyin

Betiğin ürettiği çıktılar:
- Sıralı önerileri gösteren konsol çıktısı
- `suggestions_output.json` - Tüm ayrıntılarla JSON çıktısı
- `suggestions_output.csv` - Kolay inceleme için CSV

### 4. Önerileri Entegre Et (Opsiyonel)

Yüksek güvenli önerileri otomatik ekle (varsayılan 80%+):

```bash
npm run integrate-suggestions data/suggestions_output.json 80
```

## Sezgisel Yöntemler (Heuristics)

### 1. Anahtar Kelime Puanlama (0-50 puan)

**Tespit edilen anahtar kelimeler:**
- `bet`, `casino`, `bahis`, `slot`, `wager`, `poker`, `roulette`
- `jackpot`, `lottery`, `bingo`, `gambling`, `wagering`, `odds`
- `stake`, `pari`, `sportbook`, `sportsbook`, `parlay`, `blackjack`

**Puanlama:**
- Temel puan: Anahtar kelime eşleşmesi başına 30 puan
- Bonus: Ek anahtar kelime başına +5 puan (maks. 15 bonus puan)
- Ceza: Anahtar kelime başka bir kelimenin parçasıysa -%30 (örn. "abet")

**Örnek:**
```
bet365.com → 30 puan (anahtar kelime: "bet")
casino-online.com → 60 puan (anahtar kelimeler: "casino", "online" bonus)
```

### 2. Levenshtein Benzerliği (0-30 puan)

**Algoritma:**
- Gözlemlenen alan adı ile engellenen alan adları arasındaki düzenleme mesafesini hesaplar
- Benzerlik puanı: `1 - (edit_distance / max_length)`
- Eşik: 0.7 (70% benzerlik) yüksek güven için gereklidir
- Puan: `benzerlik * 30`

**Örnek:**
```
Engellenen: bet365.com
Gözlemlenen: bet366.com → %95 benzerlik → 28.5 puan
Gözlemlenen: bet365m.com → %90 benzerlik → 27 puan
```

### 3. Hile Tespiti (0-25 puan)

**Tespit Edilen Hileler:**

**TLD Hileleri:**
- Şüpheli TLD'ler: `.bet`, `.casino`, `.poker`, `.games`, `.win`
- Puan: +1.0 (100 puan normalize)

**Sayı Kalıpları:**
- Kalıplar: `bet123`, `123bet`, `casino456`, `456casino`
- Puan: +0.8

**Tireli Alan Adları:**
- Kalıp: `bet-365`, `casino-online`
- Puan: +0.7

**Ayna Alan Adları:**
- Ters çevrilmiş alan adları, karakter değişimleri
- Puan: +0.8

**Alt Alan Adı Hileleri:**
- `www-bet.com`, `bet-www.org`
- Puan: +0.6

**Karakter İkamesi:**
- `0` → `O`, `1` → `I`, `5` → `S`
- Puan: +0.5

**Toplam Hile Puanı:** Tüm tespitlerin toplamı (0-1 arası normalize) × 25

### 4. Kalıp Eşleştirme (0-20 puan)

Alan adı `patterns.json` içindeki kalıplarla eşleştirilir:
- Tam eşleşmeler
- Alt alan adı eşleşmeleri
- İçerir eşleşmeleri
- Regex eşleşmeleri

Puan: `pattern_weight × 20` (normalize)

## Çıktı Formatı

### JSON Çıktısı

```json
{
  "suggestions": [
    {
      "domain": "bet365-new.com",
      "confidence": 85,
      "reasons": [
        "Kumar anahtar kelimesi içeriyor: \"bet\"",
        "Engelli alan adına yüksek benzerlik (95%): bet365.com",
        "Tireli kumar anahtar kelimesi içeriyor"
      ],
      "matchedPatterns": [
        "bet",
        "similar:bet365.com",
        "hyphenated-keyword"
      ],
      "keywordScore": 30,
      "similarityScore": 0.95,
      "trickScore": 0.7
    }
  ],
  "summary": {
    "totalAnalyzed": 50,
    "suggested": 12,
    "minConfidence": 52,
    "averageConfidence": 73
  },
  "timestamp": 1234567890
}
```

### CSV Çıktısı

```csv
AlanAdi,Güven,Nedenler,Kalıplar
bet365-new.com,85,"Kumar anahtar kelimesi içeriyor: bet; Engelli alan adına yüksek benzerlik (95%): bet365.com","bet,similar:bet365.com,hyphenated-keyword"
casino365.net,78,"Kumar anahtar kelimesi içeriyor: casino; Sayı kalıbıyla eşleşiyor","casino,number-pattern:casino\d+"
```

## Yönetici İş Akışına Entegrasyon

### Seçenek 1: Manuel İnceleme

1. Öneri betiğini çalıştırın
2. CSV çıktısını e-tabloda inceleyin
3. Alan adlarını admin CLI ile manuel ekleyin:

```bash
npm run admin add bet365-new.com "Otomatik öneri: Yüksek güven (85%)"
```

### Seçenek 2: Otomatik Entegrasyon

Entegrasyon betiğini kullanarak yüksek güvenli önerileri otomatik ekleyin:

```bash
# Alan adlarını analiz et
npm run suggest data/observed_domains.txt

# %80+ güvenle otomatik ekle
npm run integrate-suggestions data/suggestions_output.json 80

# %90+ güvenle otomatik ekle (daha muhafazakar)
npm run integrate-suggestions data/suggestions_output.json 90
```

### Seçenek 3: Zamanlanmış İş Akışı

Gözlemlenen alan adlarını işlemek için cron işi kurun:

```bash
# daily-suggest.sh
#!/bin/bash
cd /path/to/backend
npm run suggest /path/to/observed_domains.txt
npm run integrate-suggestions data/suggestions_output.json 85
```

```bash
# crontab'a ekleyin (her gün 02:00'de çalışır)
0 2 * * * /path/to/daily-suggest.sh
```

## Yapılandırma

Sezgisel ayarları `src/services/domain-suggestor.ts` içinde özelleştirin:

```typescript
const suggestor = new DomainSuggestor(blocklistStorage, patternsStorage, {
  minConfidence: 50,              // Öneri için minimum güven
  similarityThreshold: 0.7,       // Minimum benzerlik (0-1)
  keywordWeights: {               // Özel anahtar kelime ağırlıkları
    'bet': 1.2,                   // 'bet' için ağırlığı artır
    'casino': 1.0,
    'bahis': 0.9                  // 'bahis' için ağırlığı azalt
  }
});
```

## Örnek İş Akışı

```bash
# 1. Gözlemlenen alan adlarını topla (log, izleme vb.)
# data/observed_domains.txt dosyasına kaydet

# 2. Öneri analizini çalıştır
npm run suggest data/observed_domains.txt

# 3. Çıktıyı incele
cat data/suggestions_output.csv

# 4. Yüksek güvenli öneriler için otomatik ekle
npm run integrate-suggestions data/suggestions_output.json 85

# 5. Düşük güvenli öneriler için manuel inceleyip ekle
npm run admin add suspicious-domain.com "İncelendi: Orta güven, manuel ekleme"

# 6. Güncellenen engel listesini kontrol et
npm run admin list
npm run admin stats
```

## Doğruluk İpuçları

1. **Muhafazakar başlayın:** İlk etapta daha yüksek güven eşiği kullanın (80-90%)
2. **Yanlış pozitifleri inceleyin:** Yüksek puan alıp kumarla ilgili olmayan alan adlarını kontrol edin
3. **Ağırlıkları ayarlayın:** Alan adı örüntülerinize göre anahtar kelime ağırlıklarını özelleştirin
4. **Sonuçları izleyin:** Önerilen alan adlarının gerçekten kumar sitesi olup olmadığını takip edin
5. **Kalıpları güncelleyin:** Başarılı tespitleri `patterns.json` dosyasına ekleyin

## Sorun Giderme

**Öneri üretilmiyor:**
- Minimum güven eşiğini kontrol edin (varsayılan: 50%)
- Engel listesi ve kalıpların yüklendiğinden emin olun
- Girdi dosyasında geçerli alan adları olduğundan emin olun

**Çok fazla yanlış pozitif:**
- Minimum güven eşiğini artırın
- Anahtar kelime ağırlıklarını ayarlayın (ör. "bet" gibi yaygın kelimeleri azaltın)
- Benzerlik eşiğini artırın

**Çok az öneri:**
- Minimum güven eşiğini düşürün
- Daha fazla kumar anahtar kelimesi ekleyin
- Benzerlik eşiğini düşürün

## API Entegrasyonu

Öneri servisi programatik olarak da kullanılabilir:

```typescript
import { DomainSuggestor } from './services/domain-suggestor';
import { BlocklistStorage } from './storage/blocklist-storage';
import { PatternsStorage } from './storage/patterns-storage';

const blocklistStorage = new BlocklistStorage();
const patternsStorage = new PatternsStorage();
const suggestor = new DomainSuggestor(blocklistStorage, patternsStorage);

await suggestor.initialize();

const suggestion = await suggestor.analyzeDomain('bet365-new.com');
console.log(suggestion);
// {
//   domain: 'bet365-new.com',
//   confidence: 85,
//   reasons: [...],
//   matchedPatterns: [...]
// }
```
