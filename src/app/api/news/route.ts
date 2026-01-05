import { NextResponse } from 'next/server';
import { loadNews, createNewsItem, updateNewsItemDiscussion, deleteNewsItem } from '@/lib/news';
import { createFreeDiscussion } from '@/lib/discussions';
import { loadDiscussions } from '@/lib/discussions';

// GET - List all news items
export async function GET() {
  try {
    const news = loadNews();
    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error loading news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create news item or start discussion
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Create new news item
    if (body.action === 'create') {
      const { title, url, summary, hashtags } = body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      if (!url || typeof url !== 'string' || !url.trim()) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }

      // Validate URL
      try {
        new URL(url.trim());
      } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }

      const newsItem = createNewsItem(
        title.trim(),
        url.trim(),
        summary?.trim() || undefined,
        hashtags?.trim() || undefined
      );

      return NextResponse.json({ newsItem });
    }

    // Start discussion for a news item
    if (body.action === 'discuss') {
      const { newsId } = body;

      if (!newsId) {
        return NextResponse.json({ error: 'News ID is required' }, { status: 400 });
      }

      const news = loadNews();
      const newsItem = news.find((item) => item.id === newsId);

      if (!newsItem) {
        return NextResponse.json({ error: 'News item not found' }, { status: 404 });
      }

      // Check if discussion already exists for this news item
      if (newsItem.discussion_key) {
        return NextResponse.json({
          discussion_key: newsItem.discussion_key,
          existing: true
        });
      }

      // Check if there's already a discussion with this URL
      const discussions = loadDiscussions();
      const existingDiscussion = Object.values(discussions).find(
        (d) => d.source_url === newsItem.url
      );

      if (existingDiscussion) {
        // Link the existing discussion to this news item
        updateNewsItemDiscussion(newsId, existingDiscussion.discussion_key);
        return NextResponse.json({
          discussion_key: existingDiscussion.discussion_key,
          existing: true
        });
      }

      // Create new discussion
      // Build the auto-post content
      let hashtagText = '';
      if (newsItem.hashtags) {
        const tags = newsItem.hashtags.split(/[,\s]+/).filter(Boolean);
        hashtagText = tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
      }

      // Fetch page title for the discussion
      let sourceTitle: string | undefined;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(newsItem.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZezeBoost/1.0)' },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const html = await response.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            sourceTitle = titleMatch[1].trim();
          }
        }
      } catch {
        // Ignore fetch errors, use news item title
      }

      const discussion = createFreeDiscussion(
        newsItem.title,
        newsItem.url,
        sourceTitle || newsItem.title
      );

      // Update the news item with the discussion key
      updateNewsItemDiscussion(newsId, discussion.discussion_key);

      return NextResponse.json({
        discussion_key: discussion.discussion_key,
        existing: false
      });
    }

    // Delete news item
    if (body.action === 'delete') {
      const { newsId } = body;

      if (!newsId) {
        return NextResponse.json({ error: 'News ID is required' }, { status: 400 });
      }

      const deleted = deleteNewsItem(newsId);

      if (!deleted) {
        return NextResponse.json({ error: 'News item not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing news request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
