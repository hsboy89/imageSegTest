'use client';

import { useContext } from 'react';
import { ImageContext } from '@/contexts/ImageContext';

export default function SplitView() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { imageData } = context;

  if (!imageData) return null;

  return (
    <div className="h-full flex">
      <div className="flex-1 overflow-hidden">
        <img
          src={imageData.segmented}
          alt="Segmented"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="w-px bg-[#2a2a2a]" />
      <div className="flex-1 overflow-hidden">
        <img
          src={imageData.original}
          alt="Original"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

