# IAP Notes

## Live End-to-End (Tamamlandı)

### Apple / Google gerçek ürün doğrulaması
- **Apple:** `verifyReceipt` — production + sandbox URL fallback (status 21007)
- **Google:** Android Publisher API — Subscriptions v2 + In-app products (lifetime)
- Ürünler: `antislot_premium_monthly`, `antislot_premium_yearly`, `antislot_premium_lifetime`
- Platform unknown: sırayla iOS ve Android denenir

### Webhook event testi
- `server/scripts/webhook-smoke.mjs` — renewal, cancel, refund, grace, expire event'lerini test eder
- İdempotency testi: aynı event iki kez gönderilir, duplicate kabul edilir
- Kullanım: `IAP_SMOKE_BASE_URL=... IAP_WEBHOOK_SECRET=... npm run smoke:webhook`

### DB seviyesinde idempotency
- `PREMIUM_DB_PATH` set edilirse SQLite kullanılır (örn. `./data/premium.db`)
- `premium_processed_events` tablosu: `event_key` PRIMARY KEY (UNIQUE)
- `INSERT OR IGNORE` ile atomic duplicate koruması
- `better-sqlite3` kurulu değilse JSON fallback kullanılır

## Current Behavior
- IAP is gated by `EXPO_PUBLIC_ENABLE_IAP` (default: `false`).
- When disabled or store configuration is missing, calls return structured results and never crash the app.
- Purchases return `{ ok, code, message, data }` where `code` is one of:
  - `disabled`
  - `not_ready`
  - `store_unavailable`
  - `error`

## Products
- Monthly: `antislot_premium_monthly`
- Yearly: `antislot_premium_yearly`
- Lifetime: `antislot_premium_lifetime`

## Runtime Fallbacks
- If `initConnection()` fails: `store_unavailable`.
- If product lists are empty: `not_ready` and UI shows “coming soon”.
- If a purchase fails: `error` with a safe message.

## Later Setup (Store Console)
- Configure products in App Store Connect / Play Console.
- Ensure product IDs match the constants in `services/iap.ts`.
- **iOS:** Implement “Restore purchases” flow (required for App Store).
- **Server:** Implement server-side receipt validation before unlocking premium permanently (especially for lifetime / persistent unlocks).

## CHANGELOG
- `services/iap.ts`: centralized IAP service with safe init, structured results, and lifecycle cleanup.
- `services/iap.mock.ts`: aligned mock with structured results.
- `components/premium/PremiumPlanCards.tsx`: disable purchase buttons when IAP is unavailable.
- `app/premium.tsx`: handle structured IAP results and display “coming soon” state.
- `app/diagnostics.tsx`: show IAP status and product count.
- `constants/featureFlags.ts`: add `ENABLE_IAP`.
- `.env.example`: add `EXPO_PUBLIC_ENABLE_IAP`.
- `README.md`: document IAP env flag.
