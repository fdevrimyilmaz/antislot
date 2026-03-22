# API Contract v1 — FROZEN

**Version:** 1.0.0  
**Status:** FROZEN  
**Effective:** 2025-02-08

---

## 1. Contract Freeze

`/v1` API sözleşmesi bu dokümanla birlikte **donmuştur** (freeze). Yeni endpoint veya request/response alanı eklenmez; mevcut davranış değiştirilmez. Kırıcı değişiklikler yalnızca yeni major versiyon (`/v2`) ile yapılır.

---

## 2. Base URL & Versioning

| Alan | Değer |
|------|-------|
| Base URL | `EXPO_PUBLIC_API_URL` (mobil uygulama) |
| Prefix | `/v1` |
| Canonical routes | `/v1/*` |

---

## 3. Authentication

| Header | Açıklama |
|--------|----------|
| `Authorization` | User routes: `Bearer <firebase_id_token>` |
| `Authorization` | Internal server-to-server routes: `Bearer <API_AUTH_TOKEN>` (IP allowlist restricted) |
| `X-User-Id` | User routes: optional hint; server enforces JWT `uid` and rejects mismatch |
| `Content-Type` | `application/json` (POST/PUT/PATCH) |

### 3.1 Auth boundary rules

- `/v1/premium/status`, `/v1/premium/sync`, `/v1/premium/activate`, `/v1/premium/restore`, `/v1/iap/validate` accept only Firebase user token.
- `API_AUTH_TOKEN` is for server-to-server calls only.
- Requests authenticated by `API_AUTH_TOKEN` are allowed only from `INTERNAL_API_IP_ALLOWLIST` source IPs.
- Therapy admin routes (`/v1/therapy/callback/queue`, `/v1/therapy/callback/:requestId/status`) support either:
  - `API_AUTH_TOKEN` + `INTERNAL_API_IP_ALLOWLIST`, or
  - reverse-proxy auth headers (`ADMIN_PROXY_*`) when enabled.
- Server never trusts `X-User-Id` by itself for premium user flows; effective user id is derived from verified JWT `uid`.

---

## 4. Error Model (Tüm Hata Yanıtları)

**Tüm endpoint’lerde** hata yanıtları aşağıdaki formatta döner. İstisnasız %100 tutarlıdır.

```json
{
  "ok": false,
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "requestId": "trace-id"
  }
}
```

### 4.1 Error Codes

| Code | HTTP | Açıklama |
|------|------|----------|
| `BAD_REQUEST` | 400 | Geçersiz istek (eksik alan, format hatası) |
| `UNAUTHORIZED` | 401 | Kimlik doğrulama gerekli veya geçersiz token |
| `NOT_FOUND` | 404 | Kaynak veya rota bulunamadı |
| `RATE_LIMITED` | 429 | İstek limiti aşıldı |
| `PREMIUM_VALIDATION_FAILED` | 400 | Kod veya receipt doğrulaması başarısız |
| `UPSTREAM_ERROR` | 502 | Upstream servis (AI, IAP vb.) hatası |
| `SERVICE_UNAVAILABLE` | 503 | Servis geçici olarak kullanılamıyor |
| `INTERNAL_ERROR` | 500 | Beklenmeyen sunucu hatası |

### 4.2 Response Headers (Tüm Yanıtlar)

| Header | Açıklama |
|--------|----------|
| `X-Request-Id` | İstek trace ID (dönüşüm ve loglama için) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

---

## 5. Endpoints

### 5.1 System

#### `GET /v1/health`

Public; auth gerekmez.

**Response 200:**
```json
{
  "ok": true,
  "status": "up",
  "ts": 1707340800000,
  "env": "production"
}
```

---

### 5.2 Blocklist & Patterns (Proxied)

#### `GET /v1/blocklist`

Public; auth gerekmez. Blocklist domain listesi ve imza.

**Response 200:**
```json
{
  "version": 1,
  "updatedAt": 1707340800000,
  "domains": ["example.com", "..."],
  "signature": "sha256=..."
}
```

#### `GET /v1/patterns`

Public; auth gerekmez. Pattern listesi ve imza.

**Response 200:**
```json
{
  "version": 1,
  "updatedAt": 1707340800000,
  "patterns": [
    { "pattern": "...", "type": "exact", "weight": 1 }
  ],
  "signature": "sha256=..."
}
```

---

### 5.3 Chat (Auth Required)

#### `POST /v1/chat`

**Headers:** `Authorization`, `X-User-Id`

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response 200:**
```json
{
  "ok": true,
  "reply": "AI yanıt metni"
}
```

---

### 5.4 Premium (Auth Required)

Auth type: Firebase user token only (`Authorization: Bearer <firebase_id_token>`). `API_AUTH_TOKEN` is rejected.

#### `GET /v1/premium/status`

**Response 200:**
```json
{
  "ok": true,
  "state": {
    "isActive": true,
    "source": "subscription_monthly",
    "startedAt": 1707340800000,
    "expiresAt": 1710124800000,
    "trialEndsAt": null,
    "features": ["blocker", "live_support", "..."],
    "lastSync": 1707340800000
  }
}
```

#### `POST /v1/premium/sync`

**Request:**
```json
{
  "localState": {
    "isActive": true,
    "source": "subscription_monthly",
    "startedAt": 1707340800000,
    "expiresAt": 1710124800000,
    "trialEndsAt": null,
    "features": ["blocker"],
    "lastSync": 1707340800000
  }
}
```

**Response 200:** `{ "ok": true, "state": { ... } }`

#### `POST /v1/premium/activate`

**Request:**
```json
{
  "code": "ACTIVATION_CODE",
  "receipt": "BASE64_RECEIPT",
  "platform": "ios"
}
```

`code` veya `receipt` biri zorunlu. `platform`: `"ios"` | `"android"`.

**Response 200:** `{ "ok": true, "state": { ... } }`

#### `POST /v1/premium/restore`

**Request:** `{}` (body boş veya null)

**Response 200:** `{ "ok": true, "state": { ... } }`

---

### 5.5 IAP (Auth Required)

Auth type: Firebase user token only (`Authorization: Bearer <firebase_id_token>`) for `/v1/iap/validate`.

#### `POST /v1/iap/validate`

**Request:**
```json
{
  "receipt": "BASE64_RECEIPT",
  "platform": "ios"
}
```

**Response 200:**
```json
{
  "ok": true,
  "result": {
    "ok": true,
    "active": true,
    "source": "subscription_monthly",
    "productId": "...",
    "transactionId": "...",
    "eventId": "...",
    "expiresAt": 1710124800000
  }
}
```

---

### 5.6 Webhooks (Internal)

#### `POST /v1/iap/webhook`

**Headers:** `Authorization: Bearer <IAP_WEBHOOK_SECRET>`

**Request:**
```json
{
  "eventId": "...",
  "userId": "...",
  "transactionId": "...",
  "productId": "...",
  "source": "subscription_monthly",
  "platform": "ios",
  "type": "renewal",
  "expiresAt": 1710124800000
}
```

`type`: `renewal` | `cancel` | `refund` | `grace` | `expire`

**Response 200:** `{ "ok": true, "state": { ... } }`

---

## 6. Deprecation Policy

1. **Bildirim:** Yeni major versiyon (`/v2`) veya endpoint kaldırma en az **6 ay** önce duyurulur.
2. **Süre:** Deprecated endpoint’ler en az **12 ay** boyunca desteklenir.
3. **Header:** Deprecated endpoint’lerde `X-API-Deprecated: true` ve `X-API-Sunset: <ISO tarih>` header’ları eklenir.
4. **Log:** Deprecated endpoint kullanımı loglanır.

---

## 7. Backward Compatibility Kuralları

1. **Yeni alan ekleme:** Response’a yeni opsiyonel alan eklenebilir; client’lar ignore edebilir.
2. **Zorunlu alan kaldırma:** Yapılmaz.
3. **Mevcut alan tipi değişikliği:** Yapılmaz (string → number vb.).
4. **Yeni endpoint:** Yalnızca `/v1` altında yeni path ile eklenebilir; mevcut path’ler değişmez.
5. **HTTP method değişikliği:** Yapılmaz.
6. **Error format:** Değişmez; `ok`, `error.code`, `error.message`, `error.requestId` her zaman aynı yapıda kalır.

---

## 8. Changelog

| Tarih | Sürüm | Değişiklik |
|-------|-------|------------|
| 2025-02-08 | 1.0.0 | İlk freeze; tam dokümantasyon, error modeli, deprecation policy, backward compatibility kuralları |
