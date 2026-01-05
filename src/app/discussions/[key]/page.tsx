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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) {
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setUploadError('JPGまたはPNG画像のみ対応しています');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('画像サイズは2MB以下にしてください');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setSelectedImage(null);
    setImagePreview(null);
    setUploadError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!newPost.trim() && !selectedImage) || submitting || !discussionKey) return;

    setSubmitting(true);

    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          imageUrl = uploadData.url;
        } else if (uploadData.error) {
          setUploadError(uploadData.error);
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch(`/api/discussions/${discussionKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post', content: newPost, imageUrl }),
      });

      const data = await res.json();

      if (data.post && discussion) {
        setDiscussion({
          ...discussion,
          posts: [...discussion.posts, data.post],
        });
        setNewPost('');
        clearImage();
      }
    } catch (error) {
      console.error('Error posting:', error);
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
    <div className="h-screen w-screen overflow-hidden bg-white flex flex-col">
      {/* Header */}
      <div className="border-b flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 p-1 -ml-1 flex-shrink-0"
            aria-label="戻る"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="font-bold text-base flex-1 truncate text-gray-900">{discussion.title}</h2>
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

      {/* Source URL banner */}
      {discussion.source_url && (
        <div className="px-4 py-2 bg-blue-50 border-b flex-shrink-0 overflow-hidden">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <a
              href={discussion.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate"
            >
              {discussion.source_title || discussion.source_url}
            </a>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        {activeTab === 'comments' ? (
          <div className="p-4 space-y-4">
            {discussion.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2 text-gray-900">{discussion.title}</h3>
            {discussion.source_url && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">関連URL:</span>{' '}
                <a
                  href={discussion.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {discussion.source_title || discussion.source_url}
                </a>
              </p>
            )}
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
        {/* Image preview */}
        {imagePreview && (
          <div className="px-3 pt-3 pb-0">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-auto rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="px-3 pt-2 text-xs text-red-500">{uploadError}</div>
        )}

        <form onSubmit={handleSubmit} className="p-3 flex items-end gap-2">
          {/* Image upload button */}
          <label className="p-3 text-gray-500 hover:text-gray-700 cursor-pointer flex-shrink-0">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageSelect}
              className="hidden"
            />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>

          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if ((newPost.trim() || selectedImage) && !submitting) {
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }
            }}
            placeholder="コメントを入力..."
            className="flex-1 p-3 border rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            rows={1}
          />
          <button
            type="submit"
            disabled={(!newPost.trim() && !selectedImage) || submitting}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-300 text-sm font-medium flex-shrink-0"
          >
            {submitting ? '...' : '投稿'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Helper function to render content with clickable URLs
function renderContentWithLinks(content: string) {
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,;:!?"'\])>])/g;
  const parts = content.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
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
      <div className="whitespace-pre-wrap text-xs md:text-sm break-words text-gray-900">
        {renderContentWithLinks(post.content)}
      </div>
      {post.image_url && (
        <div className="mt-2">
          <img
            src={post.image_url}
            alt="Attached image"
            className="max-w-full max-h-64 rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
