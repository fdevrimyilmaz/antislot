# Antislot Public Web Pages (Store Compliance)

These static pages must be publicly hosted for App Store and Google Play submissions.

## Required URLs

- Privacy policy URL (required)
- Terms URL (recommended)
- Support URL or support email

## Suggested mapping

| File         | Public URL                     |
|--------------|--------------------------------|
| index.html   | https://antislot-legal.vercel.app/ |
| privacy.html | https://antislot-legal.vercel.app/privacy   |
| terms.html   | https://antislot-legal.vercel.app/terms     |
| support.html | https://antislot-legal.vercel.app/support   |
| admin.html   | internal only (do not index)   |

Path aliases also exist for static hosting compatibility:
- `privacy/index.html` -> `privacy.html`
- `terms/index.html` -> `terms.html`
- `support/index.html` -> `support.html`

## Hosting options

- GitHub Pages
- Vercel / Netlify
- Any static hosting behind your custom domain

## Local preview

```bash
cd website
npx serve -p 3000
```

## Sync rule

When policy text changes in app screens, update these HTML pages in the same PR.

## Internal admin panel

`admin.html` is for therapy callback queue operations and should not be public.

- Deploy behind VPN/SSO or a reverse proxy auth layer.
- Preferred: enable backend proxy auth (`ADMIN_PROXY_AUTH_REQUIRED=true`) and inject:
  - `ADMIN_PROXY_SECRET_HEADER` (shared secret)
  - `ADMIN_PROXY_USER_HEADER` (admin identity)
  - Optional `ADMIN_PROXY_GROUPS_HEADER` + `ADMIN_PROXY_ALLOWED_GROUPS`
- Fallback mode: keep `API_AUTH_TOKEN` secret and enforce `INTERNAL_API_IP_ALLOWLIST`.
- Full setup guide: `docs/ADMIN_PROXY_SETUP.md`

### Nginx example (SSO gateway already validated user)

```nginx
location /internal-admin/ {
  auth_request /oauth2/auth;
  error_page 401 = /oauth2/sign_in;

  proxy_set_header X-Admin-Proxy-Secret "<shared-secret>";
  proxy_set_header X-Auth-Request-Email $upstream_http_x_auth_request_email;
  proxy_set_header X-Auth-Request-Groups $upstream_http_x_auth_request_groups;

  proxy_pass http://api.antislot.app/;
}
```
