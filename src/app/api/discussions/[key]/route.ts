import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const supabase = supabaseAdmin();

    // Get discussion
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select('*')
      .eq('discussion_key', key)
      .single();

    if (discussionError || !discussion) {
      return NextResponse.json({ discussion: null });
    }

    // Get posts for this discussion
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('discussion_key', key)
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
  } catch (error) {
    console.error('Error loading discussion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();
    const supabase = supabaseAdmin();

    // Add post to discussion
    if (body.action === 'post') {
      const content = body.content;
      const imageUrl = body.imageUrl && typeof body.imageUrl === 'string' ? body.imageUrl : null;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
      }

      // Check if discussion exists
      const { data: discussion } = await supabase
        .from('discussions')
        .select('discussion_key')
        .eq('discussion_key', key)
        .single();

      if (!discussion) {
        return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
      }

      // Insert post
      const postId = `post_${Date.now()}`;
      const { data: post, error } = await supabase
        .from('posts')
        .insert([{
          post_id: postId,
          discussion_key: key,
          content: content.trim(),
          image_url: imageUrl,
          is_auto_generated: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
      }

      return NextResponse.json({ post });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
