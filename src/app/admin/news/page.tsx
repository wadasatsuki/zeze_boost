'use client';

import { useState, useEffect } from 'react';
import { NewsItem } from '@/lib/types';

export default function AdminNewsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Check if already authenticated via server session
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadNews();
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

  function handleEdit(item: NewsItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setUrl(item.url || '');
    setSummary(item.summary || '');
    setHashtags(item.hashtags || '');
    setError(null);
    setSuccess(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setTitle('');
    setUrl('');
    setSummary('');
    setHashtags('');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingId ? 'update' : 'create',
          id: editingId || undefined,
          title: title.trim(),
          url: url.trim() || undefined,
          summary: summary.trim() || undefined,
          hashtags: hashtags.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setIsAuthenticated(false);
        setError('セッションが切れました。再度ログインしてください。');
      } else if (data.error) {
        setError(data.error);
      } else if (data.newsItem) {
        setSuccess(editingId ? 'ニュースを更新しました' : 'ニュースを作成しました');
        setEditingId(null);
        setTitle('');
        setUrl('');
        setSummary('');
        setHashtags('');
        await loadNews();
      }
    } catch (error) {
      setError(editingId ? 'ニュースの更新に失敗しました' : 'ニュースの作成に失敗しました');
      console.error('Error saving news:', error);
    }

    setSubmitting(false);
  }

  async function handleDelete(newsId: string) {
    if (!confirm('このニュースを削除してもよろしいですか？')) {
      return;
    }

    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: newsId }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setIsAuthenticated(false);
        setError('セッションが切れました。再度ログインしてください。');
      } else if (data.ok) {
        await loadNews();
      } else {
        console.error('Delete failed:', data);
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    }
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
          <h1 className="text-2xl font-bold">ニュース管理</h1>
          <div className="flex items-center gap-2">
            <a
              href="/admin/moderation"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              モデレーション
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* Create/Edit form */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {editingId ? 'ニュースを編集' : 'ニュースを追加'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ニュースのタイトル"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL（任意）
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news-article"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                概要（任意）
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="ニュースの概要..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ハッシュタグ（任意）
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="fireworks, event, zeze"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                カンマまたはスペースで区切ってください
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium transition-colors"
            >
              {submitting
                ? (editingId ? '更新中...' : '作成中...')
                : (editingId ? 'ニュースを更新' : 'ニュースを作成')}
            </button>
          </form>
        </div>

        {/* News list */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg font-bold mb-4">ニュース一覧 ({news.length}件)</h2>

          {loading ? (
            <p className="text-gray-500">読み込み中...</p>
          ) : news.length === 0 ? (
            <p className="text-gray-500">ニュースがありません</p>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate block"
                        >
                          {item.url}
                        </a>
                      )}
                      {item.summary && (
                        <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                      )}
                      {item.hashtags && (
                        <p className="text-sm text-gray-500 mt-1">
                          {item.hashtags.split(/[,\s]+/).filter(Boolean).map(tag =>
                            tag.startsWith('#') ? tag : `#${tag}`
                          ).join(' ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(item.created_at)}
                        {item.discussion_key && (
                          <span className="ml-2 text-green-600">議論あり</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        aria-label="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
