'use client';

import { Metrics } from '../lib/types';
import { cn, formatNumber } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface MetricsVisualizationProps {
  metrics: Metrics;
  className?: string;
}

export default function MetricsVisualization({
  metrics,
  className,
}: MetricsVisualizationProps) {
  // Prepare language distribution data
  const languageData = Object.entries(metrics.languages).map(([name, bytes]) => ({
    name,
    value: bytes,
  }));

  // Calculate total bytes for percentage
  const totalBytes = languageData.reduce((sum, lang) => sum + lang.value, 0);

  // Prepare complexity distribution data
  const complexityData = Object.entries(metrics.complexity.distribution).map(
    ([level, count]) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count,
    })
  );

  // Color schemes
  const LANGUAGE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const COMPLEXITY_COLORS = {
    Simple: '#10b981',
    Moderate: '#f59e0b',
    Complex: '#ef4444',
  };

  return (
    <div className={cn('space-y-6', className)}>
      <h3 className="text-2xl font-bold text-gray-900">Code Metrics</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Lines"
          value={formatNumber(metrics.totalLines)}
          sublabel="of code"
        />
        <MetricCard
          label="Total Files"
          value={formatNumber(metrics.totalFiles)}
          sublabel="in repository"
        />
        <MetricCard
          label="Test Files"
          value={formatNumber(metrics.testFiles)}
          sublabel="test coverage"
        />
        <MetricCard
          label="Test Coverage"
          value={`${metrics.testCoverage || 0}%`}
          sublabel="estimated"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Language Distribution */}
        {languageData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="font-semibold text-lg mb-4">Language Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => {
                    const percentage = ((value / totalBytes) * 100).toFixed(1);
                    return `${name} (${percentage}%)`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {languageData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={LANGUAGE_COLORS[index % LANGUAGE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => {
                    const percentage = ((value / totalBytes) * 100).toFixed(1);
                    return [`${formatNumber(value)} bytes (${percentage}%)`, 'Size'];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Complexity Distribution */}
        {complexityData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="font-semibold text-lg mb-4">Complexity Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={complexityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6">
                  {complexityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COMPLEXITY_COLORS[entry.level as keyof typeof COMPLEXITY_COLORS] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Complexity Stats */}
      {metrics.complexity && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="font-semibold text-lg mb-4">Complexity Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Average Complexity</div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.complexity.average.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Maximum Complexity</div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.complexity.max}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dependencies */}
      {metrics.dependencies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="font-semibold text-lg mb-4">
            Dependencies ({metrics.dependencies.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {metrics.dependencies.slice(0, 20).map((dep, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
              >
                <span className="font-mono text-sm">{dep.name}</span>
                <span className="text-xs text-gray-600">{dep.version}</span>
              </div>
            ))}
            {metrics.dependencies.length > 20 && (
              <div className="text-sm text-gray-500 text-center py-2">
                + {metrics.dependencies.length - 20} more dependencies
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sublabel}</div>
    </div>
  );
}
