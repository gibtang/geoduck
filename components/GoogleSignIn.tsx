'use client';

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

/**
 * Google Sign-In button component that handles both sign-in and sign-up flows
 *
 * IMPORTANT: This component does NOT navigate after sign-in.
 * Navigation is handled by the signin/signup pages watching AuthContext's user state.
 *
 * @param mode - Whether this is for sign-in or sign-up ('signin' | 'signup')
 * @param onSuccess - Optional callback invoked after successful authentication
 * @param onError - Optional callback for error handling, receives error message string
 *
 * @example
 * <GoogleSignIn
 *   mode="signup"
 *   onSuccess={() => console.log('Signed in!')}
 *   onError={(msg) => setError(msg)}
 * />
 */
interface GoogleSignInProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function GoogleSignIn({ mode, onSuccess, onError }: GoogleSignInProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // For signup mode, create user record in MongoDB after Firebase authentication
      // This ensures the user exists in our database before redirecting to dashboard
      // The API endpoint is idempotent - it returns existing user if firebaseUid already exists
      if (mode === 'signup') {
        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: userCredential.user.uid,
            email: userCredential.user.email,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create user in database');
        }
      }

      // Note: Cookie is set by AuthContext's onAuthStateChanged listener
      // Don't set cookie here to avoid duplication and timing issues

      // Call success callback (for analytics tracking)
      // Note: No navigation here - let AuthContext's user state change trigger navigation
      onSuccess?.();
    } catch (err: unknown) {
      // Type-safe error handling with Firebase error codes
      const error = err as { code?: string; message?: string };

      // Map Firebase auth errors to user-friendly messages
      // See: https://firebase.google.com/docs/auth/admin/errors
      const errorMessage = error.code === 'auth/popup-closed-by-user'
        ? 'Sign-in popup was closed'
        : error.code === 'auth/popup-blocked'
        ? 'Sign-in popup was blocked. Please allow popups for this site.'
        : error.code === 'auth/account-exists-with-different-credential'
        ? 'An account already exists with the same email address but different sign-in credentials'
        : error.code === 'auth/invalid-credential'
        ? 'Invalid credentials. Please try again.'
        : error.message || 'Failed to sign in with Google';

      console.error('Google sign-in error:', errorMessage, error);

      // Ensure error handler is called
      if (onError) {
        onError(errorMessage);
      } else {
        // Fallback if no error handler provided
        console.error('No error handler provided for GoogleSignIn:', errorMessage);
      }

      // CRITICAL: Do NOT navigate on error - user should see error message and retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full py-3 px-4 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {loading ? 'Signing in with Google...' : `Sign ${mode === 'signin' ? 'In' : 'Up'} with Google`}
    </button>
  );
}
