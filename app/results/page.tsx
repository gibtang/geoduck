'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AVAILABLE_MODELS } from '@/lib/openrouter';

interface ProductMention {
  product: {
    _id: string;
    name: string;
  };
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
}

interface Result {
  _id: string;
  prompt?: {
    _id: string;
    title: string;
  };
  model: string;
  response: string;
  productsMentioned: ProductMention[];
  createdAt: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchResults(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchResults = async (currentUser: any) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/results', {
        headers: {
          'x-firebase-uid': currentUser.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      default:
        return '😐';
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Results History</h1>
        <p className="mt-2 text-gray-600">View your past prompt executions and analysis</p>
      </div>

      {results.length === 0 ? (
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Execute some prompts to see results here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setExpandedResult(expandedResult === result._id ? null : result._id)
                }
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.prompt?.title || 'Custom Prompt'}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {AVAILABLE_MODELS.find((m) => m.id === result.model)?.name || result.model}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(result.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {result.productsMentioned.length} {result.productsMentioned.length === 1 ? 'Product' : 'Products'}
                      </p>
                      <p className="text-xs text-gray-500">Mentioned</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedResult === result._id ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {expandedResult === result._id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">AI Response:</h4>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                      {result.response}
                    </div>
                  </div>

                  {result.productsMentioned.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Products Detected:
                      </h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        {result.productsMentioned.map((mention, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-4 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-gray-900">
                                {mention.product.name}
                              </h5>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(
                                  mention.sentiment
                                )}`}
                              >
                                {getSentimentIcon(mention.sentiment)} {mention.sentiment}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              Position: {mention.position}
                            </p>
                            <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                              "{mention.context}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        No keywords were mentioned in this response.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
