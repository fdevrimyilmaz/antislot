# Hızlı Başlangıç: Alan Adı Öneri Sistemi

## Adım 1: Girdi Dosyasını Hazırlayın

`data/observed_domains.txt` dosyasını alan adlarıyla oluşturun (her satıra bir alan adı):

```
bet365-new.com
casino365.net
bet366.com
bahis-site.org
```

## Adım 2: Analizi Çalıştırın

```bash
cd backend
npm run suggest data/observed_domains.txt
```

## Adım 3: Çıktıyı İnceleyin

Konsol sıralı önerileri gösterir:
```
Sıralı Öneriler:

1. bet365-new.com [88%]
   Nedenler: Kumar anahtar kelimesi içeriyor: "bet"; Engelli alan adına yüksek benzerlik (95%): bet365.com
   Kalıplar: bet, similar:bet365.com, hyphenated-keyword
   Puanlar: anahtarKelimeler: 30.00, benzerlik: 95%, hileler: 70%
```

Oluşturulan çıktı dosyaları:
- `data/suggestions_output.json` - Tüm ayrıntılarla tam JSON
- `data/suggestions_output.csv` - E-tabloda incelemek için CSV

## Adım 4: Önerileri Entegre Et

**Seçenek A: Manuel İnceleme** (ilk sefer için önerilir)
```bash
# CSV'yi e-tabloda inceleyin, sonra manuel ekleyin:
npm run admin add bet365-new.com "Otomatik öneri: Yüksek güven (88%)"
```

**Seçenek B: Yüksek Güveni Otomatik Ekle** (80%+)
```bash
npm run integrate-suggestions data/suggestions_output.json 80
```

**Seçenek C: Çok Yüksek Güveni Otomatik Ekle** (90%+)
```bash
npm run integrate-suggestions data/suggestions_output.json 90
```

## Örnek İş Akışı

```bash
# 1. Log/izleme çıktılarından gözlemlenen alan adlarını topla
echo "bet365-new.com" >> data/observed_domains.txt
echo "casino365.net" >> data/observed_domains.txt

# 2. Analiz et
npm run suggest data/observed_domains.txt

# 3. Çıktıyı incele
cat data/suggestions_output.csv

# 4. Yüksek güvenli önerileri otomatik ekle
npm run integrate-suggestions data/suggestions_output.json 85

# 5. Sonuçları kontrol et
npm run admin stats
npm run admin list | grep "bet365-new"
```

## Güven Seviyeleri

- **90-100%**: Neredeyse kesin kumar - otomatik ekleme önerilir
- **80-89%**: Yüksek olasılık - incelemeyle otomatik ekleme
- **70-79%**: Orta - manuel inceleme önerilir
- **50-69%**: Düşük güven - dikkatli manuel inceleme
- **< 50%**: Önerilmez (filtrelenir)

## Yapılandırma

Ayarlamak için `src/services/domain-suggestor.ts` dosyasını düzenleyin:
- Minimum güven eşiği
- Anahtar kelime ağırlıkları
- Benzerlik eşiği

Tam dokümantasyon için `docs/DOMAIN_SUGGESTION.md` dosyasına bakın.
