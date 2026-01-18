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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDR9Ek6Rnz4jRzwG5EEs2trZYioC02XRwM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thanvish-ai-52bd9.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://thanvish-ai-52bd9-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thanvish-ai-52bd9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thanvish-ai-52bd9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "697159030945",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:697159030945:web:968e1603f6fc91534e78e0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YE8ZLXVZSJ"
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

