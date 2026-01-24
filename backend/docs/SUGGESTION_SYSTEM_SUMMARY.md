# Alan Adı Öneri Sistemi - Özet

## Ne İnşa Edildi

Gözlemlenen alan adlarını otomatik analiz eden ve birden fazla sezgisel yönteme göre engel listesine eklenmesi gerekenleri öneren, üretime hazır bir alan adı öneri sistemi.

## Oluşturulan Dosyalar

### Çekirdek Servis
- **`src/services/domain-suggestor.ts`** - Tüm sezgisel yöntemleri içeren ana öneri motoru

### Betikler
- **`src/scripts/suggest-domains.ts`** - Girdi dosyasından alan adlarını analiz eden CLI betiği
- **`src/scripts/integrate-suggestions.ts`** - Yüksek güvenli önerileri otomatik ekleyen CLI betiği

### Dokümantasyon
- **`docs/DOMAIN_SUGGESTION.md`** - Örneklerle tam dokümantasyon
- **`QUICK_START_SUGGESTION.md`** - Hızlı referans rehberi

### Örnek Veri
- **`data/observed_domains.txt`** - Farklı alan adı türleri içeren örnek girdi dosyası
- **`data/example_suggestions_output.json`** - Örnek JSON çıktısı
- **`data/example_suggestions_output.csv`** - Örnek CSV çıktısı

## Nasıl Kullanılır

### Temel Kullanım

```bash
# 1. Gözlemlenen alan adlarıyla girdi dosyası oluştur
echo "bet365-new.com" > data/observed_domains.txt
echo "casino365.net" >> data/observed_domains.txt

# 2. Analizi çalıştır
npm run suggest data/observed_domains.txt

# 3. Çıktıyı incele (konsol + JSON + CSV)
cat data/suggestions_output.csv

# 4. Yüksek güvenli önerileri otomatik ekle
npm run integrate-suggestions data/suggestions_output.json 80
```

### Yönetici İş Akışına Entegrasyon

**Seçenek 1: Manuel İnceleme** (başlangıç için önerilir)
```bash
npm run suggest data/observed_domains.txt
# CSV'yi e-tabloda incele
npm run admin add domain.com "Otomatik öneri: %85 güven"
```

**Seçenek 2: Otomatik Entegrasyon** (yüksek güven için)
```bash
npm run suggest data/observed_domains.txt
npm run integrate-suggestions data/suggestions_output.json 85
```

**Seçenek 3: Zamanlanmış İş Akışı** (üretim)
```bash
# daily-suggest.sh
npm run suggest /var/log/observed_domains.txt
npm run integrate-suggestions data/suggestions_output.json 90
```

## Uygulanan Sezgisel Yöntemler

### 1. Anahtar Kelime Puanlama (0-50 puan)
- Tespit eder: `bet`, `casino`, `bahis`, `slot`, `wager`, `poker`, vb.
- Temel: Anahtar kelime başına 30 puan
- Bonus: Ek anahtar kelime başına +5 (maks. 15)
- Ceza: Yanlış pozitifler için -%30

### 2. Levenshtein Benzerliği (0-30 puan)
- Tüm engellenen alan adlarına karşılaştırır
- Benzerlik: `1 - (edit_distance / max_length)`
- Eşik: 0.7 (70%) gerekli
- Puan: `benzerlik × 30`

### 3. Hile Tespiti (0-25 puan)
- TLD hileleri (`.bet`, `.casino`)
- Sayı kalıpları (`bet123`, `123bet`)
- Tireli alan adları (`bet-365`)
- Ayna alan adları (ters çevirme, değişim)
- Alt alan adı hileleri (`www-bet.com`)
- Karakter ikamesi (`0`→`O`)

### 4. Kalıp Eşleştirme (0-20 puan)
- Mevcut `patterns.json` ile eşleştirme
- Exact, subdomain, contains, regex kalıpları
- Puan: `pattern_weight × 20`

## Çıktı Formatı

### Konsol Çıktısı
```
Sıralı Öneriler:

1. bet365-new.com [88%]
   Nedenler: Kumar anahtar kelimesi içeriyor: "bet"; Engelli alan adına yüksek benzerlik (95%): bet365.com
   Kalıplar: bet, similar:bet365.com, hyphenated-keyword
   Puanlar: anahtarKelimeler: 30.00, benzerlik: 95%, hileler: 70%
```

### JSON Çıktısı
```json
{
  "suggestions": [
    {
      "domain": "bet365-new.com",
      "confidence": 88,
      "reasons": [...],
      "matchedPatterns": [...],
      "keywordScore": 30,
      "similarityScore": 0.95,
      "trickScore": 0.7
    }
  ],
  "summary": {
    "totalAnalyzed": 30,
    "suggested": 4,
    "averageConfidence": 78
  }
}
```

### CSV Çıktısı
```csv
AlanAdi,Güven,Nedenler,Kalıplar
bet365-new.com,88,"Kumar anahtar kelimesi içeriyor: bet; Engelli alan adına yüksek benzerlik (95%)","bet,similar:bet365.com"
```

## Yapılandırma

Kodda veya config üzerinden özelleştirin:

```typescript
const suggestor = new DomainSuggestor(blocklistStorage, patternsStorage, {
  minConfidence: 50,           // Öneri için minimum güven
  similarityThreshold: 0.7,    // Benzerlik eşiği
  keywordWeights: {
    'bet': 1.2,                // Ağırlığı artır
    'bahis': 0.9               // Ağırlığı azalt
  }
});
```

## Sonraki Adımlar

1. **Muhafazakar Başlayın**: İlk etapta %85-90 güven eşiği kullanın
2. **Sonuçları İzleyin**: Yanlış pozitif/negatifleri takip edin
3. **Ağırlıkları Ayarlayın**: Alan adı örüntülerinize göre anahtar kelime ağırlıklarını ince ayarlayın
4. **Kalıp Ekleyin**: Başarılı tespitleri `patterns.json` dosyasına ekleyin
5. **Zamanlayın**: Günlük analiz için cron işi kurun

## Test

Örnek dosyayla test etmek için:

```bash
npm run suggest data/observed_domains.txt
# Çıktıyı incele
cat data/suggestions_output.json
```

Örnek dosya şunları içerir:
- Bilinen kumar alan adları (yüksek puan)
- Alan adı hileleri (hile tespitiyle bulunur)
- Benzer alan adları (Levenshtein ile bulunur)
- Yanlış pozitifler (düşük puan almalıdır)

## Entegrasyon Noktaları

### Programatik Kullanım

```typescript
import { DomainSuggestor } from './services/domain-suggestor';
import { BlocklistStorage } from './storage/blocklist-storage';
import { PatternsStorage } from './storage/patterns-storage';

const blocklistStorage = new BlocklistStorage();
const patternsStorage = new PatternsStorage();
const suggestor = new DomainSuggestor(blocklistStorage, patternsStorage);

await suggestor.initialize();
const suggestion = await suggestor.analyzeDomain('bet365-new.com');
```

### API Uç Noktası (Gelecek)

REST uç noktası olarak eklenebilir:
```
POST /v1/suggest
Body: { "domains": ["bet365-new.com", "casino365.net"] }
Response: { "suggestions": [...] }
```

## Özet

✅ **Tüm gerekli sezgisel yöntemleri içeren eksiksiz sistem**  
✅ Analiz ve entegrasyon için **çalıştırılabilir betikler**  
✅ Girdi/çıktı gösteren **örnek dosyalar**  
✅ Kullanım ve entegrasyon için **dokümantasyon**  
✅ Doğru hata yönetimiyle **üretime hazır** kod  
✅ **Birden fazla çıktı formatı** (konsol, JSON, CSV)  

Sistem kullanıma hazırdır ve yönetici iş akışınıza entegre edilebilir!
