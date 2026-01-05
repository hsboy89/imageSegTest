'use client';

import { useContext } from 'react';
import { ImageContext } from '@/contexts/ImageContext';

export default function OverlayView() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { imageData, maskOpacity, detectedClasses } = context;

  if (!imageData) return null;

  const visibleClasses = detectedClasses.filter((cls) => cls.visible);

  return (
    <div className="h-full flex items-center justify-center p-8 relative">
      <div className="relative max-w-full max-h-full">
        <img
          src={imageData.original}
          alt="Original"
          className="max-w-full max-h-full object-contain"
        />
        {/* TODO: 실제 마스크 오버레이 렌더링 */}
        {visibleClasses.length > 0 && (
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              opacity: maskOpacity / 100,
            }}
          >
            <img
              src={imageData.segmented}
              alt="Mask Overlay"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

