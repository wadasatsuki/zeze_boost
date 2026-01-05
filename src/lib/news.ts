import { NewsItem } from './types';
import fs from 'fs';
import path from 'path';

const NEWS_FILE = path.join(process.cwd(), 'data', 'news.json');

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function loadNews(): NewsItem[] {
  ensureDataDir();
  if (!fs.existsSync(NEWS_FILE)) {
    return [];
  }
  const content = fs.readFileSync(NEWS_FILE, 'utf-8');
  return JSON.parse(content);
}

export function saveNews(news: NewsItem[]) {
  ensureDataDir();
  fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
}

export function getNewsItem(id: string): NewsItem | null {
  const news = loadNews();
  return news.find((item) => item.id === id) || null;
}

export function getNewsByUrl(url: string): NewsItem | null {
  const news = loadNews();
  return news.find((item) => item.url === url) || null;
}

export function createNewsItem(
  title: string,
  url: string,
  summary?: string,
  hashtags?: string
): NewsItem {
  const news = loadNews();

  const newsItem: NewsItem = {
    id: `news_${Date.now()}`,
    title,
    url,
    summary: summary || undefined,
    hashtags: hashtags || undefined,
    created_at: new Date().toISOString(),
  };

  news.unshift(newsItem); // Add to beginning (newest first)
  saveNews(news);

  return newsItem;
}

export function updateNewsItemDiscussion(newsId: string, discussionKey: string): NewsItem | null {
  const news = loadNews();
  const index = news.findIndex((item) => item.id === newsId);

  if (index === -1) {
    return null;
  }

  news[index].discussion_key = discussionKey;
  saveNews(news);

  return news[index];
}

export function deleteNewsItem(id: string): boolean {
  const news = loadNews();
  const index = news.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  news.splice(index, 1);
  saveNews(news);

  return true;
}
