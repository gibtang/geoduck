'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function EditPromptPage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  // Fetch prompt data
  useEffect(() => {
    if (!user || !params.id) return;

    const fetchPrompt = async () => {
      try {
        setFetching(true);
        const token = await user.getIdToken();
        const response = await fetch(`/api/prompts/${params.id}`, {
          headers: {
            'x-firebase-uid': user.uid,
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const prompt = await response.json();
          setFormData({
            title: prompt.title,
            content: prompt.content,
          });
        } else if (response.status === 404) {
          setError('Prompt not found');
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

    fetchPrompt();
  }, [user, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !params.id) return;

    setLoading(true);
    setError('');

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
        router.push('/prompts');
      } else if (response.status === 404) {
        setError('Prompt not found');
      } else {
        setError('Failed to update prompt');
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      setError('Failed to update prompt');
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

  // Show loading spinner while auth is initializing or fetching prompt
  if (authLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.push('/prompts')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Back to Prompts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Prompt</h1>
        <p className="mt-2 text-gray-800">Update your test prompt for GEO analysis</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6 border border-gray-200">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

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
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Content *
          </label>
          <textarea
            id="content"
            name="content"
            required
            maxLength={512}
            value={formData.content}
            onChange={handleChange}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="What are the top toys to buy this holiday season? Include specific brands and features."
          />
          <div className="mt-1 flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Write your prompt as if you were a customer searching for products
            </p>
            <p className="text-sm text-gray-600">
              {formData.content.length}/512
            </p>
          </div>
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
