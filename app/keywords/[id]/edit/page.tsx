'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useParams } from 'next/navigation';
import { trackUpdateKeyword } from '@/lib/ganalytics';

interface Keyword {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  keywords: string[];
}

export default function EditKeywordPage() {
  const params = useParams();
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/signin');
      } else {
        setUser(user);
        fetchKeyword(user, params.id as string);
      }
    });

    return () => unsubscribe();
  }, [router, params.id]);

  const fetchKeyword = async (currentUser: any, id: string) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/keywords/${id}`, {
        headers: {
          'x-firebase-uid': currentUser.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: Keyword = await response.json();
        setFormData({
          name: data.name,
          keywords: data.keywords.join(', '),
        });
        setError('');
      } else {
        setError('Failed to load keyword');
      }
    } catch (error) {
      console.error('Error fetching keyword:', error);
      setError('Failed to load keyword');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const token = await user.getIdToken();
      const keywordsArray = formData.keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const response = await fetch(`/api/keywords/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: 'Default description',
          category: 'General',
          price: 0,
          keywords: keywordsArray,
        }),
      });

      if (response.ok) {
        trackUpdateKeyword(formData.name, 'General');
        router.push('/keywords');
      } else {
        alert('Failed to update keyword');
      }
    } catch (error) {
      console.error('Error updating keyword:', error);
      alert('Failed to update keyword');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Keyword</h1>
        <p className="mt-2 text-gray-600">Update keyword information</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6 border border-gray-200">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Keyword Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="e.g., Wireless Bluetooth Headphones"
          />
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
            Keywords
          </label>
          <input
            type="text"
            id="keywords"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="e.g., wireless, bluetooth, noise-cancelling"
          />
          <p className="mt-1 text-sm text-gray-500">
            Separate keywords with commas
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/keywords')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Keyword'}
          </button>
        </div>
      </form>
    </div>
  );
}
