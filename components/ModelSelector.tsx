'use client';

import { useState } from 'react';
import { MODELS } from '@/utils/aiModel';
import type { ModelConfig } from '@/utils/aiModel';

interface ModelSelectorProps {
  selectedModel: ModelConfig;
  onModelChange: (model: ModelConfig) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  return (
    <div className="p-4 border-b border-[#2a2a2a]">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">MODEL SELECTION</h2>
      <div className="space-y-2">
        {MODELS.map((model) => (
          <button
            key={model.name}
            onClick={() => onModelChange(model)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedModel.url === model.url
                ? 'bg-blue-600 text-white'
                : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
            }`}
          >
            {model.name}
          </button>
        ))}
      </div>
    </div>
  );
}

