import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Vipto Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCH14V4OJc0-F02h1m_g_DZNN27lyI09pE",
  authDomain: "vipto-crm.firebaseapp.com",
  projectId: "vipto-crm",
  storageBucket: "vipto-crm.firebasestorage.app",
  messagingSenderId: "775011825026",
  appId: "1:775011825026:web:51de711a05c22732bc0b9b",
  measurementId: "G-XFVFZGKS13"
};

// Initialize or reuse Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize analytics safely
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics optional fallback
  });
}

export default app;
