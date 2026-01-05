'use client';

import { DataCard } from '@/lib/types';

interface Props {
  card: DataCard;
}

export default function CardDetail({ card }: Props) {
  return (
    <div className="p-3 md:p-4 bg-white border rounded-lg">
      <h2 className="text-base md:text-xl font-bold mb-1.5 md:mb-2">{card.title}</h2>
      <div className="space-y-1.5 md:space-y-2">
        <p className="text-2xl md:text-3xl font-bold text-blue-600">
          {card.value} <span className="text-sm md:text-lg text-gray-500">{card.unit}</span>
        </p>
        <p className="text-sm md:text-base text-gray-600">{card.description}</p>
        <div className="text-xs md:text-sm text-gray-400">
          <p>時点: {card.as_of}</p>
          <p className="truncate">
            出典:{' '}
            <a
              href={card.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              {card.source_url}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
