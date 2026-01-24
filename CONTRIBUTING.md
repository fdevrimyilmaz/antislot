# Katki Rehberi

Bu projeye katki yaptiginiz icin tesekkurler. Degisikliklerinizi kolayca
inceleyebilmemiz icin asagidaki rehbere uymanizi rica ederiz.

## Gelistirme Ortami

- Node.js 18+ (LTS onerilir)
- npm veya yarn

## Kurulum

```bash
# Mobil uygulama
npm install

# Backend API
cd backend
npm install

# AI chat server
cd ../server
npm install
```

## Calistirma

```bash
# Mobil uygulama
npm start

# Android / iOS
npm run android
npm run ios

# Web
npm run web
```

```bash
# Backend API
cd backend
npm run dev
```

```bash
# AI chat server
cd server
npm run dev
```

## Ortam Degiskenleri

Gizli anahtarlar ve endpoint ayarlari icin `.env` dosyalari kullanin:

- `./.env` (Expo uygulamasi, `EXPO_PUBLIC_` ile baslar)
- `backend/.env`
- `server/.env`

Ornek dosyalar icin `.env.example` dosyalarini kopyalayin.

## Test ve Lint

```bash
# Mobil uygulama
npm run lint
```

```bash
# Backend
cd backend
npm test
npm run test:watch
npm run test:coverage
```

## Kod Stili

- TypeScript kullanin, `any` ve `ts-ignore` seceneklerinden kacinin.
- Kucuk, okunabilir fonksiyonlar tercih edin.
- Yeni ozellikler icin uygun dokumantasyon ekleyin.

## PR Kurallari

- Degisiklikleri kucuk ve odakli tutun.
- Gerekliyse test ekleyin ve calistirin.
- Ekran goruntusu/animasyon gerekiyorsa ekleyin.
- Gizli anahtar veya kisi verisi commit etmeyin.
