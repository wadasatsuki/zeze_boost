'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Discussion, Post } from '@/lib/types';
import NewDiscussionModal from '@/components/NewDiscussionModal';

function DiscussionsPageContent() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscussionKey, setSelectedDiscussionKey] = useState<string | null>(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleCreateFreeDiscussion(title: string, sourceUrl?: string) {
    try {
      const res = await fetch('/api/free-discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sourceUrl }),
      });
      const data = await res.json();

      if (data.discussion_key) {
        setIsModalOpen(false);
        // Reload discussions and select the new one
        await loadDiscussions();
        setSelectedDiscussionKey(data.discussion_key);
        setMobileView('detail');
      }
    } catch (error) {
      console.error('Error creating free discussion:', error);
    }
  }

  async function loadDiscussions() {
    try {
      const res = await fetch('/api/discussions');
      const data = await res.json();
      const discussions = data.discussions ?? [];
      setDiscussions(discussions);
      return discussions;
    } catch (error) {
      console.error('Error loading discussions:', error);
      return [];
    }
  }

  useEffect(() => {
    loadDiscussions().then(() => setLoading(false));
  }, []);

  // Handle key query parameter (from news page)
  useEffect(() => {
    const key = searchParams.get('key');
    if (key && !loading) {
      setSelectedDiscussionKey(key);
      setMobileView('detail');
    }
  }, [searchParams, loading]);

  // Load selected discussion details
  useEffect(() => {
    if (selectedDiscussionKey) {
      loadDiscussionDetail(selectedDiscussionKey);
    } else {
      setSelectedDiscussion(null);
    }
  }, [selectedDiscussionKey]);

  async function loadDiscussionDetail(key: string) {
    try {
      const res = await fetch(`/api/discussions/${key}`);
      const data = await res.json();
      if (data.discussion) {
        setSelectedDiscussion(data.discussion);
      }
    } catch (error) {
      console.error('Error loading discussion:', error);
    }
  }

  function handleSelectDiscussion(key: string) {
    setSelectedDiscussionKey(key);
    setMobileView('detail');
  }

  function handleCloseDetail() {
    setSelectedDiscussionKey(null);
    setSelectedDiscussion(null);
    setMobileView('list');
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
          <h1 className="text-lg md:text-xl font-bold text-gray-900">進行中の議論一覧</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col">
      <header className="bg-white border-b p-3 md:p-4 flex-shrink-0">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">進行中の議論一覧</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Discussion list */}
        <div
          className={`w-full md:w-1/2 flex flex-col md:border-r bg-white overflow-hidden ${
            mobileView === 'detail' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
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
              <div className="space-y-3">
                {discussions.map((discussion) => (
                  <div
                    key={discussion.discussion_key}
                    onClick={() => handleSelectDiscussion(discussion.discussion_key)}
                    className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer ${
                      selectedDiscussionKey === discussion.discussion_key ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg flex-shrink-0">
                        {discussion.area_bounds ? '📍' : '📊'}
                      </span>
                      <h2 className="font-medium text-gray-900 truncate">
                        {discussion.title}
                      </h2>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {(discussion.posts ?? []).length} 件の投稿
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatDate(discussion.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Discussion detail */}
        <div
          className={`w-full md:w-1/2 bg-white overflow-hidden ${
            mobileView === 'detail' ? 'flex' : 'hidden md:flex'
          } flex-col`}
        >
          {selectedDiscussion ? (
            <DiscussionDetail
              discussion={selectedDiscussion}
              onClose={handleCloseDetail}
              onPostAdded={() => loadDiscussionDetail(selectedDiscussion.discussion_key)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center px-4">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm md:text-base">議論を選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating action button - hide when viewing discussion on mobile */}
      {mobileView !== 'detail' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center z-20"
          aria-label="新しい議論を追加"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* New discussion modal */}
      <NewDiscussionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateFreeDiscussion}
      />
    </div>
  );
}

// Inline Discussion Detail Component
function DiscussionDetail({
  discussion,
  onClose,
  onPostAdded,
}: {
  discussion: Discussion;
  onClose: () => void;
  onPostAdded: () => void;
}) {
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'info'>('comments');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) {
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setUploadError('JPGまたはPNG画像のみ対応しています');
      return;
    }

    // Validate file size (2MB max)
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
    if ((!newPost.trim() && !selectedImage) || submitting) return;

    setSubmitting(true);

    try {
      let imageUrl: string | undefined;

      // Upload image if selected
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

      const res = await fetch(`/api/discussions/${discussion.discussion_key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post', content: newPost, imageUrl }),
      });

      const data = await res.json();

      if (data.post) {
        setNewPost('');
        clearImage();
        onPostAdded();
      }
    } catch (error) {
      console.error('Error posting:', error);
    }

    setSubmitting(false);
  }

  function handleShareOnX() {
    const text = `${discussion.title}\n\nZEZE BOOSTで議論に参加しよう！`;
    const hashtags = 'zeze_boost';
    const shareUrl = `${window.location.origin}/discussions/${discussion.discussion_key}`;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="md:hidden text-gray-600 hover:text-gray-900 p-1 -ml-1 flex-shrink-0"
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
            {(discussion.posts ?? []).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2 text-gray-900">{discussion.title}</h3>
            {discussion.source_url && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium text-gray-700">関連URL:</span>{' '}
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
              投稿数: {(discussion.posts ?? []).length}件
            </p>
          </div>
        )}
      </div>

      {/* Bottom action bar - fixed at bottom */}
      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-[calc(50%+2rem)] right-0 border-t md:border-l bg-white z-10">
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
      // Reset regex lastIndex
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

export default function DiscussionsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    }>
      <DiscussionsPageContent />
    </Suspense>
  );
}
