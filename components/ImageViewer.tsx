'use client';

import { useContext, useRef } from 'react';
import { ImageContext } from '@/contexts/ImageContext';
import SplitView from './SplitView';
import OverlayView from './OverlayView';
import SliderView from './SliderView';

export default function ImageViewer() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { imageData, viewMode, handleImageUpload } = context;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      // 같은 파일을 다시 선택할 수 있도록 value 초기화
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const renderView = () => {
    if (!imageData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div 
            className="text-center max-w-md cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleClick}
          >
            <div className="mb-4">
              <svg
                className="w-24 h-24 mx-auto text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              이미지를 업로드하세요
            </h3>
            <p className="text-gray-500 mb-4">
              "새 이미지" 버튼을 클릭하여 이미지를 선택하세요
            </p>
            <p className="text-sm text-gray-600">
              또는 클립보드에서 이미지를 붙여넣으세요 (Ctrl+V / Cmd+V)
            </p>
            <p className="text-sm text-blue-400 mt-4">
              💡 이 영역을 클릭해도 이미지를 선택할 수 있습니다
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      );
    }

    switch (viewMode) {
      case 'overlay':
        return <OverlayView />;
      case 'split':
        return <SplitView />;
      case 'slider':
        return <SliderView />;
      default:
        return <OverlayView />;
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden bg-[#0f0f0f] bg-grid-pattern">
      {renderView()}
    </div>
  );
}

