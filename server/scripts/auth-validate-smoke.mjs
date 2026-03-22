const requiredVars = [
  "AUTH_SMOKE_SERVER_BASE_URL",
  "AUTH_SMOKE_ID_TOKEN",
];

for (const key of requiredVars) {
  if (!process.env[key] || !process.env[key].trim()) {
    console.error(`[auth-smoke] Missing required env: ${key}`);
    process.exit(1);
  }
}

const serverBaseUrl = process.env.AUTH_SMOKE_SERVER_BASE_URL.replace(/\/+$/, "");
const backendBaseUrl = (process.env.AUTH_SMOKE_BACKEND_BASE_URL || "").replace(/\/+$/, "");
const idToken = process.env.AUTH_SMOKE_ID_TOKEN;
const userId = process.env.AUTH_SMOKE_USER_ID || `auth-smoke-${Date.now()}`;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
    "X-Request-Id": `auth-smoke-${Date.now()}`,
    "X-User-Id": userId,
  };
}

async function assertServerPremiumStatus() {
  const response = await fetch(`${serverBaseUrl}/v1/premium/status`, {
    method: "GET",
    headers: authHeaders(),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload?.state) {
    console.error("[auth-smoke] /v1/premium/status failed", {
      status: response.status,
      payload,
    });
    process.exit(1);
  }
}

async function assertServerChat() {
  const response = await fetch(`${serverBaseUrl}/v1/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      messages: [{ role: "user", content: "Kısa bir nefes egzersizi öner." }],
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || typeof payload?.reply !== "string") {
    console.error("[auth-smoke] /v1/chat failed", {
      status: response.status,
      payload,
    });
    process.exit(1);
  }
}

async function assertBackendChatIfConfigured() {
  if (!backendBaseUrl) return;

  const response = await fetch(`${backendBaseUrl}/v1/ai/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      message: "Dürtü geldiğinde 3 adım öner.",
      history: [],
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || typeof payload?.reply !== "string") {
    console.error("[auth-smoke] backend /v1/ai/chat failed", {
      status: response.status,
      payload,
    });
    process.exit(1);
  }
}

await assertServerPremiumStatus();
await assertServerChat();
await assertBackendChatIfConfigured();

console.log("[auth-smoke] OK", {
  serverBaseUrl,
  backendChecked: Boolean(backendBaseUrl),
});
