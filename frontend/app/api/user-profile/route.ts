// POST /api/user-profile - Evaluate user profile (all repositories)
import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '../../../backend/src/db/supabase';
import { getUserRepositories } from '../../../backend/src/services/github';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Verify user exists and get repository count
    let repositories;
    try {
      repositories = await getUserRepositories(username);
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to fetch user repositories: ${error.message}` },
        { status: 404 }
      );
    }

    // Create job for user profile evaluation
    const job = await createJob({
      type: 'user_profile',
      payload: { username, repositories: repositories.map(r => r.name) },
      status: 'pending',
      progress: 0,
    });

    console.log(`[API] Created user profile job ${job.id} for ${username}`);

    // TODO: Implement user profile evaluation pipeline
    // For now, just return the job ID
    // In production, this would trigger a pipeline that evaluates all repos

    return NextResponse.json({
      profileId: job.id,
      repositoryCount: repositories.length,
      status: 'pending',
    });

  } catch (error: any) {
    console.error('[API] Error creating user profile evaluation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start user profile evaluation' },
      { status: 500 }
    );
  }
}
