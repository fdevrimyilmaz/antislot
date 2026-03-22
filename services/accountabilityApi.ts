import { getApiBaseUrl } from "@/services/apiBase";

type ApiErrorBody = {
  ok?: false;
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
};

export type AccountabilityAlertDelivery =
  | {
      ok: true;
      delivery: "sent";
      provider: "twilio";
      fallbackRequired: false;
      messageId: string | null;
      serverTime: number;
      deduplicated?: boolean;
    }
  | {
      ok: true;
      delivery: "fallback_required";
      provider: "disabled";
      fallbackRequired: true;
      reason: "disabled" | "not_configured";
      serverTime: number;
      deduplicated?: boolean;
    };

type AccountabilityAlertRequest = {
  phone: string;
  message: string;
};

export class AccountabilityAlertApiError extends Error {
  kind: "policy_blocked" | "upstream_failure" | "transport_failure";
  status?: number;
  code?: string;

  constructor(
    kind: "policy_blocked" | "upstream_failure" | "transport_failure",
    message: string,
    status?: number,
    code?: string
  ) {
    super(message);
    this.name = "AccountabilityAlertApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

function url(path: string): string {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getAuthHeaders(): Promise<HeadersInit | null> {
  let getClientIdentityFn: () => Promise<string>;
  let getFirebaseAuthBearerTokenFn: () => Promise<string>;
  try {
    const [{ getClientIdentity }, { getFirebaseAuthBearerToken }] = await Promise.all([
      import("@/services/clientIdentity"),
      import("@/services/firebaseAuthToken"),
    ]);
    getClientIdentityFn = getClientIdentity;
    getFirebaseAuthBearerTokenFn = getFirebaseAuthBearerToken;
  } catch {
    return null;
  }

  const userId = await getClientIdentityFn();
  const idToken = await getFirebaseAuthBearerTokenFn();
  if (!idToken) return null;

  return {
    "Content-Type": "application/json",
    "X-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    "X-User-Id": userId,
    Authorization: `Bearer ${idToken}`,
  };
}

export async function sendAccountabilityAlertViaServer(
  payload: AccountabilityAlertRequest
): Promise<AccountabilityAlertDelivery | null> {
  const headers = await getAuthHeaders();
  if (!headers) return null;

  const idempotencyKey = `acc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const response = await fetch(url("/v1/accountability/alert"), {
    method: "POST",
    headers: {
      ...headers,
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
    const code = errorBody?.error?.code ?? "UNKNOWN";
    const message = errorBody?.error?.message ?? `Request failed (${response.status})`;
    if (response.status === 429 || code === "RATE_LIMITED") {
      throw new AccountabilityAlertApiError("policy_blocked", message, response.status, code);
    }
    if (response.status === 400 || code === "BAD_REQUEST") {
      throw new AccountabilityAlertApiError("policy_blocked", message, response.status, code);
    }
    if (response.status >= 500 || code === "UPSTREAM_ERROR" || code === "SERVICE_UNAVAILABLE") {
      throw new AccountabilityAlertApiError("upstream_failure", message, response.status, code);
    }
    throw new AccountabilityAlertApiError("transport_failure", message, response.status, code);
  }

  const data = (await response.json()) as AccountabilityAlertDelivery;
  if (!data?.ok || (data.delivery !== "sent" && data.delivery !== "fallback_required")) {
    throw new AccountabilityAlertApiError(
      "transport_failure",
      "Invalid accountability alert response"
    );
  }
  return data;
}
