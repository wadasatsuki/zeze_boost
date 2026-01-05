'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewsItem } from '@/lib/types';

export default function NewsPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [discussingId, setDiscussingId] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data.news || []);
    } catch (error) {
      console.error('Error loading news:', error);
    }
    setLoading(false);
  }

  async function handleDiscuss(newsItem: NewsItem) {
    setDiscussingId(newsItem.id);

    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discuss', newsId: newsItem.id }),
      });

      const data = await res.json();

      if (data.discussion_key) {
        router.push(`/discussions?key=${data.discussion_key}`);
      }
    } catch (error) {
      console.error('Error starting discussion:', error);
    }

    setDiscussingId(null);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white border-b p-3 md:p-4">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">ニュース一覧</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col">
      <header className="bg-white border-b p-3 md:p-4 flex-shrink-0">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">ニュース一覧</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📰</p>
            <p className="text-gray-500">ニュースがありません</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {news.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/news/${item.id}`)}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📰</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-gray-900 mb-1">
                      {item.title}
                    </h2>
                    {item.summary && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.summary}</p>
                    )}
                    {item.hashtags && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.hashtags.split(/[,\s]+/).filter(Boolean).map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                          >
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">
                        {formatDate(item.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/news/${item.id}`);
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          詳細を確認
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDiscuss(item);
                          }}
                          disabled={discussingId === item.id}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                        >
                          {discussingId === item.id
                            ? '...'
                            : item.discussion_key
                            ? '議論を見る'
                            : '議論する'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
