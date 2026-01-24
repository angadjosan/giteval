import { NextRequest, NextResponse } from 'next/server';

// GET /api/report/[owner]/[repo]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;

  // TODO: Implement get cached report
  // 1. Get latest commit SHA from GitHub
  // 2. Check cache for evaluation
  // 3. Return evaluation data or null

  return NextResponse.json(null);
}
