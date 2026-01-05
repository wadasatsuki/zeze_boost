import { NextResponse } from 'next/server';
import { createFreeDiscussion } from '@/lib/discussions';

// Helper function to fetch page title from URL
async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
    let validatedSourceUrl: string | undefined;
    let sourceTitle: string | undefined;

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

    const discussion = createFreeDiscussion(title.trim(), validatedSourceUrl, sourceTitle);

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
