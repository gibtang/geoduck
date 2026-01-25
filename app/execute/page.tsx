'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AVAILABLE_MODELS } from '@/lib/openrouter';
import { trackExecutePrompt, trackProductMentioned } from '@/lib/ganalytics';

interface Prompt {
  _id: string;
  title: string;
  content: string;
}

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

export default function ExecutePage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-exp:free');
  const [compareModels, setCompareModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [user, setUser] = useState<any>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchPrompts(user);
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
    }
  };

  const handleExecute = async () => {
    if (!user) return;

    const promptToUse = useCustomPrompt ? customPrompt : prompts.find(p => p._id === selectedPrompt)?.content;

    if (!promptToUse) {
      alert('Please select or create a prompt');
      return;
    }

    setExecuting(true);
    setResults([]);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promptId: useCustomPrompt ? null : selectedPrompt,
          promptContent: useCustomPrompt ? customPrompt : null,
          model: selectedModel,
          compareModels: compareModels.length > 0 ? compareModels : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);

        // Track execution event
        const promptCategory = useCustomPrompt ? 'custom' : prompts.find(p => p._id === selectedPrompt)?.title;
        trackExecutePrompt(
          AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
          promptCategory,
          compareModels.length + 1 // Include primary model in count
        );

        // Track product mentions
        data.results.forEach((result: ExecutionResult) => {
          result.productsMentioned.forEach((mention: ProductMention) => {
            trackProductMentioned(
              mention.productName,
              AVAILABLE_MODELS.find(m => m.id === result.model)?.name || result.model,
              mention.sentiment
            );
          });
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error executing prompt:', error);
      alert('Failed to execute prompt');
    } finally {
      setExecuting(false);
    }
  };

  const handleCompareModelToggle = (modelId: string) => {
    setCompareModels(prev =>
      prev.includes(modelId)
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    );
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Execute Prompt</h1>
        <p className="mt-2 text-gray-800">Run prompts against LLMs to test product visibility</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="radio"
                    checked={!useCustomPrompt}
                    onChange={() => setUseCustomPrompt(false)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Saved Prompt</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={useCustomPrompt}
                    onChange={() => setUseCustomPrompt(true)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Custom Prompt</span>
                </label>
              </div>

              {!useCustomPrompt ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Prompt
                  </label>
                  <select
                    value={selectedPrompt}
                    onChange={(e) => setSelectedPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    <option value="">Choose a prompt...</option>
                    {prompts.map((prompt) => (
                      <option key={prompt._id} value={prompt._id}>
                        {prompt.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Prompt
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your custom prompt..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare with Additional Models (Optional)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {AVAILABLE_MODELS.filter(m => m.id !== selectedModel).map((model) => (
                    <label key={model.id} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={compareModels.includes(model.id)}
                        onChange={() => handleCompareModelToggle(model.id)}
                        className="mr-2"
                      />
                      {model.name}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExecute}
                disabled={executing || (!useCustomPrompt && !selectedPrompt) || (useCustomPrompt && !customPrompt)}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executing ? 'Executing...' : 'Execute Prompt'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {results.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-12 text-center border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-500"
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
              <p className="mt-1 text-sm text-gray-700">
                Configure your prompt and model, then execute to see results.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Results</h2>
              {results.map((result) => (
                <div key={result._id} className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {AVAILABLE_MODELS.find(m => m.id === result.model)?.name || result.model}
                    </h3>
                    <span className="text-sm text-gray-700">
                      {new Date(result.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                      {result.response}
                    </div>
                  </div>

                  {result.productsMentioned.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Products Mentioned ({result.productsMentioned.length}):
                      </h4>
                      <div className="space-y-2">
                        {result.productsMentioned.map((mention, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{mention.productName}</p>
                                <p className="text-xs text-gray-700 mt-1">
                                  Position: {mention.position}
                                </p>
                                <p className="text-xs text-gray-800 mt-1 italic">
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
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        No products were mentioned in the response.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
