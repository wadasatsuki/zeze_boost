import { NextResponse } from 'next/server';
import { getAllDiscussions, getDiscussion, deleteDiscussion, deletePost } from '@/lib/discussions';

// GET - List all discussions
export async function GET() {
  try {
    const discussions = getAllDiscussions();
    return NextResponse.json({ discussions });
  } catch (error) {
    console.error('Error loading discussions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Moderation actions
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get discussion details
    if (body.action === 'get_discussion') {
      const { discussionKey } = body;

      if (!discussionKey) {
        return NextResponse.json({ error: 'Discussion key is required' }, { status: 400 });
      }

      const discussion = getDiscussion(discussionKey);

      if (!discussion) {
        return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
      }

      return NextResponse.json({ discussion });
    }

    // Delete discussion
    if (body.action === 'delete_discussion') {
      const { discussionKey } = body;

      if (!discussionKey) {
        return NextResponse.json({ error: 'Discussion key is required' }, { status: 400 });
      }

      const deleted = deleteDiscussion(discussionKey);

      if (!deleted) {
        return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    // Delete post
    if (body.action === 'delete_post') {
      const { discussionKey, postId } = body;

      if (!discussionKey || !postId) {
        return NextResponse.json({ error: 'Discussion key and post ID are required' }, { status: 400 });
      }

      const deleted = deletePost(discussionKey, postId);

      if (!deleted) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing moderation request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
