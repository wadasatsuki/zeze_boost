'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, sourceUrl?: string) => void;
}

export default function NewDiscussionModal({ isOpen, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onSubmit(title.trim(), sourceUrl.trim() || undefined);
    setTitle('');
    setSourceUrl('');
    setIsSubmitting(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">新しい議論を始める</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                テーマ・タイトル
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 膳所駅前の活性化について"
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-2">
                関連URL（任意）
              </label>
              <input
                id="sourceUrl"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/news-article"
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                ニュース記事などのURLを入力すると、議論の参考として表示されます
              </p>
            </div>
          </div>

          <div className="p-4 border-t flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '作成中...' : '議論を始める'}
              </button>
            </div>
            <Link
              href="/data"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              データから議論を始める
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
