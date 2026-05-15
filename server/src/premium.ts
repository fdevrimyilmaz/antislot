/**
 * Premium IAP validation endpoints.
 *
 * Cryptographically verifies Apple StoreKit 2 signedTransaction JWS payloads
 * against Apple's root certificate chain via `@apple/app-store-server-library`.
 *
 * Behavior:
 * - If the verifier is configured (root certs present): full chain + signature
 *   verification, plus sanity checks (bundleId, productId whitelist,
 *   expiresDate) and idempotency by transactionId.
 * - If the verifier is NOT configured:
 *     - In production: requests are rejected with `verifier_unavailable`.
 *     - Otherwise (dev/sandbox without certs): falls back to a payload-only
 *       sanity check so local Sandbox testing isn't blocked. The fallback is
 *       opt-in via ALLOW_DEV_RECEIPT_BYPASS=true.
 */

import type { Request, Response } from "express";

import { config } from "./config";
import {
  hasTransaction,
  tryInsertTransaction,
} from "./premium-idempotency";
import {
  isAppleVerifierReady,
  verifySignedTransaction,
} from "./apple-jws-verifier";

const KNOWN_PRODUCT_IDS = new Set([
  "com.antislot.premium.monthly",
  "com.antislot.premium.quarterly",
  "com.antislot.premium.semiannual",
  "com.antislot.premium.annual",
]);

type DecodedJwsPayload = {
  bundleId?: string;
  productId?: string;
  transactionId?: string;
  originalTransactionId?: string;
  expiresDate?: number;
  purchaseDate?: number;
  environment?: string;
};

function decodeBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + padding, "base64").toString("utf8");
}

function decodeJwsUnsafe(jws: string): DecodedJwsPayload | null {
  const parts = jws.split(".");
  if (parts.length !== 3) return null;
  try {
    const payloadJson = decodeBase64Url(parts[1]);
    return JSON.parse(payloadJson) as DecodedJwsPayload;
  } catch {
    return null;
  }
}

type ValidationOk = {
  ok: true;
  productId: string;
  transactionId: string;
  expiresAt: number | null;
  signatureVerified: boolean;
};

type ValidationFail = {
  ok: false;
  reason: string;
};

function validateDecodedReceipt(
  payload: DecodedJwsPayload | null,
  signatureVerified: boolean
): ValidationOk | ValidationFail {
  if (!payload) return { ok: false, reason: "invalid_jws" };

  if (payload.bundleId && payload.bundleId !== config.apple.bundleId) {
    return { ok: false, reason: "bundle_mismatch" };
  }

  if (!payload.productId || !KNOWN_PRODUCT_IDS.has(payload.productId)) {
    return { ok: false, reason: "unknown_product" };
  }

  const transactionId =
    payload.transactionId ||
    payload.originalTransactionId ||
    "";

  if (!transactionId) {
    return { ok: false, reason: "missing_transaction_id" };
  }

  const expiresAt =
    typeof payload.expiresDate === "number" && payload.expiresDate > 0
      ? payload.expiresDate
      : null;

  if (expiresAt !== null && expiresAt < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    productId: payload.productId,
    transactionId,
    expiresAt,
    signatureVerified,
  };
}

function getReceiptFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const receipt = (body as Record<string, unknown>).receipt;
  if (typeof receipt === "string" && receipt.length > 0) return receipt;
  return null;
}

function getPlatformFromBody(body: unknown): "ios" | "android" | null {
  if (!body || typeof body !== "object") return null;
  const platform = (body as Record<string, unknown>).platform;
  return platform === "ios" || platform === "android" ? platform : null;
}

async function verifyReceipt(
  receipt: string
): Promise<
  | { kind: "ok"; payload: DecodedJwsPayload; signatureVerified: boolean }
  | { kind: "fail"; reason: string; detail?: string }
> {
  if (isAppleVerifierReady()) {
    const result = await verifySignedTransaction(receipt);
    if (!result.ok) {
      return { kind: "fail", reason: result.reason, detail: result.detail };
    }
    const p = result.payload;
    return {
      kind: "ok",
      payload: {
        bundleId: p.bundleId,
        productId: p.productId,
        transactionId: p.transactionId,
        originalTransactionId: p.originalTransactionId,
        expiresDate: p.expiresDate,
        purchaseDate: p.purchaseDate,
        environment:
          typeof p.environment === "string" ? p.environment : undefined,
      },
      signatureVerified: true,
    };
  }

  if (config.isProduction) {
    return { kind: "fail", reason: "verifier_unavailable" };
  }
  if (!config.allowDevReceiptBypass) {
    return { kind: "fail", reason: "verifier_unavailable" };
  }

  const decoded = decodeJwsUnsafe(receipt);
  if (!decoded) return { kind: "fail", reason: "invalid_jws" };
  return { kind: "ok", payload: decoded, signatureVerified: false };
}

export async function handleActivate(req: Request, res: Response): Promise<Response> {
  const receipt = getReceiptFromBody(req.body);
  const platform = getPlatformFromBody(req.body);
  if (!receipt || !platform) {
    return res.status(400).json({
      ok: false,
      isActive: false,
      source: "none",
      error: "missing_receipt_or_platform",
    });
  }

  if (platform !== "ios") {
    return res.status(400).json({
      ok: false,
      isActive: false,
      source: "none",
      error: "platform_not_supported",
    });
  }

  const verified = await verifyReceipt(receipt);
  if (verified.kind === "fail") {
    const status = verified.reason === "verifier_unavailable" ? 503 : 400;
    return res.status(status).json({
      ok: false,
      isActive: false,
      source: "none",
      error: verified.reason,
      ...(verified.detail ? { detail: verified.detail } : {}),
    });
  }

  const validation = validateDecodedReceipt(verified.payload, verified.signatureVerified);
  if (!validation.ok) {
    return res.status(400).json({
      ok: false,
      isActive: false,
      source: "none",
      error: validation.reason,
    });
  }

  const userKey = `apple:${validation.transactionId}`;
  const inserted = tryInsertTransaction(userKey, validation.transactionId);
  if (!inserted && !hasTransaction(userKey, validation.transactionId)) {
    return res.status(503).json({
      ok: false,
      isActive: false,
      source: "none",
      error: "idempotency_store_unavailable",
    });
  }

  return res.status(200).json({
    ok: true,
    isActive: true,
    source: "iap",
    productId: validation.productId,
    transactionId: validation.transactionId,
    expiresAt: validation.expiresAt,
    signatureVerified: validation.signatureVerified,
  });
}

export async function handleRestore(req: Request, res: Response): Promise<Response> {
  const receipt = getReceiptFromBody(req.body);
  if (!receipt) {
    return res.status(200).json({
      ok: true,
      isActive: false,
      source: "none",
    });
  }
  return handleActivate(req, res);
}
