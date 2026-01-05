'use client';

import { useContext } from 'react';
import { ImageContext } from '@/contexts/ImageContext';
import { Eye, EyeOff } from 'lucide-react';

export default function DetectedClasses() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { detectedClasses, toggleClassVisibility } = context;

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">
        DETECTED CLASSES ({detectedClasses.length})
      </h2>
      <div className="space-y-2">
        {detectedClasses.map((cls) => (
          <div
            key={cls.id}
            className="flex items-center justify-between p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: cls.color }}
              />
              <span className="text-sm text-gray-300 flex-1">{cls.name}</span>
              <span className="text-xs text-gray-500">{cls.count}</span>
            </div>
            <button
              onClick={() => toggleClassVisibility(cls.id)}
              className="ml-2 p-1 hover:bg-[#3a3a3a] rounded transition-colors"
            >
              {cls.visible ? (
                <Eye className="w-4 h-4 text-gray-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

