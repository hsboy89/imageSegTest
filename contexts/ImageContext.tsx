'use client';

import { createContext } from 'react';
import type { DetectedClass, ImageData, ViewMode } from '@/types';
import type { ModelConfig } from '@/utils/aiModel';

export interface ImageContextType {
  imageData: ImageData | null;
  detectedClasses: DetectedClass[];
  inferenceTime: number;
  confidence: number;
  maskOpacity: number;
  showBoundaries: boolean;
  viewMode: ViewMode;
  selectedModel: ModelConfig;
  setImageData: (data: ImageData | null) => void;
  setDetectedClasses: (classes: DetectedClass[]) => void;
  setInferenceTime: (time: number) => void;
  setConfidence: (confidence: number) => void;
  setMaskOpacity: (opacity: number) => void;
  setShowBoundaries: (show: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedModel: (model: ModelConfig) => void;
  handleImageUpload: (file: File | null) => void;
  toggleClassVisibility: (id: string) => void;
}

export const ImageContext = createContext<ImageContextType | null>(null);

