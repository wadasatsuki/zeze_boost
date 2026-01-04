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
      <h2 className="text-lg font-bold mb-4">膳所学区 人口データ</h2>
      {cards.map((card) => (
        <div
          key={card.id}
          onClick={() => onSelectCard(card)}
          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
            selectedCardId === card.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <h3 className="font-medium text-sm">{card.title}</h3>
          <p className="text-xl font-bold text-blue-600">
            {card.value} <span className="text-sm text-gray-500">{card.unit}</span>
          </p>
          <p className="text-xs text-gray-400">{card.as_of}</p>
        </div>
      ))}
    </div>
  );
}
