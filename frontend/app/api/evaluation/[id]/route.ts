import { NextRequest, NextResponse } from 'next/server';

// GET /api/evaluation/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: Implement get evaluation status
  // 1. Query database for evaluation by ID
  // 2. Return status and evaluation data if completed

  return NextResponse.json({
    id,
    status: 'pending',
    progress: 0,
  });
}
