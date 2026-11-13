/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';



const env = (import.meta.env ?? {}) as Partial<Record<string, string>>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app =
  typeof window === 'undefined' && !hasFirebaseConfig
    ? (null as unknown as ReturnType<typeof initializeApp>)
    : !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();

let dbInstance: Firestore;
if (app) {
  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    dbInstance = getFirestore(app);
  }
} else {
  dbInstance = null as unknown as Firestore;
}

export const db = dbInstance;

// Non-blocking connection validation on browser boot
if (typeof window !== 'undefined') {
  getDocFromServer(doc(db, 'user_profile', 'default')).catch((error) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore appears offline. Please check your Firebase configuration or network.');
    }
  });
}
