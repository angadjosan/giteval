'use client';

import { useState } from 'react';
import { CategoryScore } from '../lib/types';
import { getScoreBackground, cn } from '../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CategoryBreakdownProps {
  categoryScores: CategoryScore[];
  className?: string;
}

export default function CategoryBreakdown({
  categoryScores,
  className,
}: CategoryBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-2xl font-bold text-gray-900">Score Breakdown</h3>

      {categoryScores.map((category) => {
        const percentage = (category.score / category.maxPoints) * 100;
        const isExpanded = expandedCategories.has(category.category);

        return (
          <div
            key={category.category}
            className="bg-white rounded-lg shadow-sm border p-4"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.category)}
              className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col items-start flex-1">
                  <span className="font-semibold text-lg">{category.category}</span>
                  <span className="text-sm text-gray-500">
                    {category.score.toFixed(1)} / {category.maxPoints} points
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {percentage.toFixed(0)}%
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400 ml-2" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 ml-2" />
              )}
            </button>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div
                className={cn(
                  'h-3 rounded-full transition-all duration-500',
                  getScoreBackground(percentage)
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Criteria Details */}
            {isExpanded && (
              <div className="mt-4 space-y-4 border-t pt-4">
                {category.criteria.map((criterion, idx) => {
                  const criterionPercentage =
                    (criterion.score / criterion.maxPoints) * 100;

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-gray-900">
                          {criterion.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {criterion.score}/{criterion.maxPoints} pts
                        </span>
                      </div>

                      {/* Criterion Progress Bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            getScoreBackground(criterionPercentage)
                          )}
                          style={{ width: `${criterionPercentage}%` }}
                        />
                      </div>

                      {/* Reasoning */}
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {criterion.reasoning}
                      </p>

                      {/* Evidence */}
                      {criterion.evidence && criterion.evidence.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-xs font-medium text-gray-600">
                            Evidence:
                          </span>
                          <ul className="text-xs text-gray-600 space-y-1 ml-4">
                            {criterion.evidence.map((item, evidenceIdx) => (
                              <li key={evidenceIdx} className="list-disc">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
