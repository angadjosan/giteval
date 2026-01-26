// POST /api/evaluate - Start repository evaluation
import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '../../../backend/src/db/supabase';
import { parseGitHubUrl } from '../../../backend/src/services/github';
import { AnalysisPipeline } from '../../../backend/src/pipeline/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, force = false } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    let owner: string;
    let repo: string;

    try {
      const parsed = parseGitHubUrl(url);
      owner = parsed.owner;
      repo = parsed.repo;
    } catch (error: any) {
      return NextResponse.json(
        { error: `Invalid GitHub URL: ${error.message}` },
        { status: 400 }
      );
    }

    // Create job
    const job = await createJob({
      type: 'repository',
      payload: { owner, repo, force },
      status: 'pending',
      progress: 0,
    });

    console.log(`[API] Created evaluation job ${job.id} for ${owner}/${repo}`);

    // Start pipeline execution asynchronously (don't await)
    const pipeline = new AnalysisPipeline();
    pipeline
      .executeOptimized(job)
      .then(() => {
        console.log(`[API] Pipeline completed for job ${job.id}`);
      })
      .catch((error) => {
        console.error(`[API] Pipeline failed for job ${job.id}:`, error);
      });

    // Return job ID immediately
    return NextResponse.json({
      evaluationId: job.id,
      cached: false,
      status: 'pending',
      redirectUrl: `/${owner}/${repo}`,
    });

  } catch (error: any) {
    console.error('[API] Error creating evaluation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start evaluation' },
      { status: 500 }
    );
  }
}
