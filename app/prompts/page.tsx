'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { trackDeletePrompt } from '@/lib/ganalytics';
import EditPromptModal from '@/components/EditPromptModal';

interface Prompt {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface PromptExecutionState {
  comparisonModels: string[];
  isLoading: boolean;
  results: any;
  error: string;
  isExpanded: boolean;
}

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'meta-llama/llama-3.3-70b', name: 'Llama 3.3 70B' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [executionStates, setExecutionStates] = useState<Record<string, PromptExecutionState>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState<Prompt | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchPrompts(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPrompts = async (currentUser: any) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/prompts', {
        headers: {
          'x-firebase-uid': currentUser.uid,
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

  const handleEditClick = (prompt: Prompt) => {
    setPromptToEdit(prompt);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setPromptToEdit(null);
  };

  const handlePromptUpdated = () => {
    // Refresh prompts list after update
    if (user) {
      fetchPrompts(user);
    }
  };

  const handleDelete = async (id: string) => {
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

  const toggleModel = (promptId: string, modelId: string) => {
    setExecutionStates(prev => {
      const currentState = prev[promptId] || { comparisonModels: [], isLoading: false, results: null, error: '', isExpanded: false };
      const isSelected = currentState.comparisonModels.includes(modelId);

      return {
        ...prev,
        [promptId]: {
          ...currentState,
          comparisonModels: isSelected
            ? currentState.comparisonModels.filter(m => m !== modelId)
            : [...currentState.comparisonModels, modelId]
        }
      };
    });
  };

  const toggleExpand = (promptId: string) => {
    setExecutionStates(prev => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        isExpanded: !prev[promptId]?.isExpanded
      }
    }));
  };

  const handleExecute = async (promptId: string, promptTitle: string) => {
    const state = executionStates[promptId] || { comparisonModels: [], isLoading: false, results: null, error: '', isExpanded: false };

    setExecutionStates(prev => ({
      ...prev,
      [promptId]: {
        ...state,
        isLoading: true,
        error: '',
        results: null
      }
    }));

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.uid,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          promptId,
          llmModel: 'google/gemini-2.0-flash-exp:free',
          comparisonModels: state.comparisonModels,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute prompt');
      }

      const data = await response.json();

      setExecutionStates(prev => ({
        ...prev,
        [promptId]: {
          ...state,
          isLoading: false,
          results: data.results || [],
          isExpanded: true
        }
      }));

    } catch (err: any) {
      console.error('Error executing prompt:', err);
      setExecutionStates(prev => ({
        ...prev,
        [promptId]: {
          ...state,
          isLoading: false,
          error: err.message || 'Failed to execute prompt'
        }
      }));
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
          <p className="mt-2 text-gray-600">Create and manage test prompts</p>
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
            className="mx-auto h-12 w-12 text-gray-400"
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
          <p className="mt-1 text-sm text-gray-500">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => {
            const state = executionStates[prompt._id] || { comparisonModels: [], isLoading: false, results: null, error: '', isExpanded: false };

            return (
              <div
                key={prompt._id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">{prompt.title}</h3>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{prompt.content}</p>

                  {/* Character Counter */}
                  <p className="text-xs text-gray-500 mb-4">{prompt.content.length}/512</p>

                  {/* Model Comparison Section */}
                  <div className="mb-4">
                    <span className="block text-xs font-semibold text-gray-600 mb-2">
                      Compare with additional models:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_MODELS.map((model) => (
                        <div key={model.id} className="relative">
                          <input
                            type="checkbox"
                            id={`model-${prompt._id}-${model.id}`}
                            checked={state.comparisonModels.includes(model.id)}
                            onChange={() => toggleModel(prompt._id, model.id)}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`model-${prompt._id}-${model.id}`}
                            className={`inline-block px-3 py-1.5 text-xs font-medium rounded-full border-2 cursor-pointer transition-all ${
                              state.comparisonModels.includes(model.id)
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-indigo-400'
                            }`}
                          >
                            {model.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Execute Button */}
                  <button
                    onClick={() => handleExecute(prompt._id, prompt.title)}
                    disabled={state.isLoading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {state.isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Executing...
                      </>
                    ) : (
                      <>
                        <span>▶</span>
                        Execute with Gemini 2.0 Flash
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {state.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{state.error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 gap-2">
                    <button
                      onClick={() => handleEditClick(prompt)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prompt._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Results Section - Inline Expansion */}
                {state.results && !state.isLoading && (
                  <div className="border-t-2 border-gray-200">
                    <div
                      className="px-6 py-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleExpand(prompt._id)}
                    >
                      <h4 className="text-sm font-semibold text-gray-900">
                        Latest Results ({state.results.length})
                      </h4>
                      <button className="text-indigo-600 text-sm font-medium">
                        {state.isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                      </button>
                    </div>

                    {state.isExpanded && (
                      <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex flex-col gap-4">
                          {state.results.map((result: any, index: number) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-l-4 ${
                                index === 0
                                  ? 'bg-indigo-50 border-indigo-500'
                                  : 'bg-orange-50 border-orange-400'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className="font-semibold text-sm text-gray-900">
                                  {index === 0 ? '🎯 Primary Model' : '⚖️ Comparison'}: {result.llmModel}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(result.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-4">
                                {result.response}
                              </p>

                              {/* Keywords Mentioned */}
                              {result.keywordsMentioned && result.keywordsMentioned.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-2">
                                    Keywords Detected: {result.keywordsMentioned.length}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {result.keywordsMentioned.map((mention: any, idx: number) => (
                                      <span
                                        key={idx}
                                        className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                                          mention.sentiment === 'positive'
                                            ? 'bg-green-100 text-green-800 border border-green-300'
                                            : mention.sentiment === 'negative'
                                            ? 'bg-red-100 text-red-800 border border-red-300'
                                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                                        }`}
                                      >
                                        {mention.keyword?.name || 'Unknown'}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Prompt Modal */}
      <EditPromptModal
        isOpen={isEditModalOpen}
        prompt={promptToEdit}
        onClose={handleCloseEditModal}
        onUpdate={handlePromptUpdated}
      />
    </div>
  );
}
