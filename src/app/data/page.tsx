'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataCard, AreaBounds } from '@/lib/types';
import DataCardList from '@/components/DataCardList';
import CardDetail from '@/components/CardDetail';
import DiscussionPane from '@/components/DiscussionPane';
import AreaMap from '@/components/AreaMap';
import NewDiscussionModal from '@/components/NewDiscussionModal';

function DataPageContent() {
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<DataCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<DataCard | null>(null);
  const [activeDiscussionKey, setActiveDiscussionKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'discussion'>('list');

  // Area selection state
  const [selectedAreaBounds, setSelectedAreaBounds] = useState<AreaBounds | null>(null);
  const [areaName, setAreaName] = useState('');
  const [isAreaDiscussion, setIsAreaDiscussion] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadCards() {
      const res = await fetch('/api/cards');
      const data = await res.json();
      setCards(data.cards);
      setLoading(false);
    }
    loadCards();
  }, []);

  // Handle discussion query parameter
  useEffect(() => {
    const discussionKey = searchParams.get('discussion');
    if (discussionKey) {
      setActiveDiscussionKey(discussionKey);
      setMobileView('discussion');
    }
  }, [searchParams]);

  function handleSelectCard(card: DataCard) {
    setSelectedCard(card);
    // Clear area selection when selecting a card
    setSelectedAreaBounds(null);
  }

  function handleStartDiscussion() {
    if (selectedCard) {
      setActiveDiscussionKey(selectedCard.discussion_key);
      setIsAreaDiscussion(false);
      setMobileView('discussion');
    }
  }

  function handleCloseDiscussion() {
    setActiveDiscussionKey(null);
    setIsAreaDiscussion(false);
    setMobileView('list');
  }

  function handleAreaSelected(bounds: AreaBounds) {
    setSelectedAreaBounds(bounds);
    setAreaName('');
    // Clear card selection when selecting an area
    setSelectedCard(null);
  }

  function handleClearAreaSelection() {
    setSelectedAreaBounds(null);
    setAreaName('');
  }

  async function handleStartAreaDiscussion() {
    if (!selectedAreaBounds) return;

    try {
      const res = await fetch('/api/area-discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounds: selectedAreaBounds, name: areaName || undefined }),
      });
      const data = await res.json();

      if (data.discussion_key) {
        setActiveDiscussionKey(data.discussion_key);
        setIsAreaDiscussion(true);
        setMobileView('discussion');
      }
    } catch (error) {
      console.error('Error starting area discussion:', error);
    }
  }

  // Format coordinates for display
  function formatCoordinates(bounds: AreaBounds): string {
    const centerLat = ((bounds.north + bounds.south) / 2).toFixed(4);
    const centerLng = ((bounds.east + bounds.west) / 2).toFixed(4);
    return `${centerLat}, ${centerLng}`;
  }

  // Handle creating free-form discussion
  async function handleCreateFreeDiscussion(title: string, sourceUrl?: string) {
    try {
      const res = await fetch('/api/free-discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sourceUrl }),
      });
      const data = await res.json();

      if (data.discussion_key) {
        setActiveDiscussionKey(data.discussion_key);
        setIsAreaDiscussion(false);
        setSelectedCard(null);
        setSelectedAreaBounds(null);
        setMobileView('discussion');
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating free discussion:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // Determine if we should show the fixed bottom panel
  const showCardPanel = selectedCard && (mobileView === 'list' || !activeDiscussionKey);
  const showAreaPanel = selectedAreaBounds && !selectedCard && (mobileView === 'list' || !activeDiscussionKey);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Page header */}
      <header className="bg-white border-b p-3 md:p-4">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">データやマップから議論を始めよう</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Map + Card list */}
        <div
          className={`w-full md:w-1/2 flex flex-col md:border-r bg-white ${
            activeDiscussionKey && mobileView === 'discussion' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Scrollable content area */}
          <div className={`flex-1 p-3 md:p-4 overflow-y-auto ${(showCardPanel || showAreaPanel) ? 'pb-52 md:pb-4' : ''}`}>
            {/* Map section */}
            <div className="mb-4">
              <h2 className="text-base md:text-lg font-bold mb-2 text-gray-900">エリアで議論を始める</h2>
              <AreaMap
                onAreaSelected={handleAreaSelected}
                selectedBounds={selectedAreaBounds}
                onClearSelection={handleClearAreaSelection}
              />
            </div>

            {/* Divider */}
            <div className="border-t my-4" />

            {/* Data cards */}
            <DataCardList
              cards={cards}
              selectedCardId={selectedCard?.id || null}
              onSelectCard={handleSelectCard}
            />
          </div>
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
                <p className="text-sm md:text-base">地図でエリアを選択するか、</p>
                <p className="text-sm md:text-base">データカードを選んで</p>
                <p className="text-sm md:text-base mb-4">議論を始めましょう</p>
                <a
                  href="/discussions"
                  className="inline-block py-2 px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  進行中の議論を見る
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed panel for card detail */}
      {showCardPanel && (
        <div className={`fixed bottom-16 md:bottom-0 left-0 md:left-16 right-0 md:right-[calc(50%-2rem)] border-t bg-gray-50 shadow-lg z-10 ${
          activeDiscussionKey && mobileView === 'discussion' ? 'hidden md:block' : ''
        }`}>
          <div className="flex justify-end p-2 pb-0">
            <button
              onClick={() => setSelectedCard(null)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-3 md:px-4 pb-3 md:pb-4">
            <CardDetail card={selectedCard} />
          </div>
          <div className="p-3 md:p-4 pt-0 pb-6">
            <button
              onClick={handleStartDiscussion}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm md:text-base"
            >
              この課題を議論する
            </button>
          </div>
        </div>
      )}

      {/* Fixed panel for area discussion */}
      {showAreaPanel && selectedAreaBounds && (
        <div className={`fixed bottom-16 md:bottom-0 left-0 md:left-16 right-0 md:right-[calc(50%-2rem)] border-t bg-gray-50 shadow-lg z-10 ${
          activeDiscussionKey && mobileView === 'discussion' ? 'hidden md:block' : ''
        }`}>
          <div className="flex justify-end p-2 pb-0">
            <button
              onClick={handleClearAreaSelection}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-3 md:px-4 pb-3 md:pb-4">
            <div className="p-3 md:p-4 bg-white border rounded-lg">
              <h2 className="text-base md:text-xl font-bold mb-1.5 md:mb-2">
                {areaName || formatCoordinates(selectedAreaBounds)}
              </h2>
              <input
                type="text"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="エリアの名前を入力（任意）"
                className="w-full p-2 border rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-sm md:text-base text-gray-600">
                このエリアにはどんなお店、イベント、活動があると良いでしょうか？
              </p>
            </div>
          </div>
          <div className="p-3 md:p-4 pt-0 pb-6">
            <button
              onClick={handleStartAreaDiscussion}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium text-sm md:text-base"
            >
              このエリアについて議論する
            </button>
          </div>
        </div>
      )}

      {/* Floating action button - hide when discussion is open */}
      {!activeDiscussionKey && (
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

export default function DataPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    }>
      <DataPageContent />
    </Suspense>
  );
}
