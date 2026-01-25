'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackDeletePrompt } from '@/lib/ganalytics';
import { useAuth } from '@/components/AuthContext';

interface Prompt {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPrompts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPrompts = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/prompts', {
        headers: {
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    const promptToDelete = prompts.find(p => p._id === id);
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
        headers: {
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (promptToDelete) {
          trackDeletePrompt(promptToDelete.title);
        }
        setPrompts(prompts.filter((p) => p._id !== id));
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Prompts</h1>
          <p className="mt-2 text-gray-800">Create and manage test prompts</p>
        </div>
        <Link
          href="/prompts/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Prompt
        </Link>
      </div>

      {prompts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No prompts</h3>
          <p className="mt-1 text-sm text-gray-700">
            Get started by creating your first test prompt.
          </p>
          <div className="mt-6">
            <Link
              href="/prompts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Prompt
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {prompts.map((prompt) => (
            <div
              key={prompt._id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{prompt.title}</h3>
              </div>

              <p className="text-sm text-gray-800 mb-4 line-clamp-3">{prompt.content}</p>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Link
                  href={`/prompts/${prompt._id}/edit`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(prompt._id)}
                  className="text-red-700 hover:text-red-800 text-sm font-medium"
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
