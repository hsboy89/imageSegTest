/**
 * 이미지 처리 유틸리티
 * 실제 모델 없이도 시각적으로 분할된 이미지를 생성하기 위한 시뮬레이션
 */

/**
 * 컬러 기반 세그멘테이션 시뮬레이션
 * 색상 유사도를 기반으로 영역을 분할하고 마스크 생성
 */
export async function createSegmentedImage(originalImageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
          return;
        }

        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 주요 색상 클러스터 (간단한 추정)
        const dominantColors = extractDominantColors(data, canvas.width, canvas.height);
        
        // 각 클러스터에 할당할 색상 (세그멘테이션 마스크 색상)
        const maskColors = [
          { r: 255, g: 105, b: 180 }, // 핑크 - Pedestrian
          { r: 65, g: 105, b: 225 },  // 블루 - Vehicle
          { r: 147, g: 112, b: 219 }, // 퍼플 - Road Surface
          { r: 255, g: 215, b: 0 },   // 골드 - Traffic Sign
          { r: 128, g: 128, b: 128 }, // 그레이 - Building
        ];

        // 마스크 데이터 생성
        const maskData = new Uint8ClampedArray(canvas.width * canvas.height);
        const outputData = new Uint8ClampedArray(data.length);

        // 샘플링된 픽셀 분석 (성능 향상)
        const step = Math.max(1, Math.floor(Math.sqrt(canvas.width * canvas.height) / 100));

        for (let y = 0; y < canvas.height; y += step) {
          for (let x = 0; x < canvas.width; x += step) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // 가장 가까운 색상 클러스터 찾기
            let minDist = Infinity;
            let clusterIdx = 0;
            for (let i = 0; i < dominantColors.length; i++) {
              const dist = colorDistance([r, g, b], dominantColors[i]);
              if (dist < minDist) {
                minDist = dist;
                clusterIdx = i;
              }
            }

            // 마스크 색상 적용 (블렌딩)
            const maskColor = maskColors[clusterIdx % maskColors.length];
            const blendFactor = 0.65; // 원본 35%, 마스크 65%

            const outIdx = idx;
            outputData[outIdx] = Math.round(r * (1 - blendFactor) + maskColor.r * blendFactor);
            outputData[outIdx + 1] = Math.round(g * (1 - blendFactor) + maskColor.g * blendFactor);
            outputData[outIdx + 2] = Math.round(b * (1 - blendFactor) + maskColor.b * blendFactor);
            outputData[outIdx + 3] = data[idx + 3];

            // 마스크 데이터 저장
            maskData[y * canvas.width + x] = clusterIdx;
          }
        }

        // 나머지 픽셀 보간 (간단한 방법)
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (y % step === 0 && x % step === 0) continue;

            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // 가장 가까운 샘플링된 픽셀의 클러스터 사용
            const sampleX = Math.floor(x / step) * step;
            const sampleY = Math.floor(y / step) * step;
            const sampleIdx = Math.min(sampleY * canvas.width + sampleX, maskData.length - 1);
            const clusterIdx = maskData[sampleIdx];

            const maskColor = maskColors[clusterIdx % maskColors.length];
            const blendFactor = 0.65;

            outputData[idx] = Math.round(r * (1 - blendFactor) + maskColor.r * blendFactor);
            outputData[idx + 1] = Math.round(g * (1 - blendFactor) + maskColor.g * blendFactor);
            outputData[idx + 2] = Math.round(b * (1 - blendFactor) + maskColor.b * blendFactor);
            outputData[idx + 3] = data[idx + 3];
          }
        }

        // 결과 이미지 그리기
        const segmentedImageData = new ImageData(outputData, canvas.width, canvas.height);
        ctx.putImageData(segmentedImageData, 0, 0);

        // 윤곽선 그리기 (경계선 강조)
        drawSegmentationBoundaries(ctx, maskData, canvas.width, canvas.height, step);

        const segmentedUrl = canvas.toDataURL('image/png');
        resolve(segmentedUrl);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = originalImageUrl;
  });
}

/**
 * 이미지에서 주요 색상 추출 (간단한 히스토그램 기반)
 */
function extractDominantColors(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number[][] {
  // 샘플링
  const sampleSize = Math.min(5000, width * height);
  const step = Math.floor((width * height) / sampleSize);
  const colorBins: { [key: string]: { color: number[]; count: number } } = {};

  for (let i = 0; i < data.length; i += step * 4) {
    const r = Math.floor(data[i] / 32) * 32; // 양자화
    const g = Math.floor(data[i + 1] / 32) * 32;
    const b = Math.floor(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;

    if (!colorBins[key]) {
      colorBins[key] = { color: [r, g, b], count: 0 };
    }
    colorBins[key].count++;
  }

  // 가장 많이 나타난 색상들 정렬
  const sorted = Object.values(colorBins)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return sorted.map((bin) => bin.color);
}

/**
 * 색상 거리 계산 (CIE76 기준)
 */
function colorDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) + 
    Math.pow(a[1] - b[1], 2) + 
    Math.pow(a[2] - b[2], 2)
  );
}

/**
 * 세그멘테이션 경계선 그리기
 */
function drawSegmentationBoundaries(
  ctx: CanvasRenderingContext2D,
  maskData: Uint8ClampedArray,
  width: number,
  height: number,
  step: number
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;

  // 경계선 찾기 (샘플링된 그리드 기반)
  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const idx = y * width + x;
      const currentCluster = maskData[idx];

      // 4방향 체크
      const upCluster = maskData[Math.max(0, (y - step) * width + x)];
      const downCluster = maskData[Math.min(maskData.length - 1, (y + step) * width + x)];
      const leftCluster = maskData[Math.max(0, y * width + (x - step))];
      const rightCluster = maskData[Math.min(maskData.length - 1, y * width + (x + step))];

      const isBoundary =
        upCluster !== currentCluster ||
        downCluster !== currentCluster ||
        leftCluster !== currentCluster ||
        rightCluster !== currentCluster;

      if (isBoundary) {
        // 경계선 그리기 (더 두껍게)
        ctx.beginPath();
        ctx.moveTo(x - step / 2, y - step / 2);
        ctx.lineTo(x + step / 2, y - step / 2);
        ctx.lineTo(x + step / 2, y + step / 2);
        ctx.lineTo(x - step / 2, y + step / 2);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
}

/**
 * 이미지에 컬러 마스크 오버레이 추가
 */
export function applyColorMask(
  imageUrl: string,
  color: string,
  opacity: number = 0.5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // 컬러 마스크 적용
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const resultUrl = canvas.toDataURL('image/png');
        resolve(resultUrl);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
