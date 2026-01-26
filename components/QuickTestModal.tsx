'use client';

import React, { useState, useCallback } from 'react';
import { AVAILABLE_MODELS } from '@/lib/openrouter';

interface ProductMention {
  productId: string;
  productName: string;
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
}

interface ExecutionResult {
  _id: string;
  model: string;
  response: string;
  productsMentioned: ProductMention[];
  createdAt: string;
}

interface QuickTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (promptContent: string, model: string, compareModels: string[]) => Promise<ExecutionResult[]>;
  onSaveAsPrompt?: (title: string, content: string) => Promise<void>;
  lastSelectedModel: string;
}

export default function QuickTestModal({
  isOpen,
  onClose,
  onExecute,
  onSaveAsPrompt,
  lastSelectedModel,
}: QuickTestModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(lastSelectedModel);
  const [compareModels, setCompareModels] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptTitle, setSavePromptTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  const resetForm = useCallback(() => {
    setPrompt('');
    setSelectedModel(lastSelectedModel);
    setCompareModels([]);
    setResults([]);
    setError(null);
    setShowSavePrompt(false);
    setSavePromptTitle('');
  }, [lastSelectedModel]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showSavePrompt) {
          setShowSavePrompt(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showSavePrompt, resetForm]);

  const handleCompareModelToggle = (modelId: string) => {
    setCompareModels(prev =>
      prev.includes(modelId)
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    );
  };

  const handleExecute = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResults([]);

    try {
      const executionResults = await onExecute(prompt.trim(), selectedModel, compareModels);
      setResults(executionResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute prompt');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveAsPrompt = async () => {
    if (!savePromptTitle.trim()) {
      setError('Please enter a title for the prompt');
      return;
    }

    if (!onSaveAsPrompt) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSaveAsPrompt(savePromptTitle.trim(), prompt.trim());
      setShowSavePrompt(false);
      setSavePromptTitle('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Quick Test</h2>
              <p className="mt-1 text-sm text-gray-600">Test a custom prompt without saving it</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!showSavePrompt ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Configuration Panel */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  {/* Custom Prompt Input */}
                  <div>
                    <label htmlFor="quick-test-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Prompt
                    </label>
                    <textarea
                      id="quick-test-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                      maxLength={512}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Enter your test prompt..."
                      disabled={isExecuting}
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs ${prompt.length > 512 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {prompt.length}/512
                      </span>
                    </div>
                  </div>

                  {/* Primary Model Selection */}
                  <div>
                    <label htmlFor="primary-model" className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Model
                    </label>
                    <select
                      id="primary-model"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={isExecuting}
                    >
                      {AVAILABLE_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Comparison Models */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compare with Additional Models (Optional)
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {AVAILABLE_MODELS.filter(m => m.id !== selectedModel).map((model) => (
                        <label key={model.id} className="flex items-center text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={compareModels.includes(model.id)}
                            onChange={() => handleCompareModelToggle(model.id)}
                            className="mr-2"
                            disabled={isExecuting}
                          />
                          {model.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Execute Button */}
                  <button
                    onClick={handleExecute}
                    disabled={isExecuting || !prompt.trim()}
                    className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {isExecuting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Executing...
                      </span>
                    ) : (
                      '▶ Execute Prompt'
                    )}
                  </button>
                </div>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2">
                {results.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Enter a prompt and execute to see results.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Results</h3>
                      {results.length > 0 && onSaveAsPrompt && (
                        <button
                          onClick={() => setShowSavePrompt(true)}
                          className="text-sm px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                          Save as Prompt
                        </button>
                      )}
                    </div>
                    {results.map((result, index) => (
                      <div key={result._id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-base font-semibold text-gray-900">
                            {index === 0 && compareModels.length > 0 ? '🎯 ' : '⚖️ '}
                            {AVAILABLE_MODELS.find(m => m.id === result.model)?.name || result.model}
                            {index === 0 && compareModels.length > 0 ? ' (Primary)' : ' (Comparison)'}
                          </h4>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {result.response}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                          {result.productsMentioned.length > 0 ? (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                Products Mentioned ({result.productsMentioned.length}):
                              </p>
                              <div className="space-y-2">
                                {result.productsMentioned.map((mention, idx) => (
                                  <div key={idx} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{mention.productName}</p>
                                        <p className="text-xs text-gray-700 mt-1">
                                          Position: {mention.position}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1 italic">
                                          "{mention.context}"
                                        </p>
                                      </div>
                                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(mention.sentiment)}`}>
                                        {mention.sentiment}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">No products mentioned</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Save as Prompt Form */
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save as Prompt</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="save-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Title
                  </label>
                  <input
                    id="save-title"
                    type="text"
                    value={savePromptTitle}
                    onChange={(e) => setSavePromptTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter a title for this prompt..."
                    autoFocus
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Preview:</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{prompt}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSavePrompt(false)}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAsPrompt}
                    disabled={isSaving || !savePromptTitle.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Prompt'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
