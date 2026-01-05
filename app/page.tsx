'use client';

import { useState, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import ImageViewer from '@/components/ImageViewer';
import TopControls from '@/components/TopControls';
import { ImageContext } from '@/contexts/ImageContext';
import type { DetectedClass, ImageData } from '@/types';
import { MODELS } from '@/utils/aiModel';
import type { ModelConfig } from '@/utils/aiModel';
import { runInference } from '@/utils/aiModel';
import { renderSegmentedImage, getClassColor } from '@/utils/visualization';
import type { MaskData } from '@/utils/visualization';

export default function Home() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [detectedClasses, setDetectedClasses] = useState<DetectedClass[]>([]);
  const [inferenceTime, setInferenceTime] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [maskOpacity, setMaskOpacity] = useState<number>(46);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'overlay' | 'split' | 'slider'>('overlay');
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (file: File | null) => {
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      
      // 원본 이미지 먼저 설정
      setImageData({
        original: imageUrl,
        segmented: imageUrl, // 임시로 원본과 동일
        file: file,
      });

      try {
        // 실제 YOLOv8-seg 모델 추론 실행
        console.log('추론 시작...');
        const result = await runInference({ original: imageUrl }, selectedModel);
        console.log('추론 완료:', result);

        // 결과 확인
        if (result.classes.length === 0) {
          console.warn('감지된 객체가 없습니다. 모델이 제대로 작동하지 않을 수 있습니다.');
          alert('이미지에서 객체를 감지하지 못했습니다. 다른 이미지를 시도해보세요.');
        }

        // 클래스별로 그룹화
        const classMap = new Map<string, { count: number; color: string; confidences: number[] }>();
        const masksData: MaskData[] = [];

        for (let i = 0; i < result.classes.length; i++) {
          const cls = result.classes[i];
          const className = cls.name;
          
          if (!classMap.has(className)) {
            classMap.set(className, {
              count: 0,
              color: getClassColor(className),
              confidences: [],
            });
          }

          const classInfo = classMap.get(className)!;
          classInfo.count++;
          classInfo.confidences.push(cls.confidence);

          // 마스크 데이터 추가
          if (i < result.masks.length) {
            const maskBuffer = result.masks[i];
            masksData.push({
              mask: new Uint8Array(maskBuffer),
              className,
              color: classInfo.color,
              confidence: cls.confidence,
              bbox: cls.bbox,
            });
          }
        }

        // 감지된 클래스 목록 생성
        const detectedClassesList = Array.from(classMap.entries()).map(([name, info], idx) => ({
          id: String(idx + 1),
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count: info.count,
          color: info.color,
          visible: true,
        }));

        setDetectedClasses(detectedClassesList);
        setInferenceTime(result.inferenceTime);
        
        // 평균 confidence 계산
        const allConfidences = Array.from(classMap.values()).flatMap(info => info.confidences);
        const avgConfidence = allConfidences.length > 0
          ? (allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length) * 100
          : 0;
        setConfidence(avgConfidence);

        // 세그멘테이션 이미지 생성
        const segmentedUrl = await renderSegmentedImage(
          imageUrl,
          masksData,
          maskOpacity / 100,
          showBoundaries
        );

        // 분할된 이미지 업데이트
        setImageData({
          original: imageUrl,
          segmented: segmentedUrl,
          file: file,
        });
      } catch (error) {
        console.error('이미지 처리 오류:', error);
        // 오류 발생 시 원본 이미지만 사용
        setImageData({
          original: imageUrl,
          segmented: imageUrl,
          file: file,
        });
        setDetectedClasses([]);
        setInferenceTime(0);
        setConfidence(0);
        alert(`이미지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [selectedModel]);

  const handleNewImage = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('fileInputRef가 null입니다.');
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      // 같은 파일을 다시 선택할 수 있도록 value 초기화
      if (e.target) {
        e.target.value = '';
      }
    }
  }, [handleImageUpload]);

  const toggleClassVisibility = useCallback((id: string) => {
    setDetectedClasses((prev) =>
      prev.map((cls) => (cls.id === id ? { ...cls, visible: !cls.visible } : cls))
    );
  }, []);

  const contextValue = {
    imageData,
    detectedClasses,
    inferenceTime,
    confidence,
    maskOpacity,
    showBoundaries,
    viewMode,
    selectedModel,
    setImageData,
    setDetectedClasses,
    setInferenceTime,
    setConfidence,
    setMaskOpacity,
    setShowBoundaries,
    setViewMode,
    setSelectedModel,
    handleImageUpload,
    toggleClassVisibility,
  };

  return (
    <ImageContext.Provider value={contextValue}>
      <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopControls onNewImage={handleNewImage} />
          <ImageViewer />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </ImageContext.Provider>
  );
}

