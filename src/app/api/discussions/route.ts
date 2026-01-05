import { NextResponse } from 'next/server';
import { loadDiscussions } from '@/lib/discussions';

export async function GET() {
  const discussions = loadDiscussions();

  // Convert to array and sort by created_at (newest first)
  const discussionList = Object.values(discussions).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ discussions: discussionList });
}
