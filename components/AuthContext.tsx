'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set cookie for API routes authentication
        try {
          const idToken = await user.getIdToken();
          document.cookie = `firebase-auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

          // Set up token refresh every 55 minutes
          const refreshTimer = setInterval(async () => {
            try {
              const refreshedUser = auth.currentUser;
              if (refreshedUser) {
                const newToken = await refreshedUser.getIdToken(true);
                document.cookie = `firebase-auth-token=${newToken}; path=/; max-age=3600; SameSite=Lax`;
              }
            } catch (error) {
              console.error('Error refreshing token:', error);
            }
          }, 55 * 60 * 1000); // 55 minutes

          // Store timer ID for cleanup (not implemented here for simplicity)
          ;(window as any).__tokenRefreshTimer = refreshTimer;
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
      } else {
        // Clear cookie when user signs out
        document.cookie = 'firebase-auth-token=; path=/; max-age=0';

        // Clear token refresh timer
        const timer = (window as any).__tokenRefreshTimer;
        if (timer) {
          clearInterval(timer);
          delete (window as any).__tokenRefreshTimer;
        }
      }

      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
