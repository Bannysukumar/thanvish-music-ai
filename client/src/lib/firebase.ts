import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

/**
 * Firebase configuration
 * For Firebase JS SDK v7.20.0 and later, measurementId is optional
 */
const firebaseConfig = {
  apiKey: "AIzaSyDqVNSOnxuksvNtVNfcmIQKsHdZEAuTDds",
  authDomain: "thanvishmusic.firebaseapp.com",
  databaseURL: "https://thanvishmusic-default-rtdb.firebaseio.com",
  projectId: "thanvishmusic",
  storageBucket: "thanvishmusic.firebasestorage.app",
  messagingSenderId: "482164287637",
  appId: "1:482164287637:web:c3cda54ecebae67ae5d39c",
  measurementId: "G-BQKP5QK368"
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
 * Export the Firebase app instance
 */
export default app;

