'use client';

import { useState, useEffect } from 'react';
import { Discussion, Post } from '@/lib/types';

interface Props {
  discussionKey: string;
  onClose: () => void;
}

export default function DiscussionPane({ discussionKey, onClose }: Props) {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrCreateDiscussion();
  }, [discussionKey]);

  async function loadOrCreateDiscussion() {
    setLoading(true);

    // Try to get existing discussion
    const res = await fetch(`/api/discussions/${discussionKey}`);
    const data = await res.json();

    if (data.discussion) {
      setDiscussion(data.discussion);
    } else {
      // Create new discussion
      const createRes = await fetch(`/api/discussions/${discussionKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      const createData = await createRes.json();
      setDiscussion(createData.discussion);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim() || submitting) return;

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-red-500">エラーが発生しました</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold">{discussion.title}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {discussion.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="コメントを入力..."
          className="w-full p-2 border rounded-lg resize-none"
          rows={3}
        />
        <button
          type="submit"
          disabled={!newPost.trim() || submitting}
          className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {submitting ? '送信中...' : '投稿する'}
        </button>
      </form>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const date = new Date(post.created_at);
  const formattedDate = date.toLocaleString('ja-JP');

  return (
    <div
      className={`p-3 rounded-lg ${
        post.is_auto_generated ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
      }`}
    >
      <div className="text-xs text-gray-400 mb-2">
        {post.is_auto_generated && (
          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded mr-2">
            自動生成
          </span>
        )}
        {formattedDate}
      </div>
      <div className="whitespace-pre-wrap text-sm">{post.content}</div>
    </div>
  );
}
