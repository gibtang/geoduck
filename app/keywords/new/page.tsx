'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { trackCreateKeyword } from '@/lib/ganalytics';

export default function NewKeywordPage() {
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/signin');
      } else {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

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

      const response = await fetch('/api/keywords', {
        method: 'POST',
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
        trackCreateKeyword(formData.name, 'General');
        router.push('/keywords');
      }
    } catch (error) {
      console.error('Error creating keyword:', error);
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Keyword</h1>
        <p className="mt-2 text-gray-600">Add a keyword to your catalog</p>
      </div>

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
            {loading ? 'Creating...' : 'Create Keyword'}
          </button>
        </div>
      </form>
    </div>
  );
}
