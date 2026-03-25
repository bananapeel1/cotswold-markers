import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDiEY9ZX4_JuE3R498SnilN664XTiJI538",
  authDomain: "thecotswoldsway-2c218.firebaseapp.com",
  projectId: "thecotswoldsway-2c218",
  storageBucket: "thecotswoldsway-2c218.firebasestorage.app",
  messagingSenderId: "965432693929",
  appId: "1:965432693929:web:53cf1f1153cb35af7705b8",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
