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
    }
  }

  function handleCloseDiscussion() {
    setActiveDiscussionKey(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">膳所学区 データ閲覧・議論</h1>
        <p className="text-sm text-gray-500">滋賀県大津市膳所地域のデータカードを閲覧し、議論を始めることができます</p>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left column: Card list + Detail + Button */}
        <div className="w-1/2 flex flex-col border-r bg-white">
          {/* Scrollable card list */}
          <div className="flex-1 p-4 overflow-y-auto">
            <DataCardList
              cards={cards}
              selectedCardId={selectedCard?.id || null}
              onSelectCard={handleSelectCard}
            />
          </div>

          {/* Pinned detail + button at bottom */}
          {selectedCard && (
            <div className="border-t bg-gray-50">
              <div className="p-4">
                <CardDetail card={selectedCard} />
              </div>
              <div className="p-4 pt-0">
                <button
                  onClick={handleStartDiscussion}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  この課題を議論する
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Discussion pane */}
        <div className="w-1/2 bg-white">
          {activeDiscussionKey ? (
            <DiscussionPane
              discussionKey={activeDiscussionKey}
              onClose={handleCloseDiscussion}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-2">💬</p>
                <p>カードを選択して下部の</p>
                <p>「この課題を議論する」ボタンを</p>
                <p>クリックすると議論が始まります</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
