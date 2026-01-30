'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { trackLogout } from '@/lib/ganalytics';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin by fetching user info
    const checkAdmin = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('firebase-auth-token='))
          ?.split('=')[1];

        if (!token) return;

        const response = await fetch('/api/user/info', {
          headers: {
            'x-firebase-uid': token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.user?.isAdmin || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdmin();
  }, []);

  const handleSignOut = async () => {
    try {
      trackLogout();
      await signOut(auth);
      // Clear the Firebase auth token cookie
      document.cookie = 'firebase-auth-token=; path=/; max-age=0';
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/keywords', label: 'Keywords' },
    { href: '/prompts', label: 'Prompts' },
    { href: '/results', label: 'Results' },
  ];

  if (isAdmin) {
    navLinks.push({ href: '/admin', label: 'Admin' });
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              GEO Platform
            </Link>
            <nav className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                    pathname === link.href
                      ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                      : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
