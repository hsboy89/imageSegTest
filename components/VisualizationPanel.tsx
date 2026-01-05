'use client';

import { useContext } from 'react';
import { ImageContext } from '@/contexts/ImageContext';

export default function VisualizationPanel() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { maskOpacity, showBoundaries, setMaskOpacity, setShowBoundaries } = context;

  return (
    <div className="p-4 border-b border-[#2a2a2a]">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">VISUALIZATION</h2>
      <div className="space-y-4">
        {/* Mask Opacity Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Mask Opacity</span>
            <span className="text-sm font-semibold text-white">{maskOpacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={maskOpacity}
            onChange={(e) => setMaskOpacity(Number(e.target.value))}
            className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Show Boundaries Toggle */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Show Boundaries</span>
          <button
            onClick={() => setShowBoundaries(!showBoundaries)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showBoundaries ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showBoundaries ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

