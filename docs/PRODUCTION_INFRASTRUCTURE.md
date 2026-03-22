# Production Infrastructure – AntiSlot

Bu belge, **server** (AI/Premium API) ve **backend** (blocklist/patterns/core) için production ortamlarının kesinleştirilmiş konfigürasyonunu tanımlar.

## 1. Ortam Ayrımı

### 1.1 Environment dosyaları

| Servis | Development | Production |
|--------|-------------|------------|
| server | `server/.env` | `server/.env.production` veya secret manager |
| backend | `backend/.env` | `backend/.env.production` veya secret manager |

**Kural:** Production ortamında `.env` dosyaları git'e commit edilmez. Secret manager veya CI/CD secrets kullanılır.

### 1.2 Secret Yönetimi

| Ortam | Öneri |
|-------|-------|
| **GCP** | Secret Manager; Cloud Run / GKE ile entegrasyon |
| **AWS** | Secrets Manager veya Parameter Store (SecureString) |
| **Azure** | Key Vault |
| **Kubernetes** | External Secrets Operator veya Sealed Secrets |
| **Docker Swarm** | Docker secrets |

**Secret'lar (örnek):**
- `API_AUTH_TOKEN`, `ADMIN_PROXY_SHARED_SECRET`, `HMAC_SECRET`, `IAP_WEBHOOK_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON_B64`
- `OPENAI_API_KEY` veya `GEMINI_API_KEY`, `IAP_IOS_SHARED_SECRET`, `IAP_GOOGLE_SERVICE_ACCOUNT_JSON_B64`
- `DATABASE_URL` (Postgres connection string)

### 1.3 Domain ve TLS

| Bileşen | Önerilen domain | TLS |
|---------|-----------------|-----|
| Public API (server) | `api.antislot.app` | Let's Encrypt / Cloudflare / LB-terminated |
| Backend (internal) | `backend.antislot.internal` veya private IP | mTLS veya internal LB |

**TLS stratejisi:**
- Reverse proxy (nginx, Traefik, Caddy) veya cloud load balancer TLS sonlandırır
- Container'lar HTTP dinler; TLS edge'de yapılır
- HSTS header zaten server ve backend tarafından ekleniyor (`Strict-Transport-Security`)

### 1.4 Healthcheck

**Server (AI/Premium):**
- Endpoint: `GET /health` veya `GET /v1/health`
- Beklenen: `{ "ok": true, "status": "up", "ts": ... }`
- Dockerfile içinde `HEALTHCHECK` tanımlı

**Backend (Core):**
- Endpoint: `GET /v1/health`
- Beklenen: `{ "status": "ok", "timestamp": ... }`
- Dockerfile içinde `HEALTHCHECK` tanımlı

### 1.5 Autoscaling

| Platform | Yöntem | Örnek |
|----------|--------|-------|
| Kubernetes | HPA (CPU/Memory veya custom) | `kubectl autoscale deployment antislot-server --min=2 --max=10 --cpu-percent=70` |
| GCP Cloud Run | Otomatik; min/max instance | `--min-instances=1 --max-instances=10` |
| AWS ECS | Service auto-scaling | Target tracking (CPU %70) |
| Docker Swarm | Replicas | `docker service scale antislot_server=3` |

### 1.6 Log Retention ve PII Redaction

| Hedef | Öneri |
|-------|-------|
| Stdout/stderr | JSON format; `level`, `message`, `requestId`, `ts` |
| Toplama | CloudWatch, Loki, Datadog, ELK |
| Saklama | En az 30 gün; compliance gerekiyorsa 90 gün+ |
| PII redaction | `userId` loglarda `maskUserId()` ile maskelenir (örn. `abc1...xy`) |
| Hassas veri | `authorization`, `receipt`, `code` redact edilmeli |

**Teknik:** `server/src/index.ts` içinde `logInfo`/`logError` kullanılırken `userId` için `maskUserId(userId)` kullanılır. Ayrıntılar için `docs/PRIVACY_LEGAL_SUPPORT.md` bkz.

---

## 2. docker-compose.production.yml

```yaml
version: "3.9"

services:
  backend:
    build: ./backend
    env_file: ./backend/.env.production
    environment:
      NODE_ENV: production
    volumes:
      - backend-data:/var/lib/antislot/data
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "-", "http://localhost:3000/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    deploy:
      replicas: 2
      resources:
        limits: { memory: 512M }

  ai-server:
    build: ./server
    env_file: ./server/.env.production
    environment:
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    deploy:
      replicas: 2
      resources:
        limits: { memory: 512M }

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: antislot
      POSTGRES_USER: antislot
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # From .env.production
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./server/migrations:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U antislot -d antislot"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  backend-data:
  postgres-data:
```

---

## 3. Server Bağımlılıkları

Postgres kullanımı için server paketine `pg` eklenmelidir:

```bash
cd server && npm install pg
```

## 4. Operasyonel Hazırlık

- **Alerting, on-call, rollback, release/post-release checklist:** `docs/OPERATIONAL_READINESS.md`
- Uptime, 5xx, latency, webhook fail rate, purchase fail rate metrikleri ve eşikleri bu dokümanda tanımlıdır.
- **Therapy admin reverse-proxy auth setup:** `docs/ADMIN_PROXY_SETUP.md`

## 5. Özet Checklist

- [ ] Server ve backend için ayrı `.env.production` / secret manager
- [ ] `DATABASE_URL` ile Postgres (premium verisi)
- [ ] `PREMIUM_DATA_FILE` yalnızca fallback (Postgres öncelikli)
- [ ] Domain + TLS (reverse proxy veya LB)
- [ ] Therapy admin routes protected by proxy auth (`ADMIN_PROXY_*`) and SSO
- [ ] Healthcheck endpoint'leri ve Docker HEALTHCHECK
- [ ] Autoscaling (HPA / Cloud Run / ECS)
- [ ] JSON log + log retention (30–90 gün)
- [ ] DB migration + backup/restore planı uygulandı (`docs/DATABASE_BACKUP_RESTORE.md`)

