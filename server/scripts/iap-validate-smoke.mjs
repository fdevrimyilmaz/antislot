const requiredVars = [
  "IAP_SMOKE_BASE_URL",
  "IAP_SMOKE_API_AUTH_TOKEN",
  "IAP_SMOKE_RECEIPT",
];

for (const key of requiredVars) {
  if (!process.env[key] || !process.env[key].trim()) {
    console.error(`[iap-smoke] Missing required env: ${key}`);
    process.exit(1);
  }
}

const baseUrl = process.env.IAP_SMOKE_BASE_URL.replace(/\/+$/, "");
const token = process.env.IAP_SMOKE_API_AUTH_TOKEN;
const receipt = process.env.IAP_SMOKE_RECEIPT;
const userId = process.env.IAP_SMOKE_USER_ID || `ci-smoke-${Date.now()}`;
const platform =
  process.env.IAP_SMOKE_PLATFORM === "android" ? "android" : "ios";

const response = await fetch(`${baseUrl}/v1/iap/validate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-User-Id": userId,
    "X-Request-Id": `smoke-${Date.now()}`,
  },
  body: JSON.stringify({
    receipt,
    platform,
  }),
});

let payload = null;
try {
  payload = await response.json();
} catch {
  payload = null;
}

if (!response.ok || !payload?.ok || !payload?.result?.source) {
  console.error("[iap-smoke] Validation failed", {
    status: response.status,
    payload,
  });
  process.exit(1);
}

console.log("[iap-smoke] OK", {
  source: payload.result.source,
  active: payload.result.active,
  productId: payload.result.productId ?? null,
});
