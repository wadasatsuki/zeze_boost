'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const heroImages = [
  '/photo/top_1.jpg',
  '/photo/top_2.jpg',
  '/photo/top_3.jpg',
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Switch every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Hero Section - Full screen */}
      <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Images */}
        {heroImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={src}
              alt={`Hero image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Hero Content - Centered */}
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-wider drop-shadow-lg mb-6">
            ZEZE BOOST
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl lg:text-3xl text-white font-medium mb-8 drop-shadow-md">
            膳所の未来をみんなで考えよう
          </p>

          {/* Description */}
          <p className="text-sm md:text-base text-white/90 mb-8 drop-shadow">
            滋賀県大津市膳所地域について議論をかわしましょう
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/data"
              className="py-3 px-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base md:text-lg shadow-lg"
            >
              データを見る
            </Link>
            <Link
              href="/discussions"
              className="py-3 px-8 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-medium text-base md:text-lg shadow-lg"
            >
              議論に参加する
            </Link>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
