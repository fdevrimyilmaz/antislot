# Apple Root CAs

The Apple StoreKit 2 JWS verifier (`server/src/apple-jws-verifier.ts`) loads
every `.cer` / `.der` file in this directory as a trusted root.

## Required certs

Download both from <https://www.apple.com/certificateauthority/> and drop them
here as `.cer` (DER-encoded):

- **Apple Root CA - G3 Root** — currently used to sign StoreKit 2 leaves.
- **Apple Root CA - G2 Root** — kept for forward compatibility.

```
server/certs/apple/
├── AppleRootCA-G2.cer
└── AppleRootCA-G3.cer
```

## Behavior when missing

- **Production** (`NODE_ENV=production`): the server refuses to boot.
- **Dev / Sandbox**: the verifier logs `not configured` at startup and JWS
  signatures are NOT cryptographically verified. To accept Sandbox receipts in
  this mode you must set `ALLOW_DEV_RECEIPT_BYPASS=true`; otherwise
  `/v1/premium/activate` returns `verifier_unavailable`.

## CI / deploy

These `.cer` files are **public roots**, not secrets — they can safely be
committed to the repo or baked into the container image. They are intentionally
NOT gitignored.
