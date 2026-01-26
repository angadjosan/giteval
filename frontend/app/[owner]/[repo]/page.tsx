'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Evaluation } from '../../lib/types';
import ScoreDisplay from '../../components/ScoreDisplay';
import CategoryBreakdown from '../../components/CategoryBreakdown';
import ArchitectureDiagram from '../../components/ArchitectureDiagram';
import InsightsList from '../../components/InsightsList';
import MetricsVisualization from '../../components/MetricsVisualization';
import RepositoryMetadata from '../../components/RepositoryMetadata';
import SharePanel from '../../components/SharePanel';
import { Loader2, AlertCircle, Home } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    owner: string;
    repo: string;
  };
}

export default function RepositoryReportPage({ params }: PageProps) {
  const { owner, repo } = params;
  const searchParams = useSearchParams();
  const evaluationId = searchParams.get('evaluationId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (evaluationId) {
      // Poll for evaluation status
      pollEvaluationStatus(evaluationId);
    } else {
      // Try to fetch cached report
      fetchCachedReport();
    }
  }, [owner, repo, evaluationId]);

  const pollEvaluationStatus = async (jobId: string) => {
    const maxAttempts = 120; // 2 minutes max (120 * 1s)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/evaluation/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch evaluation status');
        }

        setProgress(data.progress || 0);

        if (data.status === 'completed' && data.evaluation) {
          setEvaluation(data.evaluation);
          setLoading(false);
          return;
        }

        if (data.status === 'failed') {
          throw new Error(data.error || 'Evaluation failed');
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          throw new Error('Evaluation timed out');
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    poll();
  };

  const fetchCachedReport = async () => {
    try {
      const response = await fetch(`/api/report/${owner}/${repo}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setEvaluation(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyzing Repository...
          </h2>
          <p className="text-gray-600 mb-4">
            This usually takes 30-60 seconds
          </p>
          <div className="w-64 mx-auto">
            <div className="bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{progress}% complete</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Report
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (!evaluation) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Report Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            No evaluation found for this repository. Would you like to start one?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Evaluate a Repository
          </Link>
        </div>
      </main>
    );
  }

  // Get category scores
  const categoryScores = evaluation.categoryScores || [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {owner}/{repo}
              </h1>
              <p className="text-gray-600">Repository Evaluation Report</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Score Display */}
        <section className="mb-12">
          <ScoreDisplay
            score={evaluation.overallScore}
            grade={evaluation.grade}
          />
        </section>

        {/* Summary */}
        {evaluation.summary && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {evaluation.summary}
              </p>
            </div>
          </section>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Category Breakdown */}
            <CategoryBreakdown categoryScores={categoryScores} />

            {/* Insights */}
            <InsightsList
              strengths={evaluation.strengths}
              improvements={evaluation.improvements}
              suggestions={evaluation.suggestions}
            />

            {/* Architecture Diagram */}
            {evaluation.architectureDiagram && (
              <ArchitectureDiagram diagram={evaluation.architectureDiagram} />
            )}

            {/* Metrics Visualization */}
            <MetricsVisualization metrics={evaluation.metrics} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Repository Metadata */}
            <RepositoryMetadata metadata={evaluation.metadata} />

            {/* Share Panel */}
            <SharePanel
              owner={owner}
              repo={repo}
              score={evaluation.overallScore}
              grade={evaluation.grade}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            Evaluated on{' '}
            {new Date(evaluation.evaluatedAt).toLocaleDateString()} at{' '}
            {new Date(evaluation.evaluatedAt).toLocaleTimeString()}
          </p>
          <p className="mt-2">&copy; 2026 GitEval. Powered by Claude AI.</p>
        </div>
      </footer>
    </main>
  );
}
