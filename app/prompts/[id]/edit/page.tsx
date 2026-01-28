'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useParams } from 'next/navigation';
import { trackUpdatePrompt } from '@/lib/ganalytics';

interface Prompt {
  _id: string;
  title: string;
  content: string;
}

export default function EditPromptPage() {
  const params = useParams();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
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
        fetchPrompt(user, params.id as string);
      }
    });

    return () => unsubscribe();
  }, [router, params.id]);

  const fetchPrompt = async (currentUser: any, id: string) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/prompts/${id}`, {
        headers: {
          'x-firebase-uid': currentUser.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: Prompt = await response.json();
        setFormData({
          title: data.title,
          content: data.content,
        });
        setError('');
      } else {
        setError('Failed to load prompt');
      }
    } catch (error) {
      console.error('Error fetching prompt:', error);
      setError('Failed to load prompt');
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

      const response = await fetch(`/api/prompts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        trackUpdatePrompt(formData.title);
        router.push('/prompts');
      } else {
        alert('Failed to update prompt');
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      alert('Failed to update prompt');
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Prompt</h1>
        <p className="mt-2 text-gray-600">Update prompt information</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="e.g., Top Toys for Christmas"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
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
            {loading ? 'Updating...' : 'Update Prompt'}
          </button>
        </div>
      </form>
    </div>
  );
}
