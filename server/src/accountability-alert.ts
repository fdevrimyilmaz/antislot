import { config } from "./config";

const TWILIO_API_ROOT = "https://api.twilio.com/2010-04-01/Accounts";
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;
const MAX_MESSAGE_CHARS = 1000;
const URL_LIKE_PATTERN = /(https?:\/\/|www\.)/i;

type TwilioResponsePayload = {
  sid?: unknown;
  status?: unknown;
  error_code?: unknown;
  error_message?: unknown;
};

export type AccountabilityAlertInput = {
  phone: unknown;
  message: unknown;
};

export type AccountabilitySmsGatewayConfig = {
  enabled: boolean;
  timeoutMs: number;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioMessagingServiceSid: string;
  twilioFromNumber: string;
};

export type AccountabilityAlertDelivery =
  | {
      delivery: "sent";
      provider: "twilio";
      fallbackRequired: false;
      messageId: string | null;
    }
  | {
      delivery: "fallback_required";
      provider: "disabled";
      fallbackRequired: true;
      reason: "disabled" | "not_configured";
    };

export class AccountabilityAlertValidationError extends Error {
  code: "invalid_phone" | "invalid_message";

  constructor(code: "invalid_phone" | "invalid_message") {
    super(code);
    this.name = "AccountabilityAlertValidationError";
    this.code = code;
  }
}

export class AccountabilityAlertUpstreamError extends Error {
  code: "upstream_timeout" | "upstream_network_error" | "upstream_rejected";
  statusCode?: number;

  constructor(
    code: "upstream_timeout" | "upstream_network_error" | "upstream_rejected",
    statusCode?: number
  ) {
    super(code);
    this.name = "AccountabilityAlertUpstreamError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `${hasPlus ? "+" : ""}${digits}`.slice(0, 32);
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/^\+/, "");
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
}

function normalizeMessage(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_MESSAGE_CHARS);
}

function isMessageAllowed(message: string): boolean {
  if (!message) return false;
  if (URL_LIKE_PATTERN.test(message)) return false;
  return true;
}

function twilioStatusIndicatesFailure(statusValue: unknown): boolean {
  if (typeof statusValue !== "string") return false;
  const status = statusValue.trim().toLowerCase();
  return status === "failed" || status === "undelivered" || status === "canceled";
}

export async function sendAccountabilityAlertWithGateway(
  input: AccountabilityAlertInput,
  gateway: AccountabilitySmsGatewayConfig
): Promise<AccountabilityAlertDelivery> {
  const phone = normalizePhone(input.phone);
  const message = normalizeMessage(input.message);

  if (!phone || !isValidPhone(phone)) {
    throw new AccountabilityAlertValidationError("invalid_phone");
  }
  if (!message) {
    throw new AccountabilityAlertValidationError("invalid_message");
  }
  if (!isMessageAllowed(message)) {
    throw new AccountabilityAlertValidationError("invalid_message");
  }

  if (!gateway.enabled) {
    return {
      delivery: "fallback_required",
      provider: "disabled",
      fallbackRequired: true,
      reason: "disabled",
    };
  }

  const hasTwilioCredentials = Boolean(gateway.twilioAccountSid && gateway.twilioAuthToken);
  const hasTwilioSender = Boolean(gateway.twilioMessagingServiceSid || gateway.twilioFromNumber);
  if (!hasTwilioCredentials || !hasTwilioSender) {
    return {
      delivery: "fallback_required",
      provider: "disabled",
      fallbackRequired: true,
      reason: "not_configured",
    };
  }

  const encodedAuth = Buffer.from(
    `${gateway.twilioAccountSid}:${gateway.twilioAuthToken}`,
    "utf8"
  ).toString("base64");
  const url = `${TWILIO_API_ROOT}/${encodeURIComponent(gateway.twilioAccountSid)}/Messages.json`;
  const body = new URLSearchParams({
    To: phone,
    Body: message,
  });
  if (gateway.twilioMessagingServiceSid) {
    body.set("MessagingServiceSid", gateway.twilioMessagingServiceSid);
  } else {
    body.set("From", gateway.twilioFromNumber);
  }

  const timeoutMs = Math.max(1000, gateway.timeoutMs);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as TwilioResponsePayload | null;

    if (!response.ok) {
      throw new AccountabilityAlertUpstreamError("upstream_rejected", response.status);
    }
    if (payload && twilioStatusIndicatesFailure(payload.status)) {
      throw new AccountabilityAlertUpstreamError("upstream_rejected", 502);
    }

    const sid = typeof payload?.sid === "string" ? payload.sid : null;
    return {
      delivery: "sent",
      provider: "twilio",
      fallbackRequired: false,
      messageId: sid,
    };
  } catch (error) {
    if (error instanceof AccountabilityAlertUpstreamError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new AccountabilityAlertUpstreamError("upstream_timeout");
    }
    throw new AccountabilityAlertUpstreamError("upstream_network_error");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendAccountabilityAlert(
  input: AccountabilityAlertInput
): Promise<AccountabilityAlertDelivery> {
  return sendAccountabilityAlertWithGateway(input, {
    enabled: config.accountabilitySmsEnabled,
    timeoutMs: config.accountabilitySmsTimeoutMs,
    twilioAccountSid: config.twilioAccountSid,
    twilioAuthToken: config.twilioAuthToken,
    twilioMessagingServiceSid: config.twilioMessagingServiceSid,
    twilioFromNumber: config.twilioFromNumber,
  });
}
