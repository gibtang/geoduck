'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackDeletePrompt } from '@/lib/ganalytics';
import { useAuth } from '@/components/AuthContext';
import { AVAILABLE_MODELS } from '@/lib/openrouter';
import PromptEditModal from '@/components/PromptEditModal';

interface Prompt {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ExecutionResult {
  _id: string;
  model: string;
  response: string;
  productsMentioned: Array<{
    productId: string;
    productName: string;
    position: number;
    sentiment: string;
    context: string;
  }>;
  createdAt: string;
}

interface ExecutionHistory {
  [promptId: string]: ExecutionResult[];
}

interface ExpandedCards {
  [promptId: string]: boolean;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Inline expansion state
  const [selectedModels, setSelectedModels] = useState<{ [promptId: string]: string[] }>({});
  const [isExecuting, setIsExecuting] = useState<{ [promptId: string]: boolean }>({});
  const [currentExecutingModel, setCurrentExecutingModel] = useState<{ [promptId: string]: string }>({});
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory>({});
  const [lastSelectedModel, setLastSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [expandedCards, setExpandedCards] = useState<ExpandedCards>({});

  // Inline editing state
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Load last selected model and execution history from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem('lastSelectedModel');
    if (savedModel) {
      setLastSelectedModel(savedModel);
    }

    const savedHistory = localStorage.getItem('executionHistory');
    if (savedHistory) {
      try {
        setExecutionHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing execution history:', e);
      }
    }

    const savedExpanded = localStorage.getItem('expandedCards');
    if (savedExpanded) {
      try {
        setExpandedCards(JSON.parse(savedExpanded));
      } catch (e) {
        console.error('Error parsing expanded cards:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (Object.keys(executionHistory).length > 0) {
      localStorage.setItem('executionHistory', JSON.stringify(executionHistory));
    }
  }, [executionHistory]);

  useEffect(() => {
    localStorage.setItem('expandedCards', JSON.stringify(expandedCards));
  }, [expandedCards]);

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

        // Remove execution history for this prompt
        const newHistory = { ...executionHistory };
        delete newHistory[id];
        setExecutionHistory(newHistory);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt);
  };

  const closeEditModal = () => {
    setEditingPrompt(null);
  };

  const handleSaveEdit = async (data: { title: string; content: string }) => {
    if (!user || !editingPrompt) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/prompts/${editingPrompt._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedPrompt = await response.json();
        // Optimistic update
        setPrompts(prompts.map(p =>
          p._id === updatedPrompt._id ? updatedPrompt : p
        ));
      } else {
        throw new Error('Failed to save prompt');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      throw error;
    }
  };

  const toggleExpand = (promptId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [promptId]: !prev[promptId],
    }));
  };

  const toggleModelComparison = (promptId: string, modelId: string) => {
    setSelectedModels(prev => {
      const promptModels = prev[promptId] || [];
      return {
        ...prev,
        [promptId]: promptModels.includes(modelId)
          ? promptModels.filter(id => id !== modelId)
          : [...promptModels, modelId],
      };
    });
  };

  const handleExecute = async (promptId: string) => {
    if (!user) return;

    setIsExecuting(prev => ({ ...prev, [promptId]: true }));

    try {
      const token = await user.getIdToken();

      // Save selected model as last used
      localStorage.setItem('lastSelectedModel', lastSelectedModel);

      const comparisonModels = selectedModels[promptId] || [];
      const allModels = [lastSelectedModel, ...comparisonModels];

      // Execute models in parallel with staggered rate limiting
      const executeModel = async (modelId: string, index: number) => {
        // Add staggered delay to avoid rate limiting (500ms between each request)
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, index * 500));
        }

        // Update current executing model for UI feedback
        setCurrentExecutingModel(prev => ({ ...prev, [promptId]: modelId }));

        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-firebase-uid': user.uid,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            promptId,
            model: modelId,
            compareModels: [], // Execute one model at a time
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to execute model ${modelId}`);
        }

        const data = await response.json();
        return data.results;
      };

      // Execute all models in parallel (with staggered delays inside executeModel)
      const resultsArray = await Promise.all(
        allModels.map((modelId, index) => executeModel(modelId, index))
      );

      // Flatten results array
      const allResults = resultsArray.flat();

      // Update execution history (keep last 3 per prompt)
      setExecutionHistory(prev => {
        const promptHistory = prev[promptId] || [];
        const updatedHistory = [...allResults, ...promptHistory].slice(0, 3);
        return {
          ...prev,
          [promptId]: updatedHistory,
        };
      });

      // Auto-expand the card to show results
      setExpandedCards(prev => ({ ...prev, [promptId]: true }));
    } catch (error) {
      console.error('Error executing prompt:', error);
    } finally {
      setIsExecuting(prev => ({ ...prev, [promptId]: false }));
      setCurrentExecutingModel(prev => ({ ...prev, [promptId]: '' }));
    }
  };

  const getModelName = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getExecutionCount = (promptId: string) => {
    return executionHistory[promptId]?.length || 0;
  };

  const getLastExecutionTime = (promptId: string) => {
    const history = executionHistory[promptId];
    if (!history || history.length === 0) return null;
    return formatTimestamp(history[0].createdAt);
  };

  const getPromptResults = (promptId: string) => {
    return executionHistory[promptId] || [];
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
          {prompts.map((prompt) => {
            const isExpanded = expandedCards[prompt._id];
            const results = getPromptResults(prompt._id);
            const promptSelectedModels = selectedModels[prompt._id] || [];
            const isPromptExecuting = isExecuting[prompt._id] || false;

            return (
              <div
                key={prompt._id}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                      onDoubleClick={() => openEditModal(prompt)}
                      title="Double-click to edit"
                    >
                      {prompt.title}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(prompt);
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(prompt._id);
                        }}
                        className="text-gray-600 hover:text-red-700 text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p
                    className="text-sm text-gray-800 mb-4 line-clamp-3 cursor-pointer hover:text-indigo-600 transition-colors"
                    onDoubleClick={() => openEditModal(prompt)}
                    title="Double-click to edit"
                  >
                    {prompt.content}
                  </p>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-gray-600">{prompt.content.length}/512</p>
                    <p className="text-xs text-gray-700">Write your prompt as if you were a customer searching for products</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Compare with additional models:</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_MODELS.filter(m => m.id !== lastSelectedModel).map((model) => (
                        <div key={model.id} className="relative">
                          <input
                            type="checkbox"
                            id={`compare-${prompt._id}-${model.id}`}
                            checked={promptSelectedModels.includes(model.id)}
                            onChange={() => toggleModelComparison(prompt._id, model.id)}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`compare-${prompt._id}-${model.id}`}
                            className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border-2 ${
                              promptSelectedModels.includes(model.id)
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-indigo-400'
                            }`}
                          >
                            {model.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecute(prompt._id)}
                    disabled={isPromptExecuting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isPromptExecuting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Executing using {getModelName(currentExecutingModel[prompt._id] || lastSelectedModel)}
                      </span>
                    ) : (
                      <span>▶ Execute with {getModelName(lastSelectedModel)}</span>
                    )}
                  </button>

                  {getExecutionCount(prompt._id) > 0 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(Math.min(getExecutionCount(prompt._id), 3))].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-green-500"></div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          {getExecutionCount(prompt._id)} execution{getExecutionCount(prompt._id) > 1 ? 's' : ''} (last: {getLastExecutionTime(prompt._id)})
                        </span>
                      </div>
                      {results.length > 0 && (
                        <button
                          onClick={() => toggleExpand(prompt._id)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && results.length > 0 && (
                  <div className="border-t-2 border-gray-200 bg-gray-50 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-gray-900">Latest Results</h4>
                      <button
                        onClick={() => toggleExpand(prompt._id)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Collapse ▲
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      {results.map((result, index) => (
                        <div
                          key={result._id}
                          className={`bg-white rounded-lg p-4 border-l-4 ${
                            index === 0 && promptSelectedModels.length > 0 ? 'border-orange-400' : 'border-indigo-600'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900 text-sm">
                              {index === 0 && promptSelectedModels.length > 0 ? '🎯 ' : '⚖️ '}
                              {getModelName(result.model)}
                              {index === 0 && promptSelectedModels.length > 0 ? ' (Primary)' : ' (Comparison)'}
                            </span>
                            <span className="text-xs text-gray-500">{formatTimestamp(result.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed mb-2">{result.response}</p>
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            {result.productsMentioned.length > 0 ? (
                              <>
                                <p className="text-xs font-semibold text-gray-700 mb-1.5">
                                  Products Mentioned: {result.productsMentioned.length}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {result.productsMentioned.map((product, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-indigo-50 px-2 py-1 rounded text-xs font-medium text-indigo-600 border border-gray-200"
                                    >
                                      {product.productName}
                                    </span>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No products mentioned</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {results.length > 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <p className="text-xs text-gray-600 font-medium mb-3">Previous Executions</p>
                        <div className="flex flex-col gap-2">
                          {results.slice(1).map((result, index) => (
                            <div key={result._id} className="bg-gray-100 p-3 rounded-lg text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-gray-800">{getModelName(result.model)}</span>
                                <span className="text-gray-500">{formatTimestamp(result.createdAt)}</span>
                              </div>
                              <p className="text-gray-600 line-clamp-2">{result.response}</p>
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

      {editingPrompt && (
        <PromptEditModal
          key={editingPrompt._id}
          prompt={editingPrompt}
          isOpen={!!editingPrompt}
          onClose={closeEditModal}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}