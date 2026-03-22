import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { config } from "./config";

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function parseServiceAccountFromB64(): FirebaseServiceAccount | null {
  if (!config.firebaseServiceAccountJsonB64) return null;
  try {
    const raw = Buffer.from(config.firebaseServiceAccountJsonB64, "base64").toString("utf8");
    const parsed = JSON.parse(raw) as FirebaseServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

let firebaseReady = false;
if (config.firebaseProjectId) {
  const apps = getApps();
  if (apps.length === 0) {
    const serviceAccount = parseServiceAccountFromB64();
    if (serviceAccount) {
      const account: ServiceAccount = {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      };
      initializeApp({ credential: cert(account), projectId: serviceAccount.project_id });
      firebaseReady = true;
    } else {
      try {
        initializeApp({ projectId: config.firebaseProjectId });
        firebaseReady = true;
      } catch {
        firebaseReady = false;
      }
    }
  } else {
    firebaseReady = true;
  }
}

export async function verifyFirebaseBearerToken(token: string): Promise<string | null> {
  if (!firebaseReady) return null;
  try {
    const decoded = await getAuth().verifyIdToken(token, true);
    return decoded.uid ?? null;
  } catch {
    return null;
  }
}
