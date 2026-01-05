/**
 * YOLOv8-seg 추론 및 후처리
 */

import * as ort from 'onnxruntime-web';

export interface YOLODetection {
  classId: number;
  confidence: number;
  bbox: [number, number, number, number]; // x, y, width, height
  mask?: Float32Array; // 프로토마스크 인덱스
}

export interface YOLOResult {
  detections: YOLODetection[];
  inferenceTime: number;
  originalWidth: number;
  originalHeight: number;
}

const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
  'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

/**
 * YOLOv8-seg 추론 결과 후처리
 */
export function processYOLOOutput(
  outputs: ort.Tensor[],
  originalWidth: number,
  originalHeight: number,
  inputSize: number = 640,
  confThreshold: number = 0.5, // confidence threshold를 0.5로 상향
  iouThreshold: number = 0.45
): YOLOResult {
  // YOLOv8-seg 출력: [detections, masks]
  // detections: [1, 8400, 116] 또는 [1, 116, 8400] - (x, y, w, h, class_conf_0...class_conf_79, mask_coeff_0...mask_coeff_31)
  // masks: [1, 32, 160, 160] - 프로토타입 마스크

  const detectionsTensor = outputs[0];
  const masksTensor = outputs[1];

  const detectionsData = detectionsTensor.data as Float32Array;
  const masksData = masksTensor.data as Float32Array;
  
  // 텐서 차원 확인
  const dims = detectionsTensor.dims;
  console.log('Detections 텐서 차원:', dims);
  
  // 차원에 따라 데이터 접근 방식 결정
  // [1, 8400, 116] 형식인지 [1, 116, 8400] 형식인지 확인
  const isTransposed = dims[1] === 8400 && dims[2] === 116;
  const numBoxes = isTransposed ? dims[1] : dims[2];
  const boxSize = dims[isTransposed ? 2 : 1];

  console.log(`텐서 형식: ${isTransposed ? '[1, 8400, 116]' : '[1, 116, 8400]'}, 박스 개수: ${numBoxes}, 박스 크기: ${boxSize}`);

  const detections: YOLODetection[] = [];

  // 스케일 팩터
  const scaleX = originalWidth / inputSize;
  const scaleY = originalHeight / inputSize;

  // 박스 처리
  for (let i = 0; i < numBoxes; i++) {
    let offset: number;
    if (isTransposed) {
      // [1, 8400, 116] 형식: offset = i * 116
      offset = i * boxSize;
    } else {
      // [1, 116, 8400] 형식: offset = i * 116 (기존 방식)
      offset = i * boxSize;
    }
    
    // 바운딩 박스 (YOLOv8-seg는 입력 크기 기준 좌표 사용)
    const x = detectionsData[offset];
    const y = detectionsData[offset + 1];
    const w = detectionsData[offset + 2];
    const h = detectionsData[offset + 3];

    // 바운딩 박스 유효성 검사
    // w, h는 양수여야 함
    if (w <= 0 || h <= 0) continue;
    
    // 디버깅: 처음 몇 개 박스의 좌표 확인
    if (i < 5) {
      console.log(`박스 ${i}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, w=${w.toFixed(2)}, h=${h.toFixed(2)}`);
    }

    // 클래스 확률 찾기 (YOLOv8-seg는 raw logits이므로 sigmoid 적용 필요)
    let maxConf = 0;
    let classId = 0;
    for (let j = 0; j < 80; j++) {
      const rawLogit = detectionsData[offset + 4 + j];
      // Sigmoid 적용하여 확률로 변환
      const conf = 1 / (1 + Math.exp(-rawLogit));
      if (conf > maxConf) {
        maxConf = conf;
        classId = j;
      }
    }

    // confidence threshold 필터링
    if (maxConf < confThreshold) continue;

    // 바운딩 박스를 원본 이미지 크기로 변환
    // YOLOv8-seg는 입력 크기(640) 기준 좌표를 사용하므로 스케일링 필요
    const bbox: [number, number, number, number] = [
      (x / inputSize) * originalWidth,
      (y / inputSize) * originalHeight,
      (w / inputSize) * originalWidth,
      (h / inputSize) * originalHeight,
    ];

    // 너무 작은 바운딩 박스 필터링 (최소 크기: 10x10 픽셀)
    if (bbox[2] < 10 || bbox[3] < 10) continue;

    // 이미지 범위를 벗어나는 바운딩 박스 필터링
    const bboxXMin = bbox[0] - bbox[2] / 2;
    const bboxYMin = bbox[1] - bbox[3] / 2;
    const bboxXMax = bbox[0] + bbox[2] / 2;
    const bboxYMax = bbox[1] + bbox[3] / 2;
    
    if (bboxXMin < -bbox[2] || bboxYMin < -bbox[3] || 
        bboxXMax > originalWidth + bbox[2] || bboxYMax > originalHeight + bbox[3]) {
      continue;
    }

    // 마스크 계수 추출 (32개)
    const maskCoeffs = new Float32Array(32);
    for (let j = 0; j < 32; j++) {
      maskCoeffs[j] = detectionsData[offset + 84 + j];
    }

    detections.push({
      classId,
      confidence: maxConf,
      bbox,
      mask: maskCoeffs,
    });
  }

  // NMS (Non-Maximum Suppression) 적용
  // confidence가 높은 순서로 정렬 후 NMS 적용
  const sortedDetections = [...detections].sort((a, b) => b.confidence - a.confidence);
  // IOU threshold를 더 낮춰서 중복 제거를 더 강하게 (0.3으로 설정)
  const filteredDetections = applyNMS(sortedDetections, 0.3);
  
  console.log(`필터링 전: ${detections.length}개, 필터링 후: ${filteredDetections.length}개`);
  if (filteredDetections.length > 0) {
    const classCounts = new Map<number, number>();
    filteredDetections.forEach(d => {
      classCounts.set(d.classId, (classCounts.get(d.classId) || 0) + 1);
    });
    console.log(`감지된 클래스:`, Array.from(classCounts.entries()).map(([id, count]) => 
      `${getClassName(id)}: ${count}개 (confidence: ${filteredDetections.find(d => d.classId === id)?.confidence.toFixed(3)})`
    ));
  }

  return {
    detections: filteredDetections,
    inferenceTime: 0, // 성능 측정은 상위 레벨에서
    originalWidth,
    originalHeight,
  };
}

/**
 * NMS (Non-Maximum Suppression) 적용
 */
function applyNMS(
  detections: YOLODetection[],
  iouThreshold: number
): YOLODetection[] {
  // confidence 순으로 정렬
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: YOLODetection[] = [];

  for (const det of sorted) {
    let shouldKeep = true;

    for (const keptDet of kept) {
      if (det.classId !== keptDet.classId) continue;

      const iou = calculateIOU(det.bbox, keptDet.bbox);
      if (iou > iouThreshold) {
        shouldKeep = false;
        break;
      }
    }

    if (shouldKeep) {
      kept.push(det);
    }
  }

  return kept;
}

/**
 * IoU (Intersection over Union) 계산
 */
function calculateIOU(
  box1: [number, number, number, number],
  box2: [number, number, number, number]
): number {
  const [x1, y1, w1, h1] = box1;
  const [x2, y2, w2, h2] = box2;

  const x1Min = x1 - w1 / 2;
  const y1Min = y1 - h1 / 2;
  const x1Max = x1 + w1 / 2;
  const y1Max = y1 + h1 / 2;

  const x2Min = x2 - w2 / 2;
  const y2Min = y2 - h2 / 2;
  const x2Max = x2 + w2 / 2;
  const y2Max = y2 + h2 / 2;

  const interXMin = Math.max(x1Min, x2Min);
  const interYMin = Math.max(y1Min, y2Min);
  const interXMax = Math.min(x1Max, x2Max);
  const interYMax = Math.min(y1Max, y2Max);

  const interWidth = Math.max(0, interXMax - interXMin);
  const interHeight = Math.max(0, interYMax - interYMin);
  const interArea = interWidth * interHeight;

  const box1Area = w1 * h1;
  const box2Area = w2 * h2;
  const unionArea = box1Area + box2Area - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

/**
 * 마스크 생성 (프로토타입 마스크 + 계수)
 */
export function generateMask(
  maskCoeffs: Float32Array,
  protoMasks: Float32Array, // [32, 160, 160]
  bbox: [number, number, number, number],
  originalWidth: number,
  originalHeight: number,
  inputSize: number = 640
): Uint8Array {
  // 마스크 크기 계산
  const maskSize = 160;
  const mask = new Float32Array(maskSize * maskSize);

  // 프로토타입 마스크와 계수 결합
  for (let y = 0; y < maskSize; y++) {
    for (let x = 0; x < maskSize; x++) {
      let sum = 0;
      for (let i = 0; i < 32; i++) {
        const idx = i * maskSize * maskSize + y * maskSize + x;
        sum += maskCoeffs[i] * protoMasks[idx];
      }
      mask[y * maskSize + x] = sum;
    }
  }

  // Sigmoid 적용
  const sigmoidMask = new Float32Array(maskSize * maskSize);
  for (let i = 0; i < mask.length; i++) {
    sigmoidMask[i] = 1 / (1 + Math.exp(-mask[i]));
  }

  // 바운딩 박스 크기로 크롭 및 리사이즈
  // bbox는 [centerX, centerY, width, height] 형식 (원본 이미지 좌표계)
  const [centerX, centerY, width, height] = bbox;
  const xMin = Math.max(0, Math.floor(centerX - width / 2));
  const yMin = Math.max(0, Math.floor(centerY - height / 2));
  const xMax = Math.min(originalWidth, Math.ceil(centerX + width / 2));
  const yMax = Math.min(originalHeight, Math.ceil(centerY + height / 2));

  // 원본 이미지 크기의 마스크 생성
  const croppedMask = new Uint8Array(originalWidth * originalHeight);
  const threshold = 0.5;

  // 바운딩 박스 영역만 처리
  const bboxWidth = xMax - xMin;
  const bboxHeight = yMax - yMin;

  if (bboxWidth <= 0 || bboxHeight <= 0) {
    return croppedMask; // 빈 마스크 반환
  }

  for (let y = yMin; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      // 바운딩 박스 내부 좌표를 마스크 공간(160x160)으로 정규화
      const normalizedX = (x - xMin) / bboxWidth;
      const normalizedY = (y - yMin) / bboxHeight;
      
      // 마스크 공간(160x160)으로 변환
      const maskX = Math.floor(normalizedX * maskSize);
      const maskY = Math.floor(normalizedY * maskSize);

      if (maskX >= 0 && maskX < maskSize && maskY >= 0 && maskY < maskSize) {
        const value = sigmoidMask[maskY * maskSize + maskX];
        const idx = y * originalWidth + x;
        croppedMask[idx] = value > threshold ? 255 : 0;
      }
    }
  }

  return croppedMask;
}

export function getClassName(classId: number): string {
  return COCO_CLASSES[classId] || `class_${classId}`;
}

