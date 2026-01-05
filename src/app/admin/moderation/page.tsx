'use client';

import { useState, useEffect } from 'react';
import { Discussion, Post } from '@/lib/types';

export default function ModerationPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Check if already authenticated via server session
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDiscussions();
    }
  }, [isAuthenticated]);

  async function checkSession() {
    try {
      const res = await fetch('/api/admin/session');
      const data = await res.json();
      setIsAuthenticated(data.authenticated === true);
    } catch (error) {
      console.error('Session check error:', error);
      setIsAuthenticated(false);
    }
    setAuthChecking(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loginId, password: loginPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'IDまたはパスワードが正しくありません');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('ログインに失敗しました');
    }

    setLoggingIn(false);
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setIsAuthenticated(false);
  }

  async function loadDiscussions() {
    try {
      const res = await fetch('/api/moderation');

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const data = await res.json();
      setDiscussions(data.discussions || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
    }
    setLoading(false);
  }

  async function handleViewDiscussion(discussionKey: string) {
    try {
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_discussion', discussionKey }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const data = await res.json();

      if (data.discussion) {
        setSelectedDiscussion(data.discussion);
        setViewMode('detail');
      }
    } catch (error) {
      console.error('Error loading discussion:', error);
    }
  }

  async function handleDeleteDiscussion(discussionKey: string) {
    if (!confirm('この議論を削除してもよろしいですか？すべての投稿も削除されます。')) {
      return;
    }

    try {
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_discussion', discussionKey }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const data = await res.json();

      if (data.ok) {
        await loadDiscussions();
        if (selectedDiscussion?.discussion_key === discussionKey) {
          setSelectedDiscussion(null);
          setViewMode('list');
        }
      }
    } catch (error) {
      console.error('Error deleting discussion:', error);
    }
  }

  async function handleDeletePost(discussionKey: string, postId: string) {
    if (!confirm('この投稿を削除してもよろしいですか？')) {
      return;
    }

    try {
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_post', discussionKey, postId }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const data = await res.json();

      if (data.ok) {
        // Reload the discussion to get updated posts
        await handleViewDiscussion(discussionKey);
        await loadDiscussions();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }

  function handleBackToList() {
    setSelectedDiscussion(null);
    setViewMode('list');
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ja-JP');
  }

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6 text-center">管理者ログイン</h1>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loggingIn}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loggingIn}
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium transition-colors"
            >
              {loggingIn ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {viewMode === 'detail' && (
              <button
                onClick={handleBackToList}
                className="text-gray-600 hover:text-gray-900 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-2xl font-bold">
              {viewMode === 'list' ? 'モデレーション' : selectedDiscussion?.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/news"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ニュース管理
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          // Discussion list
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg font-bold mb-4">議論一覧 ({discussions.length}件)</h2>

            {loading ? (
              <p className="text-gray-500">読み込み中...</p>
            ) : discussions.length === 0 ? (
              <p className="text-gray-500">議論がありません</p>
            ) : (
              <div className="space-y-3">
                {discussions.map((discussion) => (
                  <div
                    key={discussion.discussion_key}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {discussion.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {(discussion.posts ?? []).length}件の投稿
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(discussion.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewDiscussion(discussion.discussion_key)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => handleDeleteDiscussion(discussion.discussion_key)}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Discussion detail with posts
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">投稿一覧 ({selectedDiscussion?.posts.length || 0}件)</h2>
              <button
                onClick={() => handleDeleteDiscussion(selectedDiscussion!.discussion_key)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                議論を削除
              </button>
            </div>

            {selectedDiscussion?.source_url && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ソース:</span>{' '}
                  <a
                    href={selectedDiscussion.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedDiscussion.source_title || selectedDiscussion.source_url}
                  </a>
                </p>
              </div>
            )}

            <div className="space-y-4">
              {selectedDiscussion?.posts.map((post) => (
                <div
                  key={post.id}
                  className={`border rounded-lg p-4 ${
                    post.is_auto_generated ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {post.is_auto_generated && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                            自動生成
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                        {post.content}
                      </p>
                      {post.image_url && (
                        <div className="mt-2">
                          <img
                            src={post.image_url}
                            alt="Attached"
                            className="max-w-xs max-h-32 rounded-lg object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePost(selectedDiscussion!.discussion_key, post.id)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
