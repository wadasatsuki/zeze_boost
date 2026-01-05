'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { NewsItem } from '@/lib/types';

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discussingId, setDiscussingId] = useState<string | null>(null);

  useEffect(() => {
    loadNewsItem();
  }, [id]);

  async function loadNewsItem() {
    try {
      const res = await fetch(`/api/news/${id}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setNewsItem(data.newsItem);
      }
    } catch (err) {
      console.error('Error loading news item:', err);
      setError('ニュースの読み込みに失敗しました');
    }
    setLoading(false);
  }

  async function handleDiscuss() {
    if (!newsItem) return;

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
    } catch (err) {
      console.error('Error starting discussion:', err);
    }

    setDiscussingId(null);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white border-b p-3 md:p-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">ニュース詳細</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white border-b p-3 md:p-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">ニュース詳細</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">404</p>
            <p className="text-gray-500">{error || 'ニュースが見つかりません'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col">
      <header className="bg-white border-b p-3 md:p-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg md:text-xl font-bold truncate text-gray-900">ニュース詳細</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              {newsItem.title}
            </h2>

            {/* Date */}
            <p className="text-sm text-gray-500 mb-4">
              {formatDate(newsItem.created_at)}
            </p>

            {/* URL */}
            {newsItem.url && (
              <div className="mb-4">
                <a
                  href={newsItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {newsItem.url}
                </a>
              </div>
            )}

            {/* Summary */}
            {newsItem.summary && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">概要</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{newsItem.summary}</p>
              </div>
            )}

            {/* Hashtags */}
            {newsItem.hashtags && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {newsItem.hashtags.split(/[,\s]+/).filter(Boolean).map((tag, i) => (
                    <span
                      key={i}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion button */}
            <div className="pt-4 border-t">
              <button
                onClick={handleDiscuss}
                disabled={discussingId === newsItem.id}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                {discussingId === newsItem.id
                  ? '...'
                  : newsItem.discussion_key
                  ? '議論を見る'
                  : 'このニュースについて議論する'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
