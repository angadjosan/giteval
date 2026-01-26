'use client';

import { Suggestion } from '../lib/types';
import { cn } from '../lib/utils';
import { CheckCircle2, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';

interface InsightsListProps {
  strengths: string[];
  improvements: string[];
  suggestions: Suggestion[];
  className?: string;
}

export default function InsightsList({
  strengths,
  improvements,
  suggestions,
  className,
}: InsightsListProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Strengths */}
      {strengths.length > 0 && (
        <section className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-green-900">Key Strengths</h3>
          </div>
          <ul className="space-y-2">
            {strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-3 text-green-800">
                <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Areas for Improvement */}
      {improvements.length > 0 && (
        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-bold text-yellow-900">
              Areas for Improvement
            </h3>
          </div>
          <ul className="space-y-2">
            {improvements.map((improvement, idx) => (
              <li key={idx} className="flex items-start gap-3 text-yellow-800">
                <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Actionable Suggestions */}
      {suggestions.length > 0 && (
        <section className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">
              Actionable Suggestions
            </h3>
          </div>

          <div className="space-y-4">
            {suggestions
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .map((suggestion, idx) => (
                <SuggestionCard key={idx} suggestion={suggestion} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const priorityConfig = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-600 text-white',
      text: 'text-red-900',
    },
    medium: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-600 text-white',
      text: 'text-orange-900',
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-600 text-white',
      text: 'text-blue-900',
    },
  };

  const config = priorityConfig[suggestion.priority];

  return (
    <div className={cn('border rounded-lg p-4', config.bg, config.border)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs px-2 py-1 rounded font-medium', config.badge)}>
              {suggestion.priority.toUpperCase()}
            </span>
            <span className="text-xs text-gray-600">{suggestion.category}</span>
          </div>
          <h4 className={cn('font-semibold text-lg', config.text)}>
            {suggestion.title}
          </h4>
        </div>
        {suggestion.expectedImpact > 0 && (
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold text-gray-900">
              +{suggestion.expectedImpact}
            </div>
            <div className="text-xs text-gray-600">points</div>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-3">{suggestion.description}</p>

      {/* Specific Examples */}
      {suggestion.specificExamples && suggestion.specificExamples.length > 0 && (
        <div className="mt-3 bg-white/50 rounded p-3">
          <span className="text-xs font-medium text-gray-600 mb-2 block">
            Examples:
          </span>
          <ul className="space-y-1">
            {suggestion.specificExamples.map((example, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
