import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase configuration
 * Uses environment variables in production, falls back to default config for development
 * Note: Firebase client config is safe to expose, but using env vars is good practice
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDqVNSOnxuksvNtVNfcmIQKsHdZEAuTDds",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thanvishmusic.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://thanvishmusic-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thanvishmusic",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thanvishmusic.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "482164287637",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:482164287637:web:c3cda54ecebae67ae5d39c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BQKP5QK368"
};

/**
 * Initialize Firebase app (only if not already initialized)
 */
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

/**
 * Initialize Firebase Auth
 */
export const auth = getAuth(app);

/**
 * Initialize Firestore
 */
export const db = getFirestore(app);

/**
 * Initialize Firebase Storage
 */
export const storage = getStorage(app);

/**
 * Export the Firebase app instance
 */
export default app;

