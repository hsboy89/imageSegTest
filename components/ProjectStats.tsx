'use client';

import { useContext } from 'react';
import { ImageContext } from '@/contexts/ImageContext';

export default function ProjectStats() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { inferenceTime, confidence } = context;

  return (
    <div className="p-4 border-b border-[#2a2a2a]">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">PROJECT STATS</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Inference Time</span>
          <span className="text-sm font-semibold text-green-400">{inferenceTime} ms</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Confidence</span>
          <span className="text-sm font-semibold text-blue-400">{confidence.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

