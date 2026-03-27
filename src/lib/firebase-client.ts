import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  type AppCheck,
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyDiEY9ZX4_JuE3R498SnilN664XTiJI538",
  authDomain: "thecotswoldsway-2c218.firebaseapp.com",
  projectId: "thecotswoldsway-2c218",
  storageBucket: "thecotswoldsway-2c218.firebasestorage.app",
  messagingSenderId: "965432693929",
  appId: "1:965432693929:web:53cf1f1153cb35af7705b8",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize App Check (client-side only)
let appCheckInstance: AppCheck | null = null;
if (typeof window !== "undefined") {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

/**
 * Get the current App Check token for use in API requests.
 * Returns the token string, or null if App Check is not configured.
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheckInstance) return null;
  try {
    const result = await getToken(appCheckInstance);
    return result.token;
  } catch {
    return null;
  }
}

export const auth = getAuth(app);
export const storage = getStorage(app);
