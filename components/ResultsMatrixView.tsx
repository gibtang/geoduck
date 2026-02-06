'use client';

import { useState } from 'react';

interface ResultsMatrixViewProps {
  results: any[];
  keywords: any[];
}

export default function ResultsMatrixView({ results, keywords }: ResultsMatrixViewProps) {
  const [viewMode, setViewMode] = useState<'llm' | 'keyword'>('llm');
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set());
  const [hiddenKeywordIds, setHiddenKeywordIds] = useState<Set<string>>(new Set());

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'llm' ? 'keyword' : 'llm');
  };

  // Toggle keyword expansion (context snippet)
  const toggleKeywordExpansion = (keywordId: string) => {
    setExpandedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(keywordId)) {
        next.delete(keywordId);
      } else {
        next.add(keywordId);
      }
      return next;
    });
  };

  // Toggle keyword visibility in results
  const toggleKeywordVisibility = (keywordId: string) => {
    setHiddenKeywordIds(prev => {
      const next = new Set(prev);
      if (next.has(keywordId)) {
        next.delete(keywordId);
      } else {
        next.add(keywordId);
      }
      return next;
    });
  };

  // View Mode 1: Group by LLM (default)
  if (viewMode === 'llm') {
    return (
      <div className="space-y-4">
        {/* View Toggle & Filter Controls */}
        <div className="flex justify-between items-center">
          <button
            onClick={toggleViewMode}
            className="text-indigo-600 text-sm hover:text-indigo-700 font-medium"
          >
            Switch to Keyword View →
          </button>
          <KeywordFilter
            keywords={keywords}
            hiddenKeywordIds={hiddenKeywordIds}
            onToggle={toggleKeywordVisibility}
          />
        </div>

        {/* LLM-grouped results */}
        {results.map((result, index) => (
          <LLMResultCard
            key={index}
            result={result}
            isPrimary={index === 0}
            hiddenKeywordIds={hiddenKeywordIds}
            expandedKeywords={expandedKeywords}
            onToggleKeyword={toggleKeywordExpansion}
          />
        ))}
      </div>
    );
  }

  // View Mode 2: Group by Keyword (matrix)
  return (
    <div className="space-y-4">
      {/* View Toggle & Filter Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={toggleViewMode}
          className="text-indigo-600 text-sm hover:text-indigo-700 font-medium"
        >
          ← Switch to LLM View
        </button>
        <KeywordFilter
          keywords={keywords}
          hiddenKeywordIds={hiddenKeywordIds}
          onToggle={toggleKeywordVisibility}
        />
      </div>

      {/* Keyword-grouped matrix */}
      <KeywordMatrixView
        results={results}
        keywords={keywords}
        hiddenKeywordIds={hiddenKeywordIds}
        expandedKeywords={expandedKeywords}
        onToggleKeyword={toggleKeywordExpansion}
      />
    </div>
  );
}

// Sub-component: Keyword filter checkboxes
function KeywordFilter({ keywords, hiddenKeywordIds, onToggle }: any) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs font-semibold text-gray-600">Filter:</span>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword: any) => (
          <label key={keyword._id} className="inline-flex items-center">
            <input
              type="checkbox"
              checked={!hiddenKeywordIds.has(keyword._id)}
              onChange={() => onToggle(keyword._id)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-1 text-xs text-gray-700">{keyword.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Sub-component: LLM result card
function LLMResultCard({ result, isPrimary, hiddenKeywordIds, expandedKeywords, onToggleKeyword }: any) {
  const visibleKeywords = result.keywordsMentioned?.filter(
    (km: any) => !hiddenKeywordIds.has(km.keywordId)
  ) || [];

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${
        isPrimary
          ? 'bg-indigo-50 border-indigo-500'
          : 'bg-orange-50 border-orange-400'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="font-semibold text-sm text-gray-900">
          {isPrimary ? '🎯 Primary Model' : '⚖️ Comparison'}: {result.model || result.llmModel}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(result.createdAt).toLocaleString()}
        </span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        {result.response}
      </p>

      {/* Keyword mentions with expandable context */}
      {visibleKeywords.length > 0 && (
        <div className="space-y-2">
          {visibleKeywords.map((mention: any) => (
            <div key={mention.keywordId}>
              {/* Keyword badge */}
              <button
                onClick={() => onToggleKeyword(mention.keywordId)}
                className={`inline-block px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  mention.sentiment === 'positive'
                    ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                    : mention.sentiment === 'negative'
                    ? 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {mention.keywordName}
                {expandedKeywords.has(mention.keywordId) ? ' ▲' : ' ▼'}
              </button>

              {/* Expandable context snippet */}
              {expandedKeywords.has(mention.keywordId) && (
                <div className="mt-2 p-2 bg-white rounded border border-gray-200 text-xs">
                  <p className="font-medium mb-1 text-gray-700">
                    Context (position {mention.position}):
                  </p>
                  <p className="italic text-gray-600">"...{mention.context}..."</p>
                  <p className="mt-1 text-gray-500">
                    Sentiment: <span className={`font-semibold ${
                      mention.sentiment === 'positive' ? 'text-green-700' :
                      mention.sentiment === 'negative' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>{mention.sentiment}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component: Keyword matrix view
function KeywordMatrixView({ results, keywords, hiddenKeywordIds, expandedKeywords, onToggleKeyword }: any) {
  const visibleKeywords = keywords.filter((k: any) => !hiddenKeywordIds.has(k._id));

  return (
    <div className="space-y-4">
      {visibleKeywords.map((keyword: any) => {
        const mentionsByModel = results
          .map((result: any) => ({
            model: result.model || result.llmModel,
            isPrimary: result === results[0],
            mention: result.keywordsMentioned?.find(
              (km: any) => km.keywordId === keyword._id
            )
          }))
          .filter((item: any) => item.mention);

        return (
          <div
            key={keyword._id}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <button
              onClick={() => onToggleKeyword(keyword._id)}
              className="w-full text-left"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm text-gray-900">
                  {keyword.name}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({mentionsByModel.length} {mentionsByModel.length === 1 ? 'model' : 'models'})
                  </span>
                </h4>
                <span className="text-indigo-600 text-xs">
                  {expandedKeywords.has(keyword._id) ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {expandedKeywords.has(keyword._id) && (
              <div className="mt-3 space-y-2">
                {mentionsByModel.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`p-2 rounded border-l-2 ${
                      item.mention.sentiment === 'positive'
                        ? 'bg-green-50 border-green-400'
                        : item.mention.sentiment === 'negative'
                        ? 'bg-red-50 border-red-400'
                        : 'bg-gray-50 border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {item.isPrimary ? '🎯 ' : '⚖️ '}{item.model}
                      </span>
                      <span className="text-xs text-gray-400">
                        pos: {item.mention.position}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 italic">
                      "...{item.mention.context}..."
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Sentiment: <span className={`font-semibold ${
                        item.mention.sentiment === 'positive' ? 'text-green-700' :
                        item.mention.sentiment === 'negative' ? 'text-red-700' :
                        'text-gray-700'
                      }`}>{item.mention.sentiment}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {visibleKeywords.length === 0 && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-sm text-gray-500">
          All keywords are filtered out. Select keywords above to view results.
        </div>
      )}
    </div>
  );
}
