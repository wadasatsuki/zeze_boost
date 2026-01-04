import { NextRequest, NextResponse } from 'next/server';
import { getDiscussion, createDiscussion, addPost } from '@/lib/discussions';
import { loadDataCards } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const discussion = getDiscussion(key);

  if (!discussion) {
    return NextResponse.json({ discussion: null });
  }

  return NextResponse.json({ discussion });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const body = await request.json();

  if (body.action === 'create') {
    const cards = loadDataCards();
    const card = cards.find((c) => c.discussion_key === key);

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const discussion = createDiscussion(card);
    return NextResponse.json({ discussion });
  }

  if (body.action === 'post') {
    const post = addPost(key, body.content);

    if (!post) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
