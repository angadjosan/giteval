'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseGitHubUrl, cn } from '../lib/utils';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EvaluationForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    setLoading(true);

    try {
      // Parse and validate URL
      const { owner, repo } = parseGitHubUrl(url);

      // Start evaluation
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.giteval.com/api';
      const response = await fetch(`${apiUrl}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start evaluation');
      }

      // Show success toast
      toast.success('Evaluation started! Redirecting...');

      // Redirect to report page
      router.push(`/${owner}/${repo}?evaluationId=${data.evaluationId}`);

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              placeholder="github.com/owner/repository"
              className={cn(
                'w-full px-6 py-4 pr-12 text-lg rounded-lg border-2 focus:outline-none focus:ring-2',
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              )}
              disabled={loading}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className={cn(
            'w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all',
            loading || !url.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Evaluating...
            </span>
          ) : (
            'Evaluate Repository'
          )}
        </button>

        {/* Examples */}
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">Try an example:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'facebook/react',
              'vercel/next.js',
              'microsoft/vscode',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setUrl(`https://github.com/${example}`)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. We analyze your repository code, structure, and documentation</li>
          <li>2. AI evaluates code quality and product value</li>
          <li>3. Get a comprehensive report with actionable insights</li>
          <li>4. Share your results with a permanent link</li>
        </ul>
      </div>
    </div>
  );
}
