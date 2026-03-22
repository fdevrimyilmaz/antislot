#!/usr/bin/env node

const requiredVars = [
  "ADMIN_PROXY_SMOKE_BASE_URL",
  "ADMIN_PROXY_SMOKE_SHARED_SECRET",
  "ADMIN_PROXY_SMOKE_USER",
];

for (const key of requiredVars) {
  if (!process.env[key] || !process.env[key].trim()) {
    console.error(`[admin-proxy-smoke] Missing required env: ${key}`);
    process.exit(1);
  }
}

const baseUrl = process.env.ADMIN_PROXY_SMOKE_BASE_URL.replace(/\/+$/, "");
const sharedSecret = process.env.ADMIN_PROXY_SMOKE_SHARED_SECRET.trim();
const adminUser = process.env.ADMIN_PROXY_SMOKE_USER.trim();
const adminGroups = (process.env.ADMIN_PROXY_SMOKE_GROUPS || "").trim();

const secretHeader = (process.env.ADMIN_PROXY_SMOKE_SECRET_HEADER || "x-admin-proxy-secret")
  .trim()
  .toLowerCase();
const userHeader = (process.env.ADMIN_PROXY_SMOKE_USER_HEADER || "x-auth-request-email")
  .trim()
  .toLowerCase();
const groupsHeader = (process.env.ADMIN_PROXY_SMOKE_GROUPS_HEADER || "x-auth-request-groups")
  .trim()
  .toLowerCase();

function makeHeaders() {
  const headers = {
    Accept: "application/json",
    [secretHeader]: sharedSecret,
    [userHeader]: adminUser,
    "x-request-id": `admin-proxy-smoke-${Date.now()}`,
  };
  if (adminGroups) {
    headers[groupsHeader] = adminGroups;
  }
  return headers;
}

async function fetchQueue() {
  const query = new URLSearchParams({
    status: "queued",
    limit: "10",
  });

  const response = await fetch(`${baseUrl}/v1/therapy/callback/queue?${query.toString()}`, {
    method: "GET",
    headers: makeHeaders(),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !Array.isArray(payload?.requests)) {
    console.error("[admin-proxy-smoke] queue request failed", {
      status: response.status,
      payload,
    });
    process.exit(1);
  }

  return payload;
}

async function patchIfRequested() {
  const requestId = (process.env.ADMIN_PROXY_SMOKE_REQUEST_ID || "").trim();
  if (!requestId) {
    return;
  }

  const nextStatus = (process.env.ADMIN_PROXY_SMOKE_PATCH_STATUS || "contacted")
    .trim()
    .toLowerCase();
  if (nextStatus !== "contacted" && nextStatus !== "closed") {
    console.error(
      "[admin-proxy-smoke] ADMIN_PROXY_SMOKE_PATCH_STATUS must be contacted or closed"
    );
    process.exit(1);
  }

  const response = await fetch(
    `${baseUrl}/v1/therapy/callback/${encodeURIComponent(requestId)}/status`,
    {
      method: "PATCH",
      headers: {
        ...makeHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextStatus,
        adminNote: "Updated by admin-proxy smoke test",
      }),
    }
  );

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload?.request?.requestId) {
    console.error("[admin-proxy-smoke] patch request failed", {
      status: response.status,
      payload,
    });
    process.exit(1);
  }

  console.log("[admin-proxy-smoke] patch route OK", {
    requestId: payload.request.requestId,
    status: payload.request.status,
  });
}

const queuePayload = await fetchQueue();
await patchIfRequested();

console.log("[admin-proxy-smoke] OK", {
  baseUrl,
  totalQueued:
    typeof queuePayload?.totalQueued === "number" ? queuePayload.totalQueued : "unknown",
  requestsReturned: queuePayload.requests.length,
  patchChecked: Boolean((process.env.ADMIN_PROXY_SMOKE_REQUEST_ID || "").trim()),
});

