import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AreaBounds } from '@/lib/types';

export const runtime = 'nodejs';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Generate a discussion key from area bounds
function generateAreaKey(bounds: AreaBounds): string {
  const n = bounds.north.toFixed(4);
  const s = bounds.south.toFixed(4);
  const e = bounds.east.toFixed(4);
  const w = bounds.west.toFixed(4);
  return `area_${n}_${s}_${e}_${w}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bounds: AreaBounds = body.bounds;
    const name: string | undefined = body.name;

    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return NextResponse.json({ error: 'Invalid bounds' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const discussionKey = generateAreaKey(bounds);

    // Check if discussion already exists
    const { data: existing } = await supabase
      .from('discussions')
      .select('*')
      .eq('discussion_key', discussionKey)
      .single();

    if (existing) {
      // Get posts for existing discussion
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('discussion_key', discussionKey)
        .order('created_at', { ascending: true });

      return NextResponse.json({
        discussion: { ...existing, posts: posts || [] },
        discussion_key: existing.discussion_key,
        is_new: false
      });
    }

    // Create new discussion
    const centerLat = ((bounds.north + bounds.south) / 2).toFixed(4);
    const centerLng = ((bounds.east + bounds.west) / 2).toFixed(4);
    const areaTitle = name || `${centerLat}, ${centerLng}`;
    const title = `${areaTitle}に何があるといい？`;

    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .insert([{
        discussion_key: discussionKey,
        title,
        created_at: new Date().toISOString(),
        area_bounds: bounds
      }])
      .select()
      .single();

    if (discussionError) {
      console.error('Error creating discussion:', discussionError);
      return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 });
    }

    // Create auto-generated first post
    const locationInfo = name ? `${name}（${centerLat}, ${centerLng} 周辺）` : `${centerLat}, ${centerLng} 周辺`;
    const autoPostContent = `📍 **${locationInfo}についての議論**\n\n**テーマ**: このエリアにはどんなお店、イベント、活動があると良いでしょうか？\n\nぜひあなたのアイデアを共有してください！`;

    const postId = `post_${Date.now()}`;
    await supabase
      .from('posts')
      .insert([{
        post_id: postId,
        discussion_key: discussionKey,
        content: autoPostContent,
        is_auto_generated: true,
        created_at: new Date().toISOString()
      }]);

    // Get posts
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('discussion_key', discussionKey)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      discussion: { ...discussion, posts: posts || [] },
      discussion_key: discussion.discussion_key,
      is_new: true
    });
  } catch (error) {
    console.error('Error in area-discussions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
