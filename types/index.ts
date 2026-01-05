export interface DetectedClass {
  id: string;
  name: string;
  count: number;
  color: string;
  visible: boolean;
}

export interface ImageData {
  original: string;
  segmented: string;
  file?: File;
}

export interface MaskData {
  [className: string]: {
    mask: ImageData;
    bbox?: [number, number, number, number];
  };
}

export type ViewMode = 'overlay' | 'split' | 'slider';

