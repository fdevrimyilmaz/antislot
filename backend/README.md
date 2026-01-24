# AntiSlot Backend API

AntiSlot’un kumar sitesi engelleme özelliği için üretime hazır backend API.

## Teknoloji Yığını

- **Fastify** - Yüksek performanslı Node.js web framework'ü
- **TypeScript** - Tip güvenli geliştirme
- **Jest** - Birim test çerçevesi
- **HMAC-SHA256** - Bütünlük doğrulaması için imza üretimi

## Özellikler

✅ Sürümlemeli uç noktalarla RESTful API (`/v1/*`)  
✅ Verimli önbellek için ETag desteği (304 Not Modified)  
✅ İstemci tarafı önbellek için Cache-Control başlıkları  
✅ Veri bütünlüğü doğrulaması için HMAC imzaları  
✅ DB'ye hazır yapıyla dosya tabanlı depolama (JSON)  
✅ Alan adı yönetimi için yönetici CLI  
✅ Kapsamlı birim testleri  
✅ Üretime hazır hata yönetimi  

## Hızlı Başlangıç

### Kurulum

```bash
cd backend
npm install
```

### Yapılandırma

Ortam değişkenlerini ayarlayın (opsiyonel, varsayılanlar sağlanır):

```bash
export PORT=3000
export NODE_ENV=production
export HMAC_SECRET=your-secret-key-here
export DATA_DIR=./data
```

### Geliştirme

```bash
# Hot reload ile geliştirme sunucusunu başlat
npm run dev

# Ya da watch moduyla
npm run watch
```

### Üretim

```bash
# TypeScript derle
npm run build

# Sunucuyu başlat
npm start
```

Sunucu varsayılan olarak `http://localhost:3000` üzerinde çalışır.

## API Uç Noktaları

### GET /v1/health

Sağlık kontrolü uç noktası.

**Yanıt:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "blocklistVersion": 42,
  "blocklistCount": 15420,
  "patternsVersion": 10,
  "patternsCount": 8
}
```

### GET /v1/blocklist

Sürüm, updatedAt ve HMAC imzasıyla engel listesini döner.

**Yanıt:**
```json
{
  "version": 42,
  "updatedAt": 1234567890,
  "domains": ["bet365.com", "betway.com", "casino.com"],
  "signature": "abc123def456..."
}
```

**Başlıklar:**
- `ETag: "abc123def4567890"` - Koşullu istekler için
- `Cache-Control: public, max-age=3600, must-revalidate` - Önbellek politikası

**Koşullu İstek:**
```http
GET /v1/blocklist HTTP/1.1
If-None-Match: "abc123def4567890"

HTTP/1.1 304 Not Modified
ETag: "abc123def4567890"
```

### GET /v1/patterns

Sürüm, updatedAt ve HMAC imzasıyla kalıp kurallarını döner.

**Yanıt:**
```json
{
  "version": 10,
  "updatedAt": 1234567890,
  "patterns": [
    {
      "pattern": "bet",
      "type": "contains",
      "weight": 0.7
    },
    {
      "pattern": "^bet\\d+\\.",
      "type": "regex",
      "weight": 0.8
    }
  ],
  "signature": "def456ghi789..."
}
```

**Başlıklar:**
- `ETag: "def456ghi7890123"` - Koşullu istekler için
- `Cache-Control: public, max-age=7200, must-revalidate` - Önbellek politikası

## İmza Doğrulama

Tüm yanıtlar HMAC-SHA256 imzası içerir. İstemciler veri bütünlüğünü doğrulamak için bu imzayı kontrol etmelidir:

```typescript
import crypto from 'crypto';

function verifySignature(data: object, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(data));
  const expected = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// Örnek kullanım
const response = await fetch('/v1/blocklist');
const data = await response.json();
const { signature, ...payload } = data;

if (!verifySignature(payload, signature, HMAC_SECRET)) {
  throw new Error('Geçersiz imza - veri değişmiş olabilir');
}
```

## Yönetici CLI

Komut satırından engel listesi alan adlarını ve sürümleri yönetin:

### Alan Adı Ekle

```bash
npm run admin add <domain> [reason]

# Örnekler:
npm run admin add bet365.com "Bilinen kumar sitesi"
npm run admin add casino.com
```

### Alan Adı Kaldır

```bash
npm run admin remove <domain>

# Örnek:
npm run admin remove bet365.com
```

### Alan Adlarını Listele

```bash
npm run admin list
```

### Sürüm Artırma

Sürüm numarasını manuel olarak artırın:

```bash
npm run admin bump-version [blocklist|patterns|both]

# Örnekler:
npm run admin bump-version blocklist
npm run admin bump-version patterns
npm run admin bump-version both  # Varsayılan
```

### İstatistikleri Göster

```bash
npm run admin stats
```

## Testler

Birim testleri çalıştırın:

```bash
# Tüm testleri çalıştır
npm test

# Watch moduyla çalıştır
npm run test:watch

# Coverage raporu üret
npm run test:coverage
```

Test kapsamı şunları içerir:
- ✅ API uç noktası yanıtları
- ✅ ETag ve Cache-Control başlıkları
- ✅ 304 Not Modified yanıtları
- ✅ İmza üretimi ve doğrulaması
- ✅ Yanıt yapısı doğrulaması

## Veri Yapısı

### Engel Listesi Dosyası (`data/blocklist.json`)

```json
{
  "version": 42,
  "updatedAt": 1234567890,
  "entries": [
    {
      "domain": "bet365.com",
      "patterns": [
        {
          "pattern": "bet365.com",
          "type": "exact",
          "weight": 1.0
        }
      ],
      "addedAt": 1234567890,
      "updatedAt": 1234567890,
      "reason": "Bilinen kumar sitesi"
    }
  ]
}
```

### Kalıplar Dosyası (`data/patterns.json`)

```json
{
  "version": 10,
  "updatedAt": 1234567890,
  "patterns": [
    {
      "pattern": "bet",
      "type": "contains",
      "weight": 0.7
    },
    {
      "pattern": "^bet\\d+\\.",
      "type": "regex",
      "weight": 0.8
    }
  ]
}
```

**Not:** Yapı DB'ye hazırdır. Veritabanına taşımak için:

1. `BlocklistStorage`/`PatternsStorage` yerine DB adaptörü kullanın
2. Aynı TypeScript arayüzlerini koruyun
3. Başlatma mantığını güncelleyin

## Proje Yapısı

```
backend/
├── src/
│   ├── server.ts              # Fastify sunucu + rotalar
│   ├── config.ts              # Yapılandırma
│   ├── types.ts               # TypeScript arayüzleri
│   ├── storage/
│   │   ├── blocklist-storage.ts   # Engel listesi dosya işlemleri
│   │   └── patterns-storage.ts    # Kalıp dosya işlemleri
│   ├── utils/
│   │   └── signature.ts           # HMAC imza üretimi
│   ├── middleware/
│   │   └── cache.ts               # ETag + Cache-Control
│   ├── cli/
│   │   └── admin.ts               # Yönetici CLI betiği
│   └── __tests__/
│       ├── server.test.ts         # API uç nokta testleri
│       └── signature.test.ts      # İmza doğrulama testleri
├── data/                     # JSON dosyaları (ilk çalıştırmada oluşur)
├── dist/                     # Derlenmiş JavaScript
├── coverage/                 # Test kapsam raporları
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `PORT` | `3000` | Sunucu portu |
| `NODE_ENV` | `development` | Ortam modu |
| `HMAC_SECRET` | `antislot-secret-key-change-in-production` | HMAC imzaları için gizli anahtar |
| `DATA_DIR` | `./data` | JSON dosyaları için dizin |
| `AUTO_VERSION_BUMP` | `true` | Değişikliklerde sürümü otomatik artır |

## Performans

- **Fastify**: ~50k istek/sn (benchmark)
- **Önbellek**: Dosya okumaları için 5 saniyelik bellek içi önbellek
- **Sıkıştırma**: Fastify otomatik sıkıştırma etkin
- **ETag**: Verimli koşullu istekler (304 yanıtları)

## Güvenlik

- ✅ Bütünlük için HMAC-SHA256 imzaları
- ✅ Zamanlamaya dayanıklı imza karşılaştırması
- ✅ Girdi doğrulama
- ✅ CORS yapılandırması
- ✅ Kullanıcı verisi loglanmaz
- ⚠️ **Önemli**: Üretimde `HMAC_SECRET` değerini değiştirin!

## Üretim Dağıtımı

1. Ortam değişkenlerini ayarlayın:
   ```bash
   export NODE_ENV=production
   export HMAC_SECRET=<generate-strong-secret>
   export PORT=3000
   ```

2. Derleyip başlatın:
   ```bash
   npm run build
   npm start
   ```

3. Süreç yöneticisi kullanın (PM2, systemd, vb.):
   ```bash
   pm2 start dist/server.js --name antislot-api
   ```

4. Reverse proxy yapılandırın (nginx):
   ```nginx
   location / {
     proxy_pass http://localhost:3000;
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
   }
   ```

## Lisans

MIT
