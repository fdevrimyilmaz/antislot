# Therapy Admin Reverse-Proxy Setup

This guide defines a production-safe setup for therapy admin routes:

- `GET /v1/therapy/callback/queue`
- `PATCH /v1/therapy/callback/:requestId/status`

Target: keep admin routes private behind SSO/reverse-proxy, without exposing `API_AUTH_TOKEN` to browser users.

---

## 1. Server env (required)

Set these on `server` production runtime:

```env
ADMIN_PROXY_AUTH_REQUIRED=true
ADMIN_PROXY_SHARED_SECRET=<long-random-secret>
ADMIN_PROXY_SECRET_HEADER=x-admin-proxy-secret
ADMIN_PROXY_USER_HEADER=x-auth-request-email
ADMIN_PROXY_GROUPS_HEADER=x-auth-request-groups
ADMIN_PROXY_ALLOWED_USERS=ops@antislot.app
# or use groups:
# ADMIN_PROXY_ALLOWED_GROUPS=antislot-admins
```

Notes:

- `ADMIN_PROXY_SHARED_SECRET` must only be known by proxy and server.
- Use either user allowlist, group allowlist, or both.
- Keep `API_AUTH_TOKEN` only as fallback server-to-server auth. Do not expose it to web admins.

---

## 2. Nginx + oauth2-proxy example

Assumption: oauth2-proxy validates user session and injects identity headers.

```nginx
server {
  listen 443 ssl http2;
  server_name admin.antislot.app;

  # Static admin page
  location = /admin {
    root /var/www/antislot-website;
    try_files /admin.html =404;
  }

  # oauth2-proxy auth subrequest
  location = /oauth2/auth {
    proxy_pass http://oauth2-proxy:4180/oauth2/auth;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Original-URI $request_uri;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
  }

  location /api/ {
    auth_request /oauth2/auth;
    error_page 401 = /oauth2/sign_in;

    # Headers forwarded from oauth2-proxy auth response
    auth_request_set $auth_user $upstream_http_x_auth_request_email;
    auth_request_set $auth_groups $upstream_http_x_auth_request_groups;

    # Shared secret expected by server
    proxy_set_header X-Admin-Proxy-Secret "<same-as-ADMIN_PROXY_SHARED_SECRET>";
    proxy_set_header X-Auth-Request-Email $auth_user;
    proxy_set_header X-Auth-Request-Groups $auth_groups;

    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    proxy_pass http://ai-server:3001/;
  }
}
```

Complete example file:

- `docs/examples/nginx-admin-antislot.conf`

Frontend `admin.js` should use base URL like:

`https://admin.antislot.app/api`

---

## 3. Cloudflare Zero Trust mapping (alternative)

If you use Cloudflare Access:

- Protect admin origin path with Access policy.
- Configure Access to send identity headers.
- At your edge proxy, map identity header -> `ADMIN_PROXY_USER_HEADER`.
- Inject `ADMIN_PROXY_SECRET_HEADER` with static shared secret.

Do not rely only on identity header without shared secret.

---

## 4. Verification checklist

1. Without auth/session: `/api/v1/therapy/callback/queue` returns 401.
2. With valid SSO + secret header: queue endpoint returns 200.
3. Non-allowlisted user/group returns 401.
4. Rotating `ADMIN_PROXY_SHARED_SECRET` invalidates old proxy config immediately.
5. Browser never stores `API_AUTH_TOKEN`.

Manual check from trusted host:

```bash
curl -i "https://admin.antislot.app/api/v1/therapy/callback/queue?status=queued" \
  -H "X-Admin-Proxy-Secret: <secret>" \
  -H "X-Auth-Request-Email: ops@antislot.app"
```

Expected: `200` and `{ "ok": true, ... }`

Automated smoke:

```bash
cd server
ADMIN_PROXY_SMOKE_BASE_URL=https://admin.antislot.app/api \
ADMIN_PROXY_SMOKE_SHARED_SECRET=<secret> \
ADMIN_PROXY_SMOKE_USER=ops@antislot.app \
npm run smoke:admin-proxy
```

Optional patch-route validation:

```bash
ADMIN_PROXY_SMOKE_REQUEST_ID=tcb_xxxxx \
ADMIN_PROXY_SMOKE_PATCH_STATUS=contacted \
npm run smoke:admin-proxy
```

---

## 5. Failure modes

- Wrong/missing secret header -> `401 Admin proxy authentication required`.
- Wrong user/group -> `401 Admin proxy authentication required`.
- `ADMIN_PROXY_AUTH_REQUIRED=true` but missing `ADMIN_PROXY_SHARED_SECRET` -> server fails at startup.
