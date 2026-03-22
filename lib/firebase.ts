import type { FirebaseApp } from "firebase/app";
import { getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";
import type { Database } from "firebase/database";
import { getDatabase } from "firebase/database";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { logOnce } from "@/lib/logOnce";

type FirebaseEnvConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  databaseURL?: string;
};

const firebaseEnv: FirebaseEnvConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

const requiredKeys: (keyof FirebaseEnvConfig)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
  "databaseURL",
];

const missingKeys = requiredKeys.filter(
  (key) => !firebaseEnv[key] || String(firebaseEnv[key]).trim().length === 0
);

const envKeyByConfigKey: Record<keyof FirebaseEnvConfig, string> = {
  apiKey: "EXPO_PUBLIC_FIREBASE_API_KEY",
  authDomain: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "EXPO_PUBLIC_FIREBASE_APP_ID",
  measurementId: "EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID",
  databaseURL: "EXPO_PUBLIC_FIREBASE_DATABASE_URL",
};

export const missingFirebaseKeys = missingKeys.map((key) => envKeyByConfigKey[key]);
export const firebaseReady = missingKeys.length === 0;

if (!firebaseReady && __DEV__) {
  logOnce(
    "firebase-missing-config",
    `[Firebase] Config missing. Features requiring Firebase are disabled. Missing vars: ${missingFirebaseKeys.join(", ")}`
  );
}

let app: FirebaseApp | null = null;
if (firebaseReady) {
  const firebaseConfig = {
    apiKey: firebaseEnv.apiKey!,
    authDomain: firebaseEnv.authDomain!,
    projectId: firebaseEnv.projectId!,
    storageBucket: firebaseEnv.storageBucket!,
    messagingSenderId: firebaseEnv.messagingSenderId!,
    appId: firebaseEnv.appId!,
    measurementId: firebaseEnv.measurementId,
    databaseURL: firebaseEnv.databaseURL!,
  };
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

// Firebase Auth is used across the app (including anonymous auth).
export const auth: Auth | null = app ? getAuth(app) : null;

// Firestore is still used for progress tracking and other features.
export const db: Firestore | null = app ? getFirestore(app) : null;

// Realtime Database is used for community chat & presence.
export const rtdb: Database | null = app && firebaseEnv.databaseURL
  ? getDatabase(app, firebaseEnv.databaseURL)
  : null;
