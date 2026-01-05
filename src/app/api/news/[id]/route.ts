import { NextResponse } from 'next/server';
import { getNewsItem } from '@/lib/news';

// GET - Get a single news item by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsItem = getNewsItem(id);

    if (!newsItem) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }

    return NextResponse.json({ newsItem });
  } catch (error) {
    console.error('Error loading news item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
