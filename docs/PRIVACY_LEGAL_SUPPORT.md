# Gizlilik, Yasal ve Destek Süreçleri

Bu belge, AntiSlot uygulamasının KVKK/GDPR uyumlu gizlilik politikası, veri saklama (retention), silme talebi ve destek süreçlerini teknik ve operasyonel seviyede tanımlar. Gizlilik Politikası ve Kullanım Şartları ekranları bu belgedeki kurallarla tutarlı olmalıdır.

## 1. Destek Süreci (Support SLA)

| Adım | Süre | Açıklama |
|------|------|----------|
| Talebin alınması | - | support@antislot.app adresine e-posta |
| İlk dönüş | **30 gün** (SLA) | Destek ekibi talebi alır ve ilk yanıt verir |
| Tamamlama | Talep türüne göre | Silme talepleri: işlem tamamlanana kadar takip edilir |

**Talep türleri:**
- KVKK/GDPR erişim talebi
- Silme (right to be forgotten) talebi
- Düzeltme talebi
- İtiraz talebi
- Genel destek

**Konu satırı önerisi:** `KVKK-GDPR Talebi` veya `Silme Talebi`

## 2. Veri Saklama (Retention)

### 2.1 Cihaz Verileri
- **Konum:** Yalnızca cihazda (SecureStore / AsyncStorage)
- **Süre:** Kullanıcı silene veya uygulama kaldırılana kadar
- **Cloud:** Gönderilmez

### 2.2 Sunucu Tarafı

| Veri | Saklama Süresi | Notlar |
|------|----------------|--------|
| `premium_processed_events` | 45 gün | Otomatik `compactProcessedEvents()` ile silinir |
| `premium_entitlements` | Kullanıcı silme talebi olana kadar | Manuel silme destek süreci üzerinden |
| Operasyon logları | 30–90 gün | PRODUCTION_INFRASTRUCTURE.md'de tanımlı; userId loglarda maskelenir |
| AI sohbet içeriği | Kalıcı depolanmaz | Her istek stream edilir; OpenAI'e iletilir ancak bizde saklanmaz |

### 2.3 Telemetri (İstemci)
- **Varsayılan:** Kapalı (opt-in)
- **Retention:** `privacyStore.retentionDays` (7 / 30 / 90 gün)
- **Enforcement:** `analytics.ts` → `pruneByRetention()`; `canSendTelemetry()` ile kontrol

## 3. Silme Talebi Akışı

1. Kullanıcı uygulama içinden ilgili kaydı temizler (örn. AI sohbet)
2. Tüm cihaz verisini kaldırmak için uygulamayı kaldırır
3. Hesaplı özelliklerde (Premium, Firebase auth) silme için support@antislot.app'e e-posta
4. Destek 30 gün içinde dönüş yapar ve süreci tamamlar

## 4. Telemetri Opt-In/Out ve Veri Minimizasyonu

### 4.1 Uygulama Seviyesi (Enforce)
- `privacyStore`: `telemetryEnabled`, `shareDiagnostics`, `crashReporting`, `dataMinimization`, `retentionDays`
- `services/privacy.ts`: `canSendTelemetry()`, `canSendCrashReports()` — tüm telemetri bu kontrollerden geçer
- `services/analytics.ts`: `trackEvent()` → `canSendTelemetry()` kontrolü; `sanitizePayloadForTelemetry()` ile contactId/apiHost redakte
- `services/monitoring.ts`: Sentry `beforeSend` → `canSendCrashReports()`; `reportStorageError` → `canSendTelemetry()`
- `components/ErrorBoundary.tsx`: `canSendCrashReports()` kontrolü ile Sentry gönderimi

### 4.2 Sunucu Log Seviyesi (Enforce)
- `server/src/index.ts`: `maskUserId()` ile userId loglarda maskelenir (PII redaction)
- Log retention: 30–90 gün (ortam yapılandırmasına göre)

### 4.3 Veritabanı Seviyesi
- `premium_processed_events`: 45 gün TTL, `compactProcessedEvents()` ile otomatik temizlik
- `premium_entitlements`: Kullanıcı silme talebi sonrası manuel silme

## 5. Politikaların Tutarlılığı

| Belge | İçerik |
|-------|--------|
| **Gizlilik Politikası** (`app/privacy.tsx`) | Veri toplama, retention, silme akışı, destek süreci, üçüncü taraflar, hukuki dayanak |
| **Kullanım Şartları** (`app/terms.tsx`) | Temel koşullar, yaş politikası, kriz uyarısı, **retention/destek süreci** (Gizlilik'e referans) |
| **Bu belge** | Teknik/operasyonel referans; politikalar arası tutarlılık |

## 6. Güncellemeler

Politika veya süreç değişikliklerinde:
1. `app/privacy.tsx` ve `app/terms.tsx` güncellenmeli
2. `lastUpdated` tarihi güncellenmeli
3. Bu belge (`docs/PRIVACY_LEGAL_SUPPORT.md`) senkron tutulmalı
