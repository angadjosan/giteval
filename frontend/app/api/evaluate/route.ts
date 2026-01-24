import { NextRequest, NextResponse } from 'next/server';

// POST /api/evaluate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, force } = body;

    // TODO: Implement evaluation logic
    // 1. Parse GitHub URL
    // 2. Check cache
    // 3. Create job
    // 4. Return job ID and redirect URL

    return NextResponse.json({
      evaluationId: 'todo',
      cached: false,
      status: 'pending',
      redirectUrl: '/owner/repo',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start evaluation' },
      { status: 500 }
    );
  }
}
