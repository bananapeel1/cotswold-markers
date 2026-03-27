import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
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
if (typeof window !== "undefined") {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export const auth = getAuth(app);
export const storage = getStorage(app);
