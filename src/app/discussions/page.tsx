'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Discussion } from '@/lib/types';

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDiscussions() {
      try {
        const res = await fetch('/api/discussions');
        const data = await res.json();
        setDiscussions(data.discussions);
      } catch (error) {
        console.error('Error loading discussions:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDiscussions();
  }, []);

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
          <h1 className="text-lg md:text-xl font-bold">議論</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b p-3 md:p-4">
        <h1 className="text-lg md:text-xl font-bold">議論</h1>
        <p className="text-xs md:text-sm text-gray-500 hidden sm:block">
          進行中の議論一覧
        </p>
      </header>

      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {discussions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">💬</p>
            <p className="text-gray-500 mb-4">まだ議論がありません</p>
            <Link
              href="/data"
              className="inline-block py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              データから議論を始める
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {discussions.map((discussion) => (
              <Link
                key={discussion.discussion_key}
                href={`/data?discussion=${discussion.discussion_key}`}
                className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {discussion.area_bounds ? '📍' : '📊'}
                      </span>
                      <h2 className="font-medium text-gray-900 truncate">
                        {discussion.title}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-500">
                      {discussion.posts.length} 件の投稿
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(discussion.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
