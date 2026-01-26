// GET /api/evaluation/[id] - Get evaluation status and results
import { NextRequest, NextResponse } from 'next/server';
import { getJob, getEvaluation } from '../../../../backend/src/db/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Evaluation ID is required' },
        { status: 400 }
      );
    }

    // Get job status
    const job = await getJob(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    // If job is completed, fetch the evaluation
    let evaluation = null;
    if (job.status === 'completed' && job.result_id) {
      evaluation = await getEvaluation(job.result_id);
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress || 0,
      error: job.error || undefined,
      evaluation: evaluation || undefined,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      completedAt: job.completed_at,
    });

  } catch (error: any) {
    console.error('[API] Error fetching evaluation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}
