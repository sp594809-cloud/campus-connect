import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase web SDK is bootstrapped from VITE_FIREBASE_* env variables.
 *
 * NOTE: Firebase web client config values are technically PUBLIC identifiers
 * (every visitor sees them in network requests). Real security comes from
 * Firebase Security Rules, App Check, and OAuth domain restrictions.
 * Reading from env is still preferred so the project can be configured
 * per-environment (dev/staging/prod) without source changes.
 */
function readEnv(name: string, fallback = ""): string {
  // Vite-style first
  const fromVite = (import.meta as unknown as { env?: Record<string, string> }).env?.[name];
  if (fromVite) return fromVite;
  // Process.env fallback (e.g. tests with vitest+node env)
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  return fallback;
}

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID"),
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Log loudly in dev so the misconfiguration is obvious; do NOT throw to
  // avoid crashing the whole app if Firebase isn't required for a given route.
  // eslint-disable-next-line no-console
  console.warn(
    "[firebase] Missing VITE_FIREBASE_* env vars. Firebase auth/firestore will not work until configured."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
