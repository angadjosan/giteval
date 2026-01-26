'use client';

import { useState } from 'react';
import { cn } from '../lib/utils';
import { Share2, Copy, Check, Twitter, Linkedin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface SharePanelProps {
  owner: string;
  repo: string;
  score: number;
  grade: string;
  className?: string;
}

export default function SharePanel({
  owner,
  repo,
  score,
  grade,
  className,
}: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out my ${repo} repository evaluation: Score ${score}/100 (${grade}) on GitEval`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  // Generate badge markdown
  const badgeMarkdown = `[![GitEval Score](https://img.shields.io/badge/GitEval-${score}%2F100-${getBadgeColor(score)})](${shareUrl})`;

  const copyBadge = async () => {
    try {
      await navigator.clipboard.writeText(badgeMarkdown);
      toast.success('Badge code copied!');
    } catch (error) {
      toast.error('Failed to copy badge code');
    }
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Share Results</h3>
      </div>

      {/* Copy Link */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Share Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Social Share Buttons */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Share on Social Media
        </label>
        <div className="flex gap-2">
          <button
            onClick={shareOnTwitter}
            className="flex-1 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Twitter className="w-4 h-4" />
            Twitter
          </button>
          <button
            onClick={shareOnLinkedIn}
            className="flex-1 px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </button>
        </div>
      </div>

      {/* Badge Code */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          README Badge
        </label>
        <div className="bg-gray-50 border rounded-lg p-3 mb-2">
          <code className="text-xs font-mono break-all">{badgeMarkdown}</code>
        </div>
        <button
          onClick={copyBadge}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Badge Code
        </button>
      </div>

      {/* PDF Export (Future) */}
      <div className="pt-4 border-t">
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
          title="PDF export coming soon"
        >
          <FileText className="w-4 h-4" />
          Export as PDF (Coming Soon)
        </button>
      </div>
    </div>
  );
}

function getBadgeColor(score: number): string {
  if (score >= 90) return 'brightgreen';
  if (score >= 80) return 'green';
  if (score >= 70) return 'yellowgreen';
  if (score >= 60) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}
