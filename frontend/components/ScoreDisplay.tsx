'use client';

import { Grade } from '../lib/types';
import { getGradeColor, getScoreColor, cn } from '../lib/utils';

interface ScoreDisplayProps {
  score: number;
  grade: Grade;
  className?: string;
}

export default function ScoreDisplay({ score, grade, className }: ScoreDisplayProps) {
  const percentage = (score / 100) * 100;

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* Main Score Circle */}
      <div className="relative">
        {/* Background Circle */}
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress Circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
            className={cn('transition-all duration-1000', getScoreColor(score))}
            strokeLinecap="round"
          />
        </svg>

        {/* Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn('text-5xl font-bold', getScoreColor(score))}>
            {score.toFixed(1)}
          </div>
          <div className="text-gray-500 text-sm">out of 100</div>
        </div>
      </div>

      {/* Grade Badge */}
      <div
        className={cn(
          'px-6 py-3 rounded-full border-2 text-2xl font-bold',
          getGradeColor(grade)
        )}
      >
        {grade}
      </div>

      {/* Score Description */}
      <p className="text-gray-600 text-center max-w-md">
        {getScoreDescription(score)}
      </p>
    </div>
  );
}

function getScoreDescription(score: number): string {
  if (score >= 90) return 'Exceptional repository with outstanding code quality and product value.';
  if (score >= 80) return 'Excellent repository with strong code quality and clear value proposition.';
  if (score >= 70) return 'Good repository with solid fundamentals and room for improvement.';
  if (score >= 60) return 'Decent repository with some strengths but notable areas for improvement.';
  if (score >= 50) return 'Fair repository that would benefit from significant improvements.';
  return 'Repository needs substantial work to meet quality standards.';
}
