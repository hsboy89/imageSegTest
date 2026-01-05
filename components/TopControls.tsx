'use client';

import { useContext } from 'react';
import { ImageContext } from '@/contexts/ImageContext';

interface TopControlsProps {
  onNewImage: () => void;
}

export default function TopControls({ onNewImage }: TopControlsProps) {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { viewMode, setViewMode } = context;

  const buttons = [
    { id: 'overlay' as const, label: '오버레이' },
    { id: 'slider' as const, label: '슬라이더' },
    { id: 'split' as const, label: '분할' },
  ];

  return (
    <div className="flex items-center gap-2 p-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => setViewMode(button.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === button.id
              ? 'bg-blue-600 text-white'
              : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
          }`}
        >
          {button.label}
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={onNewImage}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] transition-colors"
      >
        새 이미지
      </button>
    </div>
  );
}

