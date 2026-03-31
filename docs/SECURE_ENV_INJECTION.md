# Secure Env Injection (CI/CD)

This runbook defines how to inject required environment variables without relying on local `.env*` files in production.

Source of truth:
- `docs/RELEASE_SECRET_MATRIX.md`
- `.env.schema.json`

## 1. Mobile (Expo / EAS)

Set required public runtime vars in EAS environment:

```bash
npx eas-cli env:create --environment production --name EXPO_PUBLIC_API_URL --value "https://api.antislot.app" --visibility plaintext
npx eas-cli env:create --environment production --name EXPO_PUBLIC_SENTRY_DSN --value "https://<key>@<org>.ingest.sentry.io/<project>" --visibility sensitive
```

Keep CI strict preflight inputs in GitHub Actions secrets:
- `EXPO_TOKEN`
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SENTRY_DSN`

## 2. Server/Backend Runtime Secrets

Inject at deploy/runtime from a secret manager (not from repo files):
- `SENTRY_DSN`
- `ALERT_WEBHOOK_URL`
- `ALERT_WEBHOOK_BEARER_TOKEN`
- `DATABASE_URL`
- `IAP_WEBHOOK_SECRET`
- plus auth/IAP one-of groups from release matrix

### Kubernetes example

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: antislot-runtime
type: Opaque
stringData:
  SENTRY_DSN: "https://..."
  ALERT_WEBHOOK_BEARER_TOKEN: "..."
  IAP_WEBHOOK_SECRET: "..."
  DATABASE_URL: "postgresql://..."
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: antislot-server
spec:
  template:
    spec:
      containers:
        - name: server
          envFrom:
            - secretRef:
                name: antislot-runtime
```

### Cloud Run example

```bash
gcloud run deploy antislot-server \
  --image gcr.io/<project>/antislot-server:<tag> \
  --set-env-vars NODE_ENV=production,CORS_ALLOWLIST=https://app.antislot.app \
  --set-secrets SENTRY_DSN=SENTRY_DSN:latest,ALERT_WEBHOOK_BEARER_TOKEN=ALERT_WEBHOOK_BEARER_TOKEN:latest,DATABASE_URL=DATABASE_URL:latest,IAP_WEBHOOK_SECRET=IAP_WEBHOOK_SECRET:latest
```

## 3. GitHub Actions (Strict Gate)

Before build/deploy, run strict preflight with injected secrets:

```bash
npm run preflight:release:strict
```

The strict gate:
- ignores all `*.local` env files
- fails if required vars are missing
- fails on placeholder values

## 4. Operational Rules

- Never store production secrets in `EXPO_PUBLIC_*`.
- Never commit `.env.production*` files with real values.
- Rotate any secret immediately if it was ever exposed.
