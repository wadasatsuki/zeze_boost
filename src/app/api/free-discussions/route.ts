import { NextResponse } from 'next/server';
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

// Helper function to fetch page title from URL
async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZezeBoost/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Try to extract title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }

    // Try og:title as fallback
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      return ogTitleMatch[1].trim();
    }

    // Try reverse order for og:title (content before property)
    const ogTitleMatch2 = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitleMatch2 && ogTitleMatch2[1]) {
      return ogTitleMatch2[1].trim();
    }

    return null;
  } catch (error) {
    console.error('Error fetching page title:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { title, sourceUrl } = await request.json();

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate sourceUrl if provided
    let validatedSourceUrl: string | null = null;
    let sourceTitle: string | null = null;

    if (sourceUrl && typeof sourceUrl === 'string' && sourceUrl.trim()) {
      try {
        new URL(sourceUrl.trim());
        validatedSourceUrl = sourceUrl.trim();

        // Fetch page title
        const fetchedTitle = await fetchPageTitle(validatedSourceUrl);
        if (fetchedTitle) {
          sourceTitle = fetchedTitle;
        }
      } catch {
        // Invalid URL, ignore it
      }
    }

    const supabase = supabaseAdmin();
    const discussionKey = `free_${Date.now()}`;

    // Create discussion
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .insert([{
        discussion_key: discussionKey,
        title: title.trim(),
        created_at: new Date().toISOString(),
        source_url: validatedSourceUrl,
        source_title: sourceTitle
      }])
      .select()
      .single();

    if (discussionError) {
      console.error('Error creating discussion:', discussionError);
      return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 });
    }

    // Create auto-generated first post
    let autoPostContent = `💭 **${title.trim()}**\n\nこのテーマについて自由に議論しましょう！`;
    if (validatedSourceUrl) {
      const linkText = sourceTitle || validatedSourceUrl;
      autoPostContent = `💭 **${title.trim()}**\n\n🔗 関連リンク: ${linkText}\n\nこのテーマについて自由に議論しましょう！`;
    }

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

    return NextResponse.json({
      discussion_key: discussion.discussion_key,
      title: discussion.title,
      source_url: discussion.source_url,
      source_title: discussion.source_title,
    });
  } catch (error) {
    console.error('Error creating free discussion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
