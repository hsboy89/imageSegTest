'use client';

import { useContext, useState, useCallback } from 'react';
import { ImageContext } from '@/contexts/ImageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SliderView() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { imageData } = context;
  const [sliderPosition, setSliderPosition] = useState(50);

  if (!imageData) return null;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    },
    []
  );

  const handleMouseDown = useCallback(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      const container = document.querySelector('.slider-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div
      className="slider-container h-full relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 flex">
        {/* Segmented Image */}
        <div
          className="overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={imageData.segmented}
            alt="Segmented"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-10 flex items-center justify-center"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
            <ChevronLeft className="w-4 h-4 text-gray-800" />
            <ChevronRight className="w-4 h-4 text-gray-800 -ml-1" />
          </div>
        </div>

        {/* Original Image */}
        <div
          className="overflow-hidden"
          style={{ width: `${100 - sliderPosition}%`, marginLeft: 'auto' }}
        >
          <img
            src={imageData.original}
            alt="Original"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

