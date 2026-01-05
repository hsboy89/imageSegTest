'use client';

import { useContext } from 'react';
import { ImageContext } from '@/contexts/ImageContext';
import { Download } from 'lucide-react';
import { exportMaskResult } from '@/utils/export';

export default function ExportButton() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { imageData, detectedClasses } = context;

  const handleExport = async () => {
    if (!imageData) return;
    await exportMaskResult(imageData, detectedClasses);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!imageData}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
    >
      <Download className="w-4 h-4" />
      <span>Export Mask Result</span>
    </button>
  );
}

