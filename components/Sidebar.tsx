'use client';

import { useContext } from 'react';
import { ImageContext } from '@/contexts/ImageContext';
import { Eye, EyeOff, Download } from 'lucide-react';
import ProjectStats from './ProjectStats';
import VisualizationPanel from './VisualizationPanel';
import DetectedClasses from './DetectedClasses';
import ExportButton from './ExportButton';
import ModelSelector from './ModelSelector';

export default function Sidebar() {
  const context = useContext(ImageContext);
  if (!context) return null;

  const { selectedModel, setSelectedModel } = context;

  return (
    <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">VE</span>
          </div>
          <h1 className="text-xl font-bold">VisionEdge</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Model Selector */}
        <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />

        {/* Project Stats */}
        <ProjectStats />

        {/* Visualization Panel */}
        <VisualizationPanel />

        {/* Detected Classes */}
        <DetectedClasses />
      </div>

      {/* Export Button */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <ExportButton />
      </div>
    </div>
  );
}

