'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { trackUpdatePrompt } from '@/lib/ganalytics';

interface Prompt {
  _id: string;
  title: string;
  content: string;
}

interface EditPromptModalProps {
  isOpen: boolean;
  prompt: Prompt | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditPromptModal({ isOpen, prompt, onClose, onUpdate }: EditPromptModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt) {
      setFormData({
        title: prompt.title,
        content: prompt.content,
      });
      setError('');
    }
  }, [prompt]);

  // Handle body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`/api/prompts/${prompt._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': currentUser.uid,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        trackUpdatePrompt(formData.title);
        onUpdate();
        onClose();
      } else {
        setError('Failed to update prompt');
      }
    } catch (err: any) {
      console.error('Error updating prompt:', err);
      setError(err.message || 'Failed to update prompt');
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

  if (!isOpen || !prompt) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-20 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Edit Prompt</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="modal-title" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Title *
              </label>
              <input
                type="text"
                id="modal-title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="e.g., Top Toys for Christmas"
              />
            </div>

            <div>
              <label htmlFor="modal-content" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Content *
              </label>
              <textarea
                id="modal-content"
                name="content"
                required
                value={formData.content}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="What are the top toys to buy this holiday season? Include specific brands and features."
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Write your prompt as if you were a customer searching for products
                </p>
                <p className="text-xs text-gray-400">
                  {formData.content.length}/512
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </>
  );
}
