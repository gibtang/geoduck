import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { env } from './env';

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log(firebaseConfig);

let _app: FirebaseApp;
let _auth: Auth;

// Initialize Firebase only on client side
if (typeof window !== 'undefined') {
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  _auth = getAuth(_app);
}

// Lazy getters to prevent SSR issues
export function getAppInstance(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be accessed on the client side');
  }
  return _app;
}

export function getAuthInstance(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be accessed on the client side');
  }
  return _auth;
}

// Re-export for backward compatibility (with lazy evaluation)
export const app = new Proxy({} as FirebaseApp, {
  get(target, prop) {
    return getAppInstance()[prop as keyof FirebaseApp];
  }
});

export const auth = new Proxy({} as Auth, {
  get(target, prop) {
    return getAuthInstance()[prop as keyof Auth];
  }
});
