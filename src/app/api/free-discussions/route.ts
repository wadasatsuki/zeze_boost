import { NextResponse } from 'next/server';
import { createFreeDiscussion } from '@/lib/discussions';

export async function POST(request: Request) {
  try {
    const { title } = await request.json();

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const discussion = createFreeDiscussion(title.trim());

    return NextResponse.json({
      discussion_key: discussion.discussion_key,
      title: discussion.title,
    });
  } catch (error) {
    console.error('Error creating free discussion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
