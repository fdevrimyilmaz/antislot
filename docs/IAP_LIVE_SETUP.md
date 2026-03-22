# IAP Canlı Uçtan Uca Kurulum

Bu dokümanda Apple ve Google IAP canlı doğrulama, webhook testleri ve idempotency güvenliği açıklanmaktadır.

## 1. Apple Canlı Doğrulama

### Gereksinimler

- **IAP_IOS_SHARED_SECRET**: App Store Connect → My Apps → [Uygulama] → App Information → App-Specific Shared Secret

### Ürünler

- `antislot_premium_monthly` — aylık abonelik
- `antislot_premium_yearly` — yıllık abonelik  
- `antislot_premium_lifetime` — tek seferlik satın alma

### Doğrulama Akışı

1. İstemci satın alma tamamlandıktan sonra `transactionReceipt` (Base64) alır
2. Server `POST /v1/premium/activate` ile `receipt` ve `platform: "ios"` gönderir
3. Server `iap-store-validator` üzerinden Apple `verifyReceipt` API'sini çağırır:
   - Önce Production: `https://buy.itunes.apple.com/verifyReceipt`
   - Status 21007 ise Sandbox: `https://sandbox.itunes.apple.com/verifyReceipt`
4. Geçerli ürün ve süre kontrolü sonrası entitlement verilir

## 2. Google Canlı Doğrulama

### Gereksinimler

- **IAP_GOOGLE_SERVICE_ACCOUNT_JSON_B64**: Google Play Console → Service accounts → JSON key (base64 encode)
- **IAP_ANDROID_PACKAGE_NAME**: Uygulama paket adı (örn. `com.antislot.app`)

### Doğrulama Akışı

1. İstemci `purchaseToken` alır
2. Server `platform: "android"` ile receipt gönderir
3. Server Android Publisher API kullanır:
   - Abonelik: `purchases.subscriptionsv2/tokens/{token}`
   - Tek seferlik: `purchases/products/{productId}/tokens/{token}`

## 3. Webhook Testi

Renewal, cancel, refund, grace, expire event'lerini test etmek için:

```bash
cd server
IAP_SMOKE_BASE_URL=https://api.example.com IAP_WEBHOOK_SECRET=your_secret npm run smoke:webhook
```

Opsiyonel: `WEBHOOK_SMOKE_USER_ID=test-user-123`

### Webhook Event Tipleri

| type    | Açıklama                          |
|---------|-----------------------------------|
| renewal | Abonelik yenilendi                |
| cancel  | İptal edildi (süre sonuna kadar aktif) |
| grace   | Ödeme başarısız, grace period     |
| expire  | Süre doldu                        |
| refund  | İade yapıldı                      |

### Webhook Endpoint

```
POST /v1/iap/webhook
Authorization: Bearer <IAP_WEBHOOK_SECRET>
Content-Type: application/json

{
  "eventId": "unique-event-id",
  "userId": "firebase-uid",
  "transactionId": "store-transaction-id",
  "productId": "antislot_premium_monthly",
  "source": "subscription_monthly",
  "platform": "ios",
  "type": "renewal",
  "expiresAt": 1710124800000
}
```

## 4. İdempotency ve Duplicate Event Güvenliği

### DB Seviyesinde Garanti

- **Postgres (DATABASE_URL)**: `premium_processed_events` tablosunda `event_key` UNIQUE constraint ile `INSERT ... ON CONFLICT DO NOTHING`
- **SQLite (PREMIUM_DB_PATH)**: `premium_processed_events` tablosunda `event_key` PRIMARY KEY ile `INSERT OR IGNORE`

### Anahtarlar

- Event: `e:{userId}:{eventId}`
- Transaction: `t:{userId}:{transactionId}`

Aynı event veya transaction tekrar işlendiğinde DB constraint nedeniyle insert başarısız olur; mevcut state dönülür (idempotent davranış).

### Production Gereksinimleri

- **DATABASE_URL** (Postgres) VEYA **PREMIUM_DB_PATH** (SQLite) zorunludur
- `better-sqlite3` paketi PREMIUM_DB_PATH kullanıldığında gerekir
