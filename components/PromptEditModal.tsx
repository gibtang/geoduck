'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Prompt {
  _id: string;
  title: string;
  content: string;
}

interface PromptEditModalProps {
  prompt: Prompt;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string }) => Promise<void>;
}

export default function PromptEditModal({
  prompt,
  isOpen,
  onClose,
  onSave,
}: PromptEditModalProps) {
  // Initialize state from prompt (remounts when prompt._id changes via key prop)
  const [title, setTitle] = useState(() => prompt.title);
  const [content, setContent] = useState(() => prompt.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(async () => {
    // Validation
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (content.length > 512) {
      setError('Content must be 512 characters or less');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({ title: title.trim(), content: content.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
      setIsSaving(false);
    }
  }, [title, content, onSave, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Enter to save (only when not in textarea)
      if (e.key === 'Enter' && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSave]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Prompt</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title Field */}
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter prompt title..."
              autoFocus
            />
          </div>

          {/* Content Field */}
          <div>
            <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              maxLength={512}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Enter prompt content..."
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Maximum 512 characters</span>
              <span className={`text-xs ${content.length > 512 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {content.length}/512
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel (Esc)
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes (Enter)'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
