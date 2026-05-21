/**
 * Apple StoreKit 2 JWS verifier.
 *
 * Wraps Apple's `@apple/app-store-server-library` `SignedDataVerifier` so the
 * premium endpoints can cryptographically verify a signedTransaction JWS
 * against Apple's root certificate chain — not just decode the payload.
 *
 * Cert loading is lazy and tolerant: if the operator has not placed the Apple
 * root CAs on disk, we report "verifier_unavailable" and the caller decides
 * whether to fall back (dev) or fail (production).
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";

import {
  Environment,
  JWSTransactionDecodedPayload,
  SignedDataVerifier,
  VerificationException,
} from "@apple/app-store-server-library";

export type AppleVerifierConfig = {
  rootCertDir: string;
  bundleId: string;
  environment: Environment;
  appAppleId?: number;
  enableOnlineChecks: boolean;
};

type LoadedVerifier = {
  verifier: SignedDataVerifier;
  certCount: number;
};

let loadAttempted = false;
let loadedVerifier: LoadedVerifier | null = null;
let lastLoadError: string | null = null;

function loadRootCerts(rootCertDir: string): Buffer[] {
  if (!existsSync(rootCertDir)) {
    throw new Error(`apple_root_cert_dir_not_found:${rootCertDir}`);
  }
  const files = readdirSync(rootCertDir).filter(
    (name) => name.toLowerCase().endsWith(".cer") || name.toLowerCase().endsWith(".der")
  );
  if (files.length === 0) {
    throw new Error(`apple_root_certs_missing:${rootCertDir}`);
  }
  return files.map((name) => readFileSync(path.join(rootCertDir, name)));
}

export function configureAppleVerifier(config: AppleVerifierConfig): void {
  loadAttempted = true;
  try {
    const certs = loadRootCerts(config.rootCertDir);
    loadedVerifier = {
      verifier: new SignedDataVerifier(
        certs,
        config.enableOnlineChecks,
        config.environment,
        config.bundleId,
        config.appAppleId
      ),
      certCount: certs.length,
    };
    lastLoadError = null;
    console.log(
      `[apple-jws-verifier] loaded ${certs.length} root cert(s) from ${config.rootCertDir} (env=${config.environment}, bundleId=${config.bundleId})`
    );
  } catch (error) {
    loadedVerifier = null;
    lastLoadError = error instanceof Error ? error.message : String(error);
    console.warn(
      `[apple-jws-verifier] not configured: ${lastLoadError}. JWS signatures will NOT be cryptographically verified.`
    );
  }
}

export function isAppleVerifierReady(): boolean {
  return loadedVerifier !== null;
}

export function getAppleVerifierStatus(): {
  ready: boolean;
  loadAttempted: boolean;
  certCount: number;
  lastError: string | null;
} {
  return {
    ready: loadedVerifier !== null,
    loadAttempted,
    certCount: loadedVerifier?.certCount ?? 0,
    lastError: lastLoadError,
  };
}

export type VerifyOk = {
  ok: true;
  payload: JWSTransactionDecodedPayload;
};

export type VerifyFail = {
  ok: false;
  reason:
    | "verifier_unavailable"
    | "invalid_signature"
    | "verification_error";
  detail?: string;
};

export async function verifySignedTransaction(
  signedTransaction: string
): Promise<VerifyOk | VerifyFail> {
  if (!loadedVerifier) {
    return { ok: false, reason: "verifier_unavailable", detail: lastLoadError ?? "not_configured" };
  }
  try {
    const payload = await loadedVerifier.verifier.verifyAndDecodeTransaction(
      signedTransaction
    );
    return { ok: true, payload };
  } catch (error) {
    if (error instanceof VerificationException) {
      return {
        ok: false,
        reason: "invalid_signature",
        detail: `${error.status}:${error.cause?.message ?? error.message}`,
      };
    }
    return {
      ok: false,
      reason: "verification_error",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export function parseEnvironment(value: string | undefined): Environment {
  switch ((value ?? "").trim().toLowerCase()) {
    case "production":
      return Environment.PRODUCTION;
    case "xcode":
      return Environment.XCODE;
    case "local_testing":
    case "local-testing":
      return Environment.LOCAL_TESTING;
    case "sandbox":
    default:
      return Environment.SANDBOX;
  }
}
