'use client';

import { DataCard } from '@/lib/types';

interface Props {
  cards: DataCard[];
  selectedCardId: string | null;
  onSelectCard: (card: DataCard) => void;
}

export default function DataCardList({ cards, selectedCardId, onSelectCard }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4">膳所学区 人口データ</h2>
      {cards.map((card) => (
        <div
          key={card.id}
          onClick={() => onSelectCard(card)}
          className={`p-2.5 md:p-3 border rounded-lg cursor-pointer transition-colors active:scale-[0.98] ${
            selectedCardId === card.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-400 active:bg-gray-50'
          }`}
        >
          <h3 className="font-medium text-xs md:text-sm">{card.title}</h3>
          <p className="text-lg md:text-xl font-bold text-blue-600">
            {card.value} <span className="text-xs md:text-sm text-gray-500">{card.unit}</span>
          </p>
          <p className="text-xs text-gray-400">{card.as_of}</p>
        </div>
      ))}
    </div>
  );
}
