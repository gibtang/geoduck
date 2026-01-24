'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

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

  let tokenRefreshInterval: NodeJS.Timeout | null = null;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      try {
        const idToken = await user.getIdToken();
        document.cookie = `firebase-auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

        // Set up token refresh every 55 minutes (tokens expire in 1 hour)
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
        }

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
