// GET /api/report/[owner]/[repo] - Get cached evaluation report
import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationByRepo } from '../../../../../backend/src/db/supabase';
import { getCommitSha } from '../../../../../backend/src/services/github';

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Owner and repository name are required' },
        { status: 400 }
      );
    }

    // Get latest commit SHA
    let commitSha: string;
    try {
      commitSha = await getCommitSha(owner, repo);
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to fetch repository: ${error.message}` },
        { status: 404 }
      );
    }

    // Get evaluation from database
    const evaluation = await getEvaluationByRepo(owner, repo, commitSha);

    if (!evaluation) {
      return NextResponse.json(
        { error: 'No evaluation found for this repository. Please run an evaluation first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error('[API] Error fetching report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
