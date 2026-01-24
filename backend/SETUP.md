# Hızlı Kurulum Rehberi

## Ön Koşullar

- Node.js 18+
- npm or yarn

## Kurulum

```bash
cd backend
npm install
```

## Geliştirme

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Sunucu http://localhost:3000 üzerinde çalışır
```

## Testler

```bash
# Testleri çalıştır
npm test

# Watch modu
npm run test:watch

# Coverage
npm run test:coverage
```

## Yönetici CLI

```bash
# Alan adı ekle
npm run admin add bet365.com "Bilinen kumar sitesi"

# Alan adı kaldır
npm run admin remove bet365.com

# Alan adlarını listele
npm run admin list

# Sürüm artır
npm run admin bump-version both

# İstatistikleri göster
npm run admin stats
```

## API Uç Noktaları

Çalıştırdıktan sonra:

- `GET http://localhost:3000/v1/health` - Sağlık kontrolü
- `GET http://localhost:3000/v1/blocklist` - Engel listesini al
- `GET http://localhost:3000/v1/patterns` - Kalıpları al
- `POST http://localhost:3000/v1/ai/chat` - YAPAY ANTİ sohbeti

## Üretim Derlemesi

```bash
npm run build
npm start
```

## Ortam Değişkenleri

```bash
export PORT=3000
export NODE_ENV=production
export HMAC_SECRET=your-secret-key-here
export OPENAI_API_KEY=your-openai-key-here
# Opsiyonel:
# export OPENAI_MODEL=gpt-4o-mini
# export OPENAI_BASE_URL=https://api.openai.com/v1
# export OPENAI_TIMEOUT_MS=15000
# export OPENAI_MAX_TOKENS=300
```
