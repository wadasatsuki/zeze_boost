'use client';

import { useState, useRef, useCallback } from 'react';
import { AreaBounds } from '@/lib/types';

// Google My Maps embed URL
const MY_MAPS_EMBED_URL = 'https://www.google.com/maps/d/embed?mid=1VzpZ0JMnBa8Zbk10jtrnLGZMR7CCZWM';

// Approximate bounds for the Zeze area (for coordinate calculation)
const MAP_BOUNDS = {
  north: 35.0120,
  south: 34.9970,
  east: 135.8780,
  west: 135.8580,
};

interface Props {
  onAreaSelected: (bounds: AreaBounds) => void;
  selectedBounds: AreaBounds | null;
  onClearSelection: () => void;
}

export default function AreaMap({ onAreaSelected, selectedBounds, onClearSelection }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Convert pixel coordinates to approximate lat/lng
  const pixelToLatLng = useCallback((x: number, y: number, width: number, height: number) => {
    const lng = MAP_BOUNDS.west + (x / width) * (MAP_BOUNDS.east - MAP_BOUNDS.west);
    const lat = MAP_BOUNDS.north - (y / height) * (MAP_BOUNDS.north - MAP_BOUNDS.south);
    return { lat, lng };
  }, []);

  const handleStartSelection = () => {
    setShowOverlay(true);
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    if (selectedBounds) {
      onClearSelection();
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!showOverlay || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSelecting || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));

    setSelectionEnd({ x, y });
  };

  const handleMouseUp = () => {
    if (!isSelecting || !selectionStart || !selectionEnd || !containerRef.current) {
      setIsSelecting(false);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();

    // Calculate bounds from selection
    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const maxX = Math.max(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const maxY = Math.max(selectionStart.y, selectionEnd.y);

    // Only accept selection if it's large enough
    if (maxX - minX > 20 && maxY - minY > 20) {
      const nw = pixelToLatLng(minX, minY, rect.width, rect.height);
      const se = pixelToLatLng(maxX, maxY, rect.width, rect.height);

      onAreaSelected({
        north: nw.lat,
        south: se.lat,
        east: se.lng,
        west: nw.lng,
      });

      setShowOverlay(false);
    }

    setIsSelecting(false);
  };

  const handleCancelSelection = () => {
    setShowOverlay(false);
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    onClearSelection();
  };

  // Calculate selection rectangle style
  const getSelectionStyle = () => {
    if (!selectionStart || !selectionEnd) return {};

    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full h-64 md:h-80 rounded-lg border overflow-hidden"
      >
        {/* Google My Maps iframe with header cropped */}
        <div className="absolute inset-0 overflow-hidden">
          <iframe
            src={MY_MAPS_EMBED_URL}
            className="absolute w-full border-0"
            style={{
              top: '-55px',
              height: 'calc(100% + 55px)',
            }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Selection overlay */}
        {showOverlay && (
          <div
            className="absolute inset-0 bg-black/20 cursor-crosshair z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Selection rectangle */}
            {selectionStart && selectionEnd && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/30 pointer-events-none"
                style={getSelectionStyle()}
              />
            )}

            {/* Instructions */}
            <div className="absolute top-2 left-2 right-2 bg-white/90 rounded px-2 py-1 text-xs text-center">
              ドラッグしてエリアを選択してください
            </div>

            {/* Cancel button */}
            <button
              onClick={handleCancelSelection}
              className="absolute bottom-2 right-2 bg-white rounded px-2 py-1 text-xs text-gray-600 shadow"
            >
              キャンセル
            </button>
          </div>
        )}

        {/* Selected area indicator */}
        {selectedBounds && !showOverlay && (
          <div className="absolute top-2 left-2 bg-green-500 text-white rounded px-2 py-1 text-xs">
            エリア選択済み
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={handleStartSelection}
          disabled={showOverlay}
          className={`flex-1 md:flex-none px-3 py-2 text-xs md:text-sm rounded-lg transition-colors ${
            showOverlay
              ? 'bg-blue-100 text-blue-600 border border-blue-300'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {showOverlay ? 'エリアを選択中...' : 'エリアを選択'}
        </button>
        {selectedBounds && (
          <button
            onClick={clearSelection}
            className="flex-1 md:flex-none px-3 py-2 text-xs md:text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            選択を解除
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-600">
        「エリアを選択」をタップして、地図上でドラッグしてエリアを選んでください
      </p>
    </div>
  );
}
