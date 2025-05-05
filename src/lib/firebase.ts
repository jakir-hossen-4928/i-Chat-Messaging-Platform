
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase with SSR check
const initFirebase = () => {
  if (typeof window !== 'undefined') {
    // Check if Firebase is already initialized
    if (!getApps().length) {
      const app = initializeApp(firebaseConfig);
      // Only initialize analytics in browser environment
      isSupported().then(supported => {
        if (supported) {
          getAnalytics(app);
        }
      });
      return app;
    } else {
      return getApps()[0];
    }
  }

  // If in SSR context and Firebase isn't initialized, initialize it
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  } else {
    return getApps()[0];
  }
};

// Initialize Firebase
const app = initFirebase();

// Initialize services
export const auth = getAuth(app);
export const firestore = getFirestore(app); // Using only Firestore
export const storage = getStorage(app);

// Export app instance
export { app };
