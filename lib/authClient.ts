'use client';

import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { env } from './env';

// Store the interval ID outside the listener to prevent multiple intervals
let tokenRefreshInterval: NodeJS.Timeout | null = null;
let isInitialized = false;

/**
 * Initializes Firebase auth state listener and manages token persistence
 * - Sets/updates firebase-auth-token cookie when user signs in
 * - Clears cookie when user signs out
 * - Auto-refreshes token every 55 minutes (tokens expire in 1 hour)
 *
 * Call this once in your root layout or a client component that wraps your app
 */
export function initializeAuthListener() {
  if (typeof window === 'undefined') return;

  // Prevent multiple listeners
  if (isInitialized) return;
  isInitialized = true;

  // Ensure Firebase app is initialized
  const app = getApps().length === 0 ? initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }) : getApp();

  const auth = getAuth(app);

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      try {
        const idToken = await user.getIdToken();
        document.cookie = `firebase-auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

        // Clear any existing interval before setting a new one
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
        }

        // Set up token refresh every 55 minutes (tokens expire in 1 hour)
        tokenRefreshInterval = setInterval(async () => {
          try {
            const refreshedUser = auth.currentUser;
            if (refreshedUser) {
              const newToken = await refreshedUser.getIdToken(true); // forceRefresh = true
              document.cookie = `firebase-auth-token=${newToken}; path=/; max-age=3600; SameSite=Lax`;
            }
          } catch (error) {
            console.error('Error refreshing token:', error);
          }
        }, 55 * 60 * 1000); // 55 minutes
      } catch (error) {
        console.error('Error getting ID token:', error);
      }
    } else {
      // User is signed out
      document.cookie = 'firebase-auth-token=; path=/; max-age=0';

      // Clear token refresh interval
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
    }
  });
}
