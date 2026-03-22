# Operasyonel Hazırlık — AntiSlot

Bu belge production operasyonları için alerting, on-call prosedürü, rollback planı ve release/post-release checklist’lerini tanımlar.

---

## 1. Alerting (Uyarılar)

### 1.1 Özet Matrisi

| Metrik | Eşik (Öneri) | Öncelik | Aksiyon |
|--------|--------------|---------|---------|
| Uptime | < 99% (1 saat) | P1 | On-call tetikle |
| 5xx hata oranı | > 1% (5 dk) veya > 10 (5 dk) | P1 | On-call tetikle |
| Latency (p95) | > 3 saniye (chat), > 1 s (diğer) | P2 | İnceleme |
| Webhook fail rate | > 5% (15 dk) | P1 | On-call tetikle |
| Purchase fail rate | > 10% (30 dk) | P1 | On-call tetikle |

### 1.2 Uptime Monitoring

**Endpoint:** `GET /v1/health` (veya `GET /health`)

- **Uptime robot / UptimeRobot / Better Uptime / Pingdom:**  
  - URL: `https://api.antislot.app/health`  
  - Aralık: 1 dakika  
  - Timeout: 10 saniye  
  - Beklenen: HTTP 200, `{"ok": true, "status": "up"}`  
  - 3 ardışık başarısızlık → alert

**Backend (core) uptime (opsiyonel):**  
- URL: `https://backend.antislot.internal/v1/health` (internal LB)

### 1.3 5xx Error Rate

**Log / APM kaynağı:**  
- CloudWatch, Datadog, Grafana Loki veya nginx/LB access log

**Metrik:**
- `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
- veya: 5 dakikada 5xx sayısı > 10

**Alert koşulu (örnek Prometheus):**
```yaml
- alert: High5xxRate
  expr: sum(rate(http_requests_total{job="antislot-api", status=~"5.."}[5m])) / sum(rate(http_requests_total{job="antislot-api"}[5m])) > 0.01
  for: 2m
  labels: { severity: critical }
```

### 1.4 Latency (p95 / p99)

**Endpoint grupları:**
- `/v1/chat` — hedef p95 < 5 s (AI upstream’e bağlı)
- `/v1/premium/*`, `/v1/iap/*` — hedef p95 < 1 s
- `/v1/iap/webhook` — hedef p95 < 500 ms

**APM / Traces:**  
- Sentry Performance, Datadog APM veya benzeri; trace sampling ile `server` request’leri izlenir.

### 1.5 Webhook Fail Rate

**Tanım:** `POST /v1/iap/webhook` — HTTP 4xx/5xx veya business logic hatası

**Metrik:**
- Webhook istekleri: `POST /v1/iap/webhook`
- Başarı: HTTP 200
- Hata: HTTP 400, 401, 500 vb.

**Alert koşulu:**
- Son 15 dakikada fail rate > 5%
- veya ardışık 5 webhook failure

**Log sorgu örneği (CloudWatch/Loki):**
```
method="POST" path="/v1/iap/webhook" status>=400
```

### 1.6 Purchase Fail Rate

**Tanım:**  
- `/v1/premium/activate` — `PREMIUM_VALIDATION_FAILED` veya 5xx
- `/v1/iap/validate` — aynı
- `/v1/premium/restore` — 5xx

**Metrik:**
- Toplam purchase-related istek sayısı
- Başarısız istek sayısı (4xx PREMIUM_VALIDATION_FAILED veya 5xx)

**Alert koşulu:**
- Son 30 dakikada fail rate > 10%
- veya 5 dakikada 5+ ardışık başarısızlık

### 1.7 Alert Kanalı

- **P1:** Slack #alerts + PagerDuty / Opsgenie (on-call tetikle)
- **P2:** Slack #alerts only
- E-posta: opsiyonel, P1 için

---

## 2. On-Call Prosedürü

### 2.1 Kapsam

- Server (AI/Premium API)
- Backend (blocklist/patterns) — opsiyonel
- Mobil uygulama: Sentry crash spike (ayrı process)

### 2.2 On-Call Rotasyonu

- Haftalık veya iki haftalık rotasyon
- En az 1 primary, 1 secondary (backup)
- Araç: PagerDuty, Opsgenie veya benzeri

### 2.3 Tetikleme Senaryoları

| Senaryo | Aksiyon |
|---------|---------|
| Uptime down | 1. Health endpoint’i manuel kontrol et; 2. Loglara bak; 3. Rollback değerlendir |
| 5xx spike | 1. Son deploy’ları kontrol et; 2. DB / upstream (OpenAI, IAP) durumunu kontrol et; 3. Rollback gerekirse `ROLLBACK_PLAN` uygula |
| Webhook fail rate | 1. Webhook payload / rate limit loglarına bak; 2. RevenueCat / App Store Connect / Play Console webhook durumunu kontrol et; 3. Gerekirse IAP sağlayıcı ile iletişim |
| Purchase fail rate | 1. Receipt validation, IAP shared secret / service account; 2. Apple/Google servis durumu; 3. Gerekirse geçici bilgilendirme (status page) |

### 2.4 İlk Tepki Checklist (Her Alert)

1. [ ] Alert’i acknowledge et
2. [ ] Slack / PagerDuty’de “Investigating” işaretle
3. [ ] Health endpoint’i kontrol et: `curl https://api.antislot.app/health`
4. [ ] Son 15 dakika loglarına bak (5xx, webhook, premium)
5. [ ] Son deploy zamanı ve değişiklikleri kontrol et
6. [ ] Karar: rollback / hotfix / beklem

### 2.5 Eskalasyon

- **15 dk** içinde çözüm yok → secondary on-call’ı uyar
- **30 dk** kritik (örn. tam outage) → tech lead / product owner bilgilendir
- **1 saat** — müşteri etkisi yüksekse: status page güncelle, kullanıcı bilgilendirme hazırla

---

## 3. Rollback Planı

### 3.1 Mobil Uygulama (EAS / Expo)

**OTA (JavaScript bundle) rollback:**
- EAS Update ile önceki channel’a geri dön
- `eas update:rollback` veya manuel olarak önceki update’i aktif channel’a promote et
- Süre: ~5–10 dakika

**Native (full app) rollback:**
- Store’da önceki sürüm hâlâ mevcut ise: kullanıcı manuel güncelleme yapabilir
- Yeni native sürüm yayınlandıysa: store rollback mümkün değil; hotfix release gerekir
- **Önlem:** Store’a göndermeden önce staging/internal track’te yeterli test

### 3.2 Server (API)

**Docker / K8s / Cloud Run:**
- Önceki image tag’ine geri dön
- Örnek (K8s): `kubectl set image deployment/antislot-server antislot-server=registry/antislot-server:previous-tag`
- Örnek (Docker Compose): `docker-compose -f docker-compose.production.yml up -d --force-recreate` (önceki image ile)
- Süre: ~2–5 dakika

**Database migration rollback:**
- Geri alınabilir migration’lar için down script hazır olmalı
- `docs/DATABASE_BACKUP_RESTORE.md` referans alınır
- Migration rollback production’da dikkatli yapılır; veri kaybı riski varsa DBA/lead ile koordine edilir

### 3.3 Rollback Karar Ağacı

```
Alert tetiklendi
    → Son 24 saat içinde deploy var mı?
        Evet → Rollback adayı; hata deploy ile ilişkili mi kontrol et
        Hayır → Infrastructure / upstream / external service araştır
    → Rollback yapılacak mı?
        Evet → Önceki stabil sürüme dön; post-rollback verification
        Hayır → Hotfix veya beklem; kullanıcı etkisini azalt
```

### 3.4 Rollback Sonrası

1. [ ] Health / smoke test: `curl https://api.antislot.app/health`
2. [ ] Webhook smoke: `npm run smoke:webhook` (server dizininde)
- [ ] Admin proxy smoke: `npm run smoke:admin-proxy` (`ADMIN_PROXY_SMOKE_*` env ile)
3. [ ] Auth/chat smoke: `npm run smoke:auth` (varsa)
4. [ ] Incident post-mortem planla (24–48 saat içinde)

---

## 4. Release Checklist

Detaylı teknik checklist için: `RELEASE_TECH_CHECKLIST.md`.

### 4.1 Release Öncesi (T-1 gün)

- [ ] `RELEASE_TECH_CHECKLIST.md` — Go/No-go maddeleri tamamlandı
- [ ] Version bump: `npm run bump-version [--patch|--minor|--major]`
- [ ] Changelog / release notes hazır
- [ ] EAS secrets: `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_TOKEN` güncel
- [ ] Feature flag’ler release için doğru (örn. `EXPO_PUBLIC_ENABLE_IAP=true` production’da)

### 4.2 Release Günü (CI / Manuel)

- [ ] GitHub Release oluştur (tag `v*`) veya `workflow_dispatch` tetikle
- [ ] EAS build tamamlanana kadar takip et
- [ ] Artifact URL’leri ve checksum’ları kaydet
- [ ] Server deploy (varsa): image tag, migration, health check

### 4.3 Store Submit (Opsiyonel)

- [ ] Google Play: Internal/Closed track → Production
- [ ] App Store Connect: TestFlight → Review → Release

---

## 5. Post-Release Verification Checklist

Release’ten hemen sonra (0–30 dakika) aşağıdaki adımlar uygulanır.

### 5.1 API / Server

- [ ] Health: `curl https://api.antislot.app/health` → `{"ok": true}`
- [ ] Auth smoke: `npm run smoke:auth` (server dizininde, `AUTH_SMOKE_*` env ile)
- [ ] Webhook smoke: `npm run smoke:webhook` (`IAP_SMOKE_BASE_URL`, `IAP_WEBHOOK_SECRET` ile)
- [ ] IAP validate smoke: `npm run smoke:iap` (varsa)

### 5.2 Mobil Uygulama

- [ ] Production build yüklendi (EAS dashboard)
- [ ] Sentry: yeni release görünüyor (`com.antislot.app@<version>`)
- [ ] Kritik ekranlar açılıyor: ana sayfa, SOS, Premium, Blocker
- [ ] OTA update (varsa): cihazda güncelleme alındı mı kontrol et

### 5.3 Monitoring

- [ ] Alerting kanalları aktif (Slack, PagerDuty)
- [ ] Uptime check yeşil
- [ ] 5xx oranı normal aralıkta (< %0.1)
- [ ] Sentry: yeni crash/spike yok

### 5.4 Kullanıcı Deneyimi (Manuel)

- [ ] Gerçek cihazda (en az 1 Android, 1 iOS) kritik akışlar:
  - Onboarding / ana sayfa
  - SOS ekranı (acil hatlar, nefes)
  - Premium ekranı (planlar, restore butonu)
  - Blocker (koruma switch, sync)
- [ ] Ağ kesintisi: SOS offline çalışıyor mu? (`QA_QUALITY_GATE.md` network-loss)

### 5.5 İmza

- [ ] Release sorumlusu: _________________ Tarih: ______
- [ ] Post-release verification tamamlandı: Evet / Hayır

---

## 6. İlgili Belgeler

| Belge | İçerik |
|-------|--------|
| `RELEASE_TECH_CHECKLIST.md` | Versiyonlama, EAS, CI, Sentry, permissions |
| `docs/PRODUCTION_INFRASTRUCTURE.md` | Ortam, secrets, healthcheck, autoscaling |
| `docs/DATABASE_BACKUP_RESTORE.md` | DB backup, restore, migration |
| `docs/QA_QUALITY_GATE.md` | E2E, regression, cold start, network-loss |
| `CRISIS_PROTOCOL.md` | Ürün kriz protokolü (112, YEDAM, 183) |
