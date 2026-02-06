'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackLogin } from '@/lib/ganalytics';
import GoogleSignIn from '@/components/GoogleSignIn';
import { useAuth } from '@/components/AuthContext';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Auto-redirect to dashboard if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  /**
   * Handles email/password form submission
   * Authenticates user via Firebase, tracks login event, and redirects to dashboard
   * @param e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Note: Cookie is set by AuthContext, navigation is handled by useEffect above
      trackLogin('email');
    } catch (err: unknown) {
      // Type-safe error handling
      const error = err as { code?: string; message?: string };

      // Map Firebase errors to user-friendly messages
      const errorMessage = error.code === 'auth/invalid-credential'
        ? 'Invalid email or password. Please try again.'
        : error.code === 'auth/user-not-found'
        ? 'No account found with this email. Please sign up.'
        : error.code === 'auth/wrong-password'
        ? 'Incorrect password. Please try again.'
        : error.code === 'auth/too-many-requests'
        ? 'Too many failed attempts. Please wait a few minutes before trying again.'
        : error.message || 'Failed to sign in';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    trackLogin('google');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Sign In</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-700">Or continue with</span>
            </div>
          </div>

          <GoogleSignIn
            mode="signin"
            onSuccess={handleGoogleSuccess}
            onError={setError}
          />

          <p className="mt-6 text-center text-sm text-gray-800">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
