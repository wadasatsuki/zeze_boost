import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET - List all discussions (要認証)
export async function GET() {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ discussions: data });
  } catch (error) {
    console.error('Error loading discussions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Moderation actions (要認証)
export async function POST(request: Request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const body = await request.json();

    // Delete post
    if (body.action === 'delete_post') {
      const { discussionKey, postId } = body;

      if (!discussionKey || !postId) {
        return NextResponse.json({ error: 'discussionKey and postId are required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('discussion_key', discussionKey)
        .eq('post_id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    // Delete discussion
    if (body.action === 'delete_discussion') {
      const { discussionKey } = body;

      if (!discussionKey) {
        return NextResponse.json({ error: 'discussionKey is required' }, { status: 400 });
      }

      // Delete all posts first
      await supabase
        .from('posts')
        .delete()
        .eq('discussion_key', discussionKey);

      // Delete the discussion
      const { error } = await supabase
        .from('discussions')
        .delete()
        .eq('discussion_key', discussionKey);

      if (error) {
        console.error('Error deleting discussion:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    // Get discussion details
    if (body.action === 'get_discussion') {
      const { discussionKey } = body;

      if (!discussionKey) {
        return NextResponse.json({ error: 'discussionKey is required' }, { status: 400 });
      }

      const { data: discussion, error: discussionError } = await supabase
        .from('discussions')
        .select('*')
        .eq('discussion_key', discussionKey)
        .single();

      if (discussionError || !discussion) {
        return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
      }

      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('discussion_key', discussionKey)
        .order('created_at', { ascending: true });

      if (postsError) {
        console.error('Error loading posts:', postsError);
      }

      return NextResponse.json({
        discussion: {
          ...discussion,
          posts: posts || []
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing moderation request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
