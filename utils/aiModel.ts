/**
 * AI 모델 통합 유틸리티
 * ONNX Runtime Web을 사용하여 브라우저에서 직접 추론 수행
 */

import * as ort from 'onnxruntime-web';
import type { ImageData } from '@/types';

// ONNX Runtime 초기화 전에 경고 억제 설정
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString?.() || '';
    // CPU vendor 경고는 무시
    if (message.includes('cpuinfo_vendor') || message.includes('Unknown CPU vendor')) {
      return;
    }
    originalError.apply(console, args);
  };
}

export interface ModelConfig {
  name: string;
  url: string;
  inputSize: [number, number];
  type: 'sam' | 'yolo';
}

export const MODELS: ModelConfig[] = [
  {
    name: 'YOLOv8n-seg (Fast)',
    url: '/models/yolov8n-seg.onnx',
    inputSize: [640, 640],
    type: 'yolo',
  },
  {
    name: 'YOLOv8n-seg (Accurate)',
    url: '/models/yolov8n-seg.onnx',
    inputSize: [640, 640],
    type: 'yolo',
  },
];

let currentSession: ort.InferenceSession | null = null;
let currentModel: ModelConfig | null = null;

/**
 * 모델 로드
 */
export async function loadModel(modelConfig: ModelConfig): Promise<ort.InferenceSession> {
  if (currentModel?.url === modelConfig.url && currentSession) {
    return currentSession;
  }

  try {
    // ONNX Runtime Web 설정
    // 브라우저 환경에서는 단일 스레드 사용 (crossOriginIsolated 모드 필요 없음)
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = false; // SIMD는 crossOriginIsolated 모드 필요
    
    // 경고 메시지 억제 (CPU vendor 경고는 기능에 영향 없음)
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      // CPU vendor 경고는 무시
      if (message.includes('cpuinfo_vendor') || message.includes('Unknown CPU vendor')) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    console.error = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      // CPU vendor 경고는 무시
      if (message.includes('cpuinfo_vendor') || message.includes('Unknown CPU vendor')) {
        return;
      }
      originalError.apply(console, args);
    };
    
    const session = await ort.InferenceSession.create(modelConfig.url, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    
    // 원래 console 함수 복원
    console.warn = originalWarn;
    console.error = originalError;

    currentSession = session;
    currentModel = modelConfig;
    return session;
  } catch (error) {
    console.error('모델 로드 실패:', error);
    console.error('모델 URL:', modelConfig.url);
    console.error('에러 상세:', error);
    throw new Error(`모델 로드 실패: ${error instanceof Error ? error.message : String(error)}. 모델 파일이 ${modelConfig.url}에 있는지 확인하세요.`);
  }
}

/**
 * 이미지 전처리
 */
export function preprocessImage(
  image: HTMLImageElement | HTMLCanvasElement,
  inputSize: [number, number]
): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = inputSize[0];
  canvas.height = inputSize[1];
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.');

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // RGB로 변환 및 정규화 (0-255 -> 0-1)
  const data = new Float32Array(3 * canvas.width * canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const idx = i / 4;
    data[idx] = imageData.data[i] / 255.0; // R
    data[canvas.width * canvas.height + idx] = imageData.data[i + 1] / 255.0; // G
    data[2 * canvas.width * canvas.height + idx] = imageData.data[i + 2] / 255.0; // B
  }

  return data;
}

/**
 * 추론 수행
 */
export async function runInference(
  imageData: ImageData,
  modelConfig: ModelConfig
): Promise<{
  masks: ArrayBuffer[];
  classes: Array<{ name: string; confidence: number; bbox: [number, number, number, number] }>;
  inferenceTime: number;
}> {
  const session = await loadModel(modelConfig);

  // 이미지 로드
  const img = new Image();
  img.src = imageData.original;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const originalWidth = img.width;
  const originalHeight = img.height;

  // 전처리
  const inputData = preprocessImage(img, modelConfig.inputSize);

  // 입력 텐서 생성
  const tensor = new ort.Tensor('float32', inputData, [1, 3, modelConfig.inputSize[1], modelConfig.inputSize[0]]);

  // 추론 실행
  const startTime = performance.now();
  const feeds: Record<string, ort.Tensor> = {};
  const inputName = session.inputNames[0];
  feeds[inputName] = tensor;

  const results = await session.run(feeds);
  const inferenceTime = performance.now() - startTime;

  // YOLOv8-seg 출력 후처리
  console.log('추론 결과:', results);
  console.log('출력 개수:', Object.keys(results).length);
  
  if (modelConfig.type === 'yolo') {
    const outputValues = Object.values(results);
    console.log('출력 텐서 개수:', outputValues.length);
    console.log('출력 텐서 형태:', outputValues.map(t => t.dims));
    console.log('출력 텐서 이름:', Object.keys(results));
    
    // 첫 번째 출력 텐서의 실제 데이터 샘플 확인
    if (outputValues.length > 0) {
      const firstOutput = outputValues[0];
      const sampleData = (firstOutput.data as Float32Array).slice(0, 20);
      console.log('첫 번째 출력 텐서 데이터 샘플 (처음 20개):', Array.from(sampleData));
    }
    
    if (outputValues.length >= 2) {
      try {
        const { processYOLOOutput, generateMask, getClassName } = await import('./yoloInference');
        
        console.log('YOLO 후처리 시작...');
        // confidence threshold를 높여서 false positive 줄이기 (0.9로 설정)
        const yoloResult = processYOLOOutput(
          outputValues,
          originalWidth,
          originalHeight,
          modelConfig.inputSize[0],
          0.9  // confidence threshold를 0.9로 설정
        );
        console.log('YOLO 후처리 완료. 감지된 객체:', yoloResult.detections.length);
        
        // 감지된 클래스 확인
        if (yoloResult.detections.length > 0) {
          const classCounts = new Map<number, { name: string; count: number }>();
          yoloResult.detections.forEach(det => {
            const name = getClassName(det.classId);
            const existing = classCounts.get(det.classId);
            if (existing) {
              existing.count++;
            } else {
              classCounts.set(det.classId, { name, count: 1 });
            }
          });
          console.log('감지된 클래스별 개수:', Array.from(classCounts.values()).map(c => `${c.name}: ${c.count}개`));
        } else {
          console.warn('감지된 객체가 없습니다!');
        }

        const masks: ArrayBuffer[] = [];
        const classes: Array<{ name: string; confidence: number; bbox: [number, number, number, number] }> = [];

        const masksTensor = outputValues[1];
        const protoMasks = masksTensor.data as Float32Array;
        console.log('프로토마스크 크기:', protoMasks.length);

        for (const det of yoloResult.detections) {
          if (det.mask) {
            try {
              console.log(`마스크 생성 시작: 클래스=${getClassName(det.classId)}, confidence=${det.confidence.toFixed(3)}, bbox=[${det.bbox.map(v => v.toFixed(1)).join(', ')}]`);
              const mask = generateMask(
                det.mask,
                protoMasks,
                det.bbox,
                originalWidth,
                originalHeight,
                modelConfig.inputSize[0]
              );
              
              // 마스크가 비어있는지 확인
              const maskPixelCount = Array.from(mask).filter(v => v > 128).length;
              console.log(`마스크 생성 완료: 크기=${mask.length}, 활성 픽셀=${maskPixelCount}개`);
              
              if (maskPixelCount > 0) {
                masks.push(new Uint8Array(mask).buffer);
              } else {
                console.warn(`마스크가 비어있음: 클래스=${getClassName(det.classId)}`);
              }
            } catch (maskError) {
              console.error('마스크 생성 오류:', maskError, det);
            }
          } else {
            console.warn(`마스크 계수가 없음: 클래스=${getClassName(det.classId)}`);
          }

          classes.push({
            name: getClassName(det.classId),
            confidence: det.confidence,
            bbox: det.bbox,
          });
        }

        console.log('최종 결과 - 마스크:', masks.length, '클래스:', classes.length);
        return {
          masks,
          classes,
          inferenceTime: Math.round(inferenceTime),
        };
      } catch (error) {
        console.error('YOLO 후처리 오류:', error);
        console.error('에러 스택:', error instanceof Error ? error.stack : String(error));
        throw error; // 에러를 다시 throw하여 상위에서 처리할 수 있도록
      }
    } else {
      console.error('출력 텐서가 부족합니다. 예상: 2개, 실제:', outputValues.length);
    }
  }

  console.warn('추론 결과가 비어있습니다.');
  return {
    masks: [],
    classes: [],
    inferenceTime: Math.round(inferenceTime),
  };
}

/**
 * 마스크를 이미지로 변환
 */
export function maskToImage(
  mask: ArrayBuffer,
  width: number,
  height: number,
  color: string = '#ffffff'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const maskData = new Uint8Array(mask);
  const imageData = ctx.createImageData(width, height);

  const rgb = hexToRgb(color);
  if (!rgb) return '';

  for (let i = 0; i < maskData.length; i++) {
    const idx = i * 4;
    imageData.data[idx] = rgb.r; // R
    imageData.data[idx + 1] = rgb.g; // G
    imageData.data[idx + 2] = rgb.b; // B
    imageData.data[idx + 3] = maskData[i]; // A
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

