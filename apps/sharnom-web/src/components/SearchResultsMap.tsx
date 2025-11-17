'use client';

import { useEffect, useRef } from 'react';
import { YellowBookEntry } from '@sharnom/contracts';

interface SearchResultsMapProps {
  entries: YellowBookEntry[];
}

// Client-side interactive map component (Islands Architecture)
export function SearchResultsMap({ entries }: SearchResultsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined' || !mapRef.current) return;

    const currentMap = mapRef.current;

    // Calculate center point from all entries
    const avgLat = entries.reduce((sum, e) => sum + e.latitude, 0) / entries.length;
    const avgLng = entries.reduce((sum, e) => sum + e.longitude, 0) / entries.length;

    // Create map markers HTML
    const markersHTML = entries
      .map(
        (entry) => `
        <div class="marker" style="
          position: absolute;
          left: ${((entry.longitude - avgLng + 0.02) / 0.04) * 100}%;
          top: ${((avgLat - entry.latitude + 0.02) / 0.04) * 100}%;
          transform: translate(-50%, -100%);
        ">
          <div class="marker-pin" style="
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            background: #3b82f6;
            position: relative;
            transform: rotate(-45deg);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <div style="
              position: absolute;
              width: 16px;
              height: 16px;
              background: white;
              border-radius: 50%;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            "></div>
          </div>
          <div class="marker-label" style="
            position: absolute;
            top: -35px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
          ">${entry.name}</div>
        </div>
      `
      )
      .join('');

    currentMap.innerHTML = markersHTML;

    // hover effects
    const markers = currentMap.querySelectorAll('.marker');
    markers.forEach((marker) => {
      marker.addEventListener('mouseenter', () => {
        const label = marker.querySelector('.marker-label') as HTMLElement;
        if (label) label.style.opacity = '1';
      });
      marker.addEventListener('mouseleave', () => {
        const label = marker.querySelector('.marker-label') as HTMLElement;
        if (label) label.style.opacity = '0';
      });
    });

    return () => {
      // Cleanup
      currentMap.innerHTML = '';
    };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🗺️</span>
        <span>Хайлтын үр дүнгийн байршил</span>
        <span className="text-sm font-normal text-gray-500">({entries.length} олдлоо)</span>
      </h3>
      <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ height: '400px' }}>
        {/* Background map (static) */}
        <iframe
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${
            entries.reduce((min, e) => Math.min(min, e.longitude), Infinity) - 0.02
          },${
            entries.reduce((min, e) => Math.min(min, e.latitude), Infinity) - 0.02
          },${
            entries.reduce((max, e) => Math.max(max, e.longitude), -Infinity) + 0.02
          },${
            entries.reduce((max, e) => Math.max(max, e.latitude), -Infinity) + 0.02
          }&layer=mapnik`}
          allowFullScreen
          title="Search results map"
        ></iframe>

        {/* Interactive markers overlay (client-side) */}
        <div
          ref={mapRef}
          className="absolute inset-0 pointer-events-auto"
          style={{ zIndex: 10 }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        💡 Газрын зурган дээр маркер дээр хулгана аваачихад компанийн нэр харагдана
      </p>
    </div>
  );
}
