'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { trackDeleteKeyword } from '@/lib/ganalytics';

interface Keyword {
  _id: string;
  name: string;
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchKeywords(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchKeywords = async (currentUser: any) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/keywords', {
        headers: {
          'x-firebase-uid': currentUser.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKeywords(data);
        setError('');
      } else {
        const errorMessage = response.status === 401
          ? 'Your session has expired. Please sign in again.'
          : 'Failed to load keywords. Please refresh the page.';
        setError(errorMessage);
        setKeywords([]);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
      setError('Failed to load keywords. Please check your connection.');
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const keywordToDelete = keywords.find(k => k._id === id);
    if (!confirm('Are you sure you want to delete this keyword?')) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
        headers: {
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (keywordToDelete) {
          trackDeleteKeyword(keywordToDelete.name);
        }
        setKeywords(keywords.filter((k) => k._id !== id));
      } else {
        alert('Failed to delete keyword. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
      alert('Failed to delete keyword. Please check your connection and try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Keywords</h1>
          <p className="mt-2 text-gray-600">Manage your keyword catalog</p>
        </div>
        <Link
          href="/keywords/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Keyword
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {keywords.length === 0 && !error ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No keywords</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first keyword.
          </p>
          <div className="mt-6">
            <Link
              href="/keywords/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Keyword
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {keywords.map((keyword) => (
            <div
              key={keyword._id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{keyword.name}</h3>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Link
                  href={`/keywords/${keyword._id}/edit`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(keyword._id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
