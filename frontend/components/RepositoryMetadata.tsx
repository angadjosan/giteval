'use client';

import { RepositoryMetadata } from '../lib/types';
import { formatNumber, formatRelativeTime, cn } from '../lib/utils';
import { Star, GitFork, Eye, AlertCircle, Calendar, Tag } from 'lucide-react';

interface RepositoryMetadataProps {
  metadata: RepositoryMetadata;
  className?: string;
}

export default function RepositoryMetadataComponent({
  metadata,
  className,
}: RepositoryMetadataProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border p-6', className)}>
      <h3 className="text-lg font-semibold mb-4">Repository Information</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Stars"
          value={formatNumber(metadata.stars)}
        />
        <StatCard
          icon={<GitFork className="w-5 h-5" />}
          label="Forks"
          value={formatNumber(metadata.forks)}
        />
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Watchers"
          value={formatNumber(metadata.watchers)}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Open Issues"
          value={formatNumber(metadata.openIssues)}
        />
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Calendar className="w-4 h-4" />
        <span>Last updated {formatRelativeTime(new Date(metadata.lastUpdated))}</span>
      </div>

      {/* Languages */}
      {metadata.languages.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Languages</div>
          <div className="flex flex-wrap gap-2">
            {metadata.languages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* License */}
      {metadata.license && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">License</div>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
            {metadata.license}
          </span>
        </div>
      )}

      {/* Topics */}
      {metadata.topics.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Topics
          </div>
          <div className="flex flex-wrap gap-2">
            {metadata.topics.map((topic) => (
              <span
                key={topic}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contributors */}
      {metadata.contributors.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Top Contributors
          </div>
          <div className="flex flex-wrap gap-3">
            {metadata.contributors.slice(0, 8).map((contributor) => (
              <div
                key={contributor.username}
                className="flex items-center gap-2"
                title={`${contributor.username} (${contributor.contributions} contributions)`}
              >
                <img
                  src={contributor.avatarUrl}
                  alt={contributor.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700">{contributor.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-600 mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}
