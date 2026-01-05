import { NextRequest, NextResponse } from 'next/server';
import { findAreaDiscussion, createAreaDiscussion, generateAreaKey } from '@/lib/discussions';
import { AreaBounds } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const bounds: AreaBounds = body.bounds;

  if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
    return NextResponse.json({ error: 'Invalid bounds' }, { status: 400 });
  }

  // Check if a discussion for this area already exists
  let discussion = findAreaDiscussion(bounds);

  if (!discussion) {
    // Create a new discussion for this area
    discussion = createAreaDiscussion(bounds);
  }

  return NextResponse.json({
    discussion,
    discussion_key: discussion.discussion_key,
    is_new: !findAreaDiscussion(bounds)
  });
}
