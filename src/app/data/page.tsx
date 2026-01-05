'use client';

import { useState, useEffect } from 'react';
import { DataCard } from '@/lib/types';
import DataCardList from '@/components/DataCardList';
import CardDetail from '@/components/CardDetail';
import DiscussionPane from '@/components/DiscussionPane';

export default function DataPage() {
  const [cards, setCards] = useState<DataCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<DataCard | null>(null);
  const [activeDiscussionKey, setActiveDiscussionKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'discussion'>('list');

  useEffect(() => {
    async function loadCards() {
      const res = await fetch('/api/cards');
      const data = await res.json();
      setCards(data.cards);
      setLoading(false);
    }
    loadCards();
  }, []);

  function handleSelectCard(card: DataCard) {
    setSelectedCard(card);
  }

  function handleStartDiscussion() {
    if (selectedCard) {
      setActiveDiscussionKey(selectedCard.discussion_key);
      setMobileView('discussion');
    }
  }

  function handleCloseDiscussion() {
    setActiveDiscussionKey(null);
    setMobileView('list');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b p-3 md:p-4">
        <h1 className="text-lg md:text-xl font-bold">膳所学区 データ閲覧・議論</h1>
        <p className="text-xs md:text-sm text-gray-500 hidden sm:block">
          滋賀県大津市膳所地域のデータカードを閲覧し、議論を始めることができます
        </p>
      </header>

      {/* Mobile tab navigation */}
      {activeDiscussionKey && (
        <div className="md:hidden flex border-b bg-white">
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              mobileView === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            データ一覧
          </button>
          <button
            onClick={() => setMobileView('discussion')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              mobileView === 'discussion'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            議論
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Card list + Detail + Button */}
        <div
          className={`w-full md:w-1/2 flex flex-col md:border-r bg-white ${
            activeDiscussionKey && mobileView === 'discussion' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Scrollable card list */}
          <div className="flex-1 p-3 md:p-4 overflow-y-auto">
            <DataCardList
              cards={cards}
              selectedCardId={selectedCard?.id || null}
              onSelectCard={handleSelectCard}
            />
          </div>

          {/* Pinned detail + button at bottom */}
          {selectedCard && (
            <div className="border-t bg-gray-50 flex-shrink-0">
              <div className="p-3 md:p-4">
                <CardDetail card={selectedCard} />
              </div>
              <div className="p-3 md:p-4 pt-0">
                <button
                  onClick={handleStartDiscussion}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm md:text-base"
                >
                  この課題を議論する
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Discussion pane */}
        <div
          className={`w-full md:w-1/2 bg-white ${
            activeDiscussionKey && mobileView === 'discussion' ? 'flex' : 'hidden md:flex'
          } flex-col`}
        >
          {activeDiscussionKey ? (
            <DiscussionPane
              discussionKey={activeDiscussionKey}
              onClose={handleCloseDiscussion}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center px-4">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm md:text-base">カードを選択して下部の</p>
                <p className="text-sm md:text-base">「この課題を議論する」ボタンを</p>
                <p className="text-sm md:text-base">クリックすると議論が始まります</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
