'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { trackCreatePrompt } from '@/lib/ganalytics';

export default function NewPromptPage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
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
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        trackCreatePrompt(formData.title, formData.category);
        router.push('/prompts');
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Create New Prompt</h1>
        <p className="mt-2 text-gray-600">Create a test prompt for GEO analysis</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6 border border-gray-200">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Top Toys for Christmas"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <input
            type="text"
            id="category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Product Discovery"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Content *
          </label>
          <textarea
            id="content"
            name="content"
            required
            value={formData.content}
            onChange={handleChange}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="What are the top toys to buy this holiday season? Include specific brands and features."
          />
          <p className="mt-1 text-sm text-gray-500">
            Write your prompt as if you were a customer searching for products
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/prompts')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Prompt'}
          </button>
        </div>
      </form>
    </div>
  );
}
