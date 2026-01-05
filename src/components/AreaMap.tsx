'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AreaBounds } from '@/lib/types';

// Zeze area center coordinates (approximate)
const ZEZE_CENTER = { lat: 35.0045, lng: 135.8680 };
const ZEZE_ZOOM = 15;

interface Props {
  onAreaSelected: (bounds: AreaBounds) => void;
  selectedBounds: AreaBounds | null;
  onClearSelection: () => void;
}

export default function AreaMap({ onAreaSelected, selectedBounds, onClearSelection }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [currentRectangle, setCurrentRectangle] = useState<google.maps.Rectangle | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setMapError('Google Maps APIキーが設定されていません');
      setIsLoading(false);
      return;
    }

    // Load Google Maps via script tag
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Define callback
    (window as any).initMap = () => {
      if (!mapRef.current) return;

      try {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: ZEZE_CENTER,
          zoom: ZEZE_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        const drawingManagerInstance = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          rectangleOptions: {
            fillColor: '#3B82F6',
            fillOpacity: 0.3,
            strokeColor: '#2563EB',
            strokeWeight: 2,
            editable: true,
            draggable: true,
          },
        });

        drawingManagerInstance.setMap(mapInstance);

        google.maps.event.addListener(
          drawingManagerInstance,
          'rectanglecomplete',
          (rectangle: google.maps.Rectangle) => {
            setCurrentRectangle((prev) => {
              if (prev) prev.setMap(null);
              return rectangle;
            });
            setIsDrawing(false);
            drawingManagerInstance.setDrawingMode(null);

            const bounds = rectangle.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              onAreaSelected({
                north: ne.lat(),
                south: sw.lat(),
                east: ne.lng(),
                west: sw.lng(),
              });
            }

            // Listen for bounds changes when rectangle is edited
            google.maps.event.addListener(rectangle, 'bounds_changed', () => {
              const newBounds = rectangle.getBounds();
              if (newBounds) {
                const ne = newBounds.getNorthEast();
                const sw = newBounds.getSouthWest();
                onAreaSelected({
                  north: ne.lat(),
                  south: sw.lat(),
                  east: ne.lng(),
                  west: sw.lng(),
                });
              }
            });
          }
        );

        setMap(mapInstance);
        setDrawingManager(drawingManagerInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('地図の初期化に失敗しました');
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setMapError('地図の読み込みに失敗しました');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      delete (window as any).initMap;
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [onAreaSelected]);

  // Update rectangle when selectedBounds changes externally
  useEffect(() => {
    if (!map || !selectedBounds) return;

    if (currentRectangle) {
      const bounds = new google.maps.LatLngBounds(
        { lat: selectedBounds.south, lng: selectedBounds.west },
        { lat: selectedBounds.north, lng: selectedBounds.east }
      );
      currentRectangle.setBounds(bounds);
    }
  }, [selectedBounds, map, currentRectangle]);

  const startDrawing = useCallback(() => {
    if (drawingManager) {
      // Clear existing rectangle
      if (currentRectangle) {
        currentRectangle.setMap(null);
        setCurrentRectangle(null);
        onClearSelection();
      }
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
      setIsDrawing(true);
    }
  }, [drawingManager, currentRectangle, onClearSelection]);

  const clearSelection = useCallback(() => {
    if (currentRectangle) {
      currentRectangle.setMap(null);
      setCurrentRectangle(null);
    }
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    setIsDrawing(false);
    onClearSelection();
  }, [currentRectangle, drawingManager, onClearSelection]);

  if (mapError) {
    return (
      <div className="w-full h-48 md:h-64 bg-gray-100 flex items-center justify-center rounded-lg border">
        <div className="text-center text-gray-500 p-4">
          <p className="text-sm">{mapError}</p>
          <p className="text-xs mt-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を .env.local に設定してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-48 md:h-64 rounded-lg border overflow-hidden bg-gray-100"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500 text-sm">地図を読み込み中...</p>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={startDrawing}
          disabled={isDrawing || isLoading}
          className={`flex-1 md:flex-none px-3 py-2 text-xs md:text-sm rounded-lg transition-colors ${
            isDrawing
              ? 'bg-blue-100 text-blue-600 border border-blue-300'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400'
          }`}
        >
          {isDrawing ? 'エリアを描画中...' : 'エリアを選択'}
        </button>
        {(selectedBounds || currentRectangle) && (
          <button
            onClick={clearSelection}
            className="flex-1 md:flex-none px-3 py-2 text-xs md:text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            選択を解除
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        「エリアを選択」をタップして、地図上で四角形を描いてください
      </p>
    </div>
  );
}
