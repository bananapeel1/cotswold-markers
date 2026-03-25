import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuthInstance } from "firebase-admin/auth";

function getApp() {
  if (getApps().length) return getApps()[0];

  // Option 1: Service account JSON string in env var
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (keyJson) {
    const serviceAccount = JSON.parse(keyJson) as ServiceAccount;
    return initializeApp({ credential: cert(serviceAccount) });
  }

  // Option 2: GOOGLE_APPLICATION_CREDENTIALS file path (set automatically by gcloud CLI)
  // firebase-admin picks this up via Application Default Credentials
  return initializeApp({ projectId: "thecotswoldsway-2c218" });
}

let _db: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (!_db) {
    const app = getApp();
    _db = getFirestore(app);
  }
  return _db;
}

export function getAdminAuth() {
  const app = getApp();
  return getAdminAuthInstance(app);
}

/** Returns true if Firestore credentials are configured */
export function isFirestoreAvailable(): boolean {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}
