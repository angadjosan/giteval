'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, User, GitFork } from 'lucide-react';

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function UserProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const [isComingSoon] = useState(true);

  if (isComingSoon) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <User className="w-20 h-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            User Profile Evaluation
          </h1>
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
            <GitFork className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-gray-600 mb-4">
              Profile evaluation for <strong>{username}</strong> is not yet available.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              User profile evaluations will aggregate scores across all public repositories,
              identify skill specializations, and provide comprehensive developer insights.
            </p>

            {/* Features Preview */}
            <div className="text-left space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-gray-900">Overall Profile Score:</strong>
                  <p className="text-gray-600 text-sm">
                    Aggregated evaluation across all repositories
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-gray-900">Skill Specializations:</strong>
                  <p className="text-gray-600 text-sm">
                    Frontend, backend, DevOps, data science, etc.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-gray-900">Consistency Metrics:</strong>
                  <p className="text-gray-600 text-sm">
                    Quality consistency across projects
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-gray-900">Portfolio Showcase:</strong>
                  <p className="text-gray-600 text-sm">
                    Highlights of best repositories and contributions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Evaluate a Repository
            </Link>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <GitFork className="w-4 h-4" />
              View on GitHub
            </a>
          </div>

          {/* Note */}
          <p className="mt-8 text-sm text-gray-500">
            Want to be notified when profile evaluations launch?{' '}
            <a href="mailto:feedback@giteval.com" className="text-blue-600 hover:underline">
              Get in touch
            </a>
          </p>
        </div>
      </main>
    );
  }

  // TODO: Implement actual user profile evaluation when ready
  return null;
}
