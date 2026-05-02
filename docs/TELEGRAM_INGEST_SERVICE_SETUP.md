# Telegram Ingest Service Setup

Bu belge, `backend` API + Telegram ingest worker'ı kalıcı servis olarak ayağa kaldırmak için iki seçenek verir:

- `pm2` (hızlı kurulum)
- `systemd` (Linux production standard)

## 1) Önkoşullar

1. `backend` dizininde bağımlılıkları kurun:
   - `npm ci`
2. Build alın:
   - `npm run build`
3. Env dosyanızı hazırlayın (`backend/.env` veya `/etc/antislot/backend.env`) ve en az şu alanları doldurun:
   - `TELEGRAM_INGEST_ENABLED=true`
   - `TELEGRAM_INGEST_TOKEN=<güçlü-rastgele-secret>`
   - `TELEGRAM_BOT_TOKEN=<telegram-bot-token>`
   - `TELEGRAM_ALLOWED_CHAT_IDS=<ops-chat-id1,ops-chat-id2>`
   - `TELEGRAM_INGEST_BASE_URL=http://127.0.0.1:3000`
   - `NODE_ENV=production`

Not:
- Worker sürekli mod için `TELEGRAM_WORKER_CONTINUOUS=true` ister. (systemd dosyasında sabitlenmiştir.)
- `TELEGRAM_DRY_RUN=false` olmalı.

## 2) PM2 ile

`backend/ecosystem.config.cjs` dosyası hem API hem worker için hazırdır.
Bu dosya `backend/.env` değerlerini otomatik okur (`env_file`).

Local hızlı deneme:

```bash
cd backend
npm run build
pm2 start ecosystem.config.cjs
```

Not:
- Bu komut `NODE_ENV=development` ile açar.
- `TELEGRAM_BOT_TOKEN` veya `TELEGRAM_INGEST_TOKEN` eksikse worker crash olmaz; bekleme modunda kalır.
- Production için mutlaka `--env production` + tam secret seti kullanın.

Komutlar:

```bash
cd backend
npm ci
npm run build
pm2 start ecosystem.config.cjs --env production
pm2 status
pm2 logs antislot-telegram-worker
pm2 save
pm2 startup
```

Güncelleme sonrası yeniden yükleme:

```bash
cd backend
npm run build
pm2 reload ecosystem.config.cjs --update-env
```

## 3) systemd ile

Repodaki unit template dosyaları:

- `backend/ops/systemd/antislot-backend-api.service`
- `backend/ops/systemd/antislot-telegram-worker.service`

Kurulum:

```bash
sudo mkdir -p /opt/antislot
sudo cp -r backend /opt/antislot/backend
cd /opt/antislot/backend
npm ci
npm run build
```

Env dosyası:

```bash
sudo mkdir -p /etc/antislot
sudo cp /opt/antislot/backend/.env /etc/antislot/backend.env
sudo chmod 600 /etc/antislot/backend.env
```

Unit dosyaları:

```bash
sudo cp /opt/antislot/backend/ops/systemd/antislot-backend-api.service /etc/systemd/system/
sudo cp /opt/antislot/backend/ops/systemd/antislot-telegram-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now antislot-backend-api
sudo systemctl enable --now antislot-telegram-worker
```

Kontrol:

```bash
sudo systemctl status antislot-backend-api
sudo systemctl status antislot-telegram-worker
sudo journalctl -u antislot-telegram-worker -f
```

## 4) Sağlık kontrolü

API:

```bash
curl -i http://127.0.0.1:3000/v1/health
```

Ingest endpoint (local test):

```bash
curl -X POST http://127.0.0.1:3000/v1/internal/telegram/domains \
  -H "Authorization: Bearer $TELEGRAM_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domains":["example-bet-test.com"],"source":"manual-check","dryRun":true}'
```
