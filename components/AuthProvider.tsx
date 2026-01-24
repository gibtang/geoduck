'use client';

import { useEffect } from 'react';
import { initializeAuthListener } from '@/lib/authClient';

/**
 * Client-side authentication provider component
 * Initializes Firebase auth state listener and token refresh mechanism
 *
 * This component should be included once in the root layout to enable:
 * - Automatic token persistence when user signs in
 * - Token refresh every 55 minutes (Firebase tokens expire in 1 hour)
 * - Cookie cleanup when user signs out
 */
export default function AuthProvider() {
  useEffect(() => {
    initializeAuthListener();
  }, []);

  return null; // This component doesn't render anything
}
