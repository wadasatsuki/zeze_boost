'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Discussion, Post } from '@/lib/types';

interface Props {
  params: Promise<{ key: string }>;
}

export default function DiscussionDetailPage({ params }: Props) {
  const router = useRouter();
  const [discussionKey, setDiscussionKey] = useState<string | null>(null);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'info'>('comments');

  useEffect(() => {
    params.then((p) => setDiscussionKey(p.key));
  }, [params]);

  useEffect(() => {
    if (discussionKey) {
      loadDiscussion();
    }
  }, [discussionKey]);

  async function loadDiscussion() {
    if (!discussionKey) return;
    setLoading(true);

    const res = await fetch(`/api/discussions/${discussionKey}`);
    const data = await res.json();

    if (data.discussion) {
      setDiscussion(data.discussion);
    }

    setLoading(false);
  }

  function handleBack() {
    router.push('/discussions');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim() || submitting || !discussionKey) return;

    setSubmitting(true);

    const res = await fetch(`/api/discussions/${discussionKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'post', content: newPost }),
    });

    const data = await res.json();

    if (data.post && discussion) {
      setDiscussion({
        ...discussion,
        posts: [...discussion.posts, data.post],
      });
      setNewPost('');
    }

    setSubmitting(false);
  }

  function handleShareOnX() {
    const title = discussion?.title || '';
    const text = `${title}\n\nZEZE BOOSTで議論に参加しよう！`;
    const hashtags = 'zeze_boost';
    const shareUrl = `${window.location.origin}/discussions/${discussionKey}`;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-500">議論が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 p-1 -ml-1 flex-shrink-0"
            aria-label="戻る"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="font-bold text-base flex-1 truncate">{discussion.title}</h2>
          <button
            onClick={handleShareOnX}
            className="w-8 h-8 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Xでシェア"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'comments'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            コメント
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            詳細
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'comments' ? (
          <div className="p-4 space-y-4">
            {discussion.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2">{discussion.title}</h3>
            <p className="text-sm text-gray-600">
              作成日: {new Date(discussion.created_at).toLocaleDateString('ja-JP')}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              投稿数: {discussion.posts.length}件
            </p>
          </div>
        )}
      </div>

      {/* Bottom action bar - fixed above mobile nav */}
      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-16 right-0 border-t bg-white z-10">
        <form onSubmit={handleSubmit} className="p-3 flex items-end gap-2">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="コメントを入力..."
            className="flex-1 p-3 border rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            rows={1}
          />
          <button
            type="submit"
            disabled={!newPost.trim() || submitting}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-300 text-sm font-medium flex-shrink-0"
          >
            {submitting ? '...' : '投稿'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const date = new Date(post.created_at);
  const formattedDate = date.toLocaleString('ja-JP');

  return (
    <div
      className={`p-2.5 md:p-3 rounded-lg ${
        post.is_auto_generated ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
      }`}
    >
      <div className="text-xs text-gray-400 mb-1.5 md:mb-2 flex flex-wrap items-center gap-1">
        {post.is_auto_generated && (
          <span className="bg-blue-100 text-blue-600 px-1.5 md:px-2 py-0.5 rounded text-xs">
            自動生成
          </span>
        )}
        <span>{formattedDate}</span>
      </div>
      <div className="whitespace-pre-wrap text-xs md:text-sm break-words">{post.content}</div>
    </div>
  );
}
