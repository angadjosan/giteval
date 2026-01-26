// Utility functions for the frontend
import { clsx, type ClassValue } from 'clsx';
import { Grade } from './types';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Get color class for letter grade
 */
export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'A-':
    case 'B+':
      return 'text-green-500 bg-green-50 border-green-200';
    case 'B':
    case 'B-':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'C+':
    case 'C':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'C-':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'D':
    case 'F':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get color for score (0-100)
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-green-500';
  if (score >= 70) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get background color for score
 */
export function getScoreBackground(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-green-400';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  // Remove trailing slashes and .git
  const cleanUrl = url.trim().replace(/\.git$/, '').replace(/\/$/, '');

  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/i, // https://github.com/owner/repo
    /^([^\/]+)\/([^\/]+)$/,             // owner/repo
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
  }

  throw new Error('Invalid GitHub URL format. Please use: github.com/owner/repo');
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
