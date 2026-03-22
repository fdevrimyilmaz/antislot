# Go-Live Dry Run — Staging Rehearsal

Store’a yüklemeden önce staging ortamında **uçtan uca** başarı kanıtı için tam rehearsal checklist.

---

## Akış Özeti

```
install → login → purchase → renewal sim → restore → cancel/refund sim → support/deletion
```

Her adım başarılı olmalı; aksi durumda go-live bloklanır.

---

## 1. Install

| Adım | Beklenen | Kontrol |
|------|----------|---------|
| Staging build (EAS / local) yükle | Uygulama açılır | ☐ |
| Onboarding tamamlanır (VPN, yaş 18+, gizlilik) | Ana sayfa görünür | ☐ |
| `home-screen` testID ile doğrula | Maestro/Detox: `home-screen` visible | ☐ |

**Komut:**
```bash
# Maestro
maestro test e2e/maestro/onboarding-flow.yaml
```

---

## 2. Login

| Adım | Beklenen | Kontrol |
|------|----------|---------|
| Uygulama ilk açılışta anonim Firebase kullanıcı oluşturur | `UserContext` uid set | ☐ |
| Premium/Blocker kullanımı için auth token alınır | `/premium/status` 200 | ☐ |

**Not:** Giriş ekranı yok; anonim auth otomatik. Auth smoke:
```bash
cd server && IAP_SMOKE_BASE_URL=... API_AUTH_TOKEN=... npm run smoke:auth
```

---

## 3. Purchase

| Adım | Beklenen | Kontrol |
|------|----------|---------|
| Premium ekranına git | `premium-screen` görünür | ☐ |
| Sandbox IAP ile aylık/yıllık satın al | Receipt server’a gönderilir, premium aktif | ☐ |
| Alternatif: Erişim kodu ile aktivasyon | `activateCode` → Premium aktif | ☐ |

**Staging notu:** IAP kapalıysa (`ENABLE_IAP=false`) kod aktivasyonu kullan. Kod: `PREMIUM_CODE_ALLOWLIST` env’de tanımlı.

**Maestro:**
```bash
maestro test e2e/maestro/premium-flow.yaml
```

---

## 4. Renewal Simulation

| Adım | Beklenen | Kontrol |
|------|----------|---------|
| Webhook ile `renewal` event gönder | Server 200, state güncellenir | ☐ |
| Kullanıcı sync yapar | Premium süresi uzamış görünür | ☐ |

**Komut:**
```bash
cd server
IAP_SMOKE_BASE_URL=https://staging-api.example.com \
IAP_WEBHOOK_SECRET=your_secret \
WEBHOOK_SMOKE_USER_ID=<firebase_uid> \
node scripts/webhook-smoke.mjs
```

Veya tek event:
```bash
curl -X POST "$IAP_SMOKE_BASE_URL/v1/iap/webhook" \
  -H "Authorization: Bearer $IAP_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt-renewal-1",
    "userId": "<firebase_uid>",
    "transactionId": "tx-renew-1",
    "productId": "antislot_premium_yearly",
    "source": "subscription_yearly",
    "platform": "ios",
    "type": "renewal",
    "expiresAt": '"$(($(date +%s) * 1000 + 365 * 86400 * 1000))"'
  }'
```

---

## 5. Restore

| Adım | Beklenen | Kontrol |
|------|----------|---------|
| Premium ekranı → "Satın Alımları Geri Yükle" | IAP store’dan receipt alınır veya sunucudan entitlement | ☐ |
| IAP receipt varsa: Her biri `activatePremium` ile doğrulanır | Premium aktif | ☐ |
| IAP receipt yoksa: Sunucu `/premium/restore` çağrılır (kod/webhook entitlement) | Sunucudaki state client’a yansır | ☐ |
| Sync tetiklenir | State güncel | ☐ |

**Staging:** Kod ile premium ver → Uygulamayı kapat/aç veya farklı cihaz simüle et → Restore tıkla. Sunucu state’i geri dönmeli.

---

## 6. Cancellation / Refund Simulation

| Adım | Beklenen | Kontrol |
|------|----------|---------|
| Webhook `cancel` | State: canceled, süre sonuna kadar aktif | ☐ |
| Webhook `refund` | State: refunded, premium kapanır | ☐ |
| Webhook `expire` | State: expired, premium kapanır | ☐ |
| Uygulama sync | Premium kapalı görünür | ☐ |

**Webhook smoke (tüm event’ler):**
```bash
cd server
IAP_SMOKE_BASE_URL=... IAP_WEBHOOK_SECRET=... WEBHOOK_SMOKE_USER_ID=... npm run smoke:webhook
```

---

## 7. Support / Deletion Request

| Adım | Beklenen | Kontrol |
|------|----------|---------|
| Ayarlar → Gizlilik ve Veri → Veri Silme Talebi | Mailto: support@antislot.app, konu "Veri Silme Talebi" | ☐ |
| Ayarlar → Destek E-postası | Destek talebi mailto açılır | ☐ |
| Store compliance: Kullanıcı veri silme talep edebilir | Bu akış dokümante ve uygulanmış | ☐ |

---

## 8. Tek Komutla Özet Çalıştırma

```bash
# Server smoke (staging API ve secret gerekli)
cd server
export IAP_SMOKE_BASE_URL=https://staging-api.antislot.app
export IAP_WEBHOOK_SECRET=<staging_secret>
export WEBHOOK_SMOKE_USER_ID=webhook-dry-run-test

npm run smoke:webhook   # renewal, cancel, refund, grace, expire, idempotency
npm run smoke:auth      # auth validation (opsiyonel)
npm run smoke:iap       # IAP validate (opsiyonel, receipt gerekir)
npm run smoke:admin-proxy # therapy admin queue auth (ADMIN_PROXY_SMOKE_* env)
```

---

## 9. Eksiklik Giderilmiş Kontrol Listesi

| # | Madde | Durum |
|---|-------|-------|
| 1 | Restore: IAP receipt yoksa sunucu restore çağrısı | ✅ |
| 2 | Veri Silme Talebi: Ayarlar/Gizlilik’te mailto link | ✅ |
| 3 | Webhook smoke: renewal, cancel, refund, grace, expire | ✅ (mevcut) |
| 4 | Maestro premium-flow: restore btn ve plan kartları | ✅ (mevcut) |
| 5 | QA_QUALITY_GATE.md ile entegrasyon | ✅ |

---

## 10. Go-Live Öncesi Son Kontrol

- [ ] Tüm dry-run adımları staging’de yeşil
- [ ] Store compliance: Privacy URL, Terms URL, Support mailto hazır
- [ ] IAP sandbox hesapları App Store Connect / Play Console’da tanımlı
- [ ] Webhook URL Apple/Google’a kayıtlı (canlı IAP için)
