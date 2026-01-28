'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackSignUp } from '@/lib/ganalytics';
import GoogleSignIn from '@/components/GoogleSignIn';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * Handles email/password form submission
   * Creates Firebase user, creates database record, tracks signup event, and redirects to dashboard
   * @param e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Create user record in MongoDB after Firebase authentication
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

        // CRITICAL: Delete Firebase user to avoid orphaned accounts
        await userCredential.user.delete().catch(() => {
          console.error('Failed to delete Firebase user after database error');
        });

        throw new Error(errorData.message || 'Failed to create user in database');
      }

      // Get Firebase ID token and set it as a cookie for middleware authentication
      const idToken = await userCredential.user.getIdToken();
      document.cookie = `firebase-auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

      trackSignUp('email');
      router.push('/dashboard');
    } catch (err: unknown) {
      // Type-safe error handling
      const error = err as { code?: string; message?: string };

      // Map Firebase errors to user-friendly messages
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists. Please sign in.'
        : error.code === 'auth/weak-password'
        ? 'Password is too weak. Please use at least 6 characters.'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address format.'
        : error.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please wait a few minutes before trying again.'
        : error.message || 'Failed to create account';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    trackSignUp('google');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Create Account</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="••••••••"
              />
              <p className="mt-1 text-sm text-gray-500">Password must be at least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <GoogleSignIn
            mode="signup"
            onSuccess={handleGoogleSuccess}
            onError={setError}
          />

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
