/**
 * 세그멘테이션 결과 시각화
 */

export interface MaskData {
  mask: Uint8Array;
  className: string;
  color: string;
  confidence: number;
  bbox: [number, number, number, number];
}

/**
 * 세그멘테이션 마스크들을 이미지로 렌더링
 */
export function renderSegmentedImage(
  originalImageUrl: string,
  masks: MaskData[],
  maskOpacity: number = 0.5,
  showBoundaries: boolean = true
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

        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 마스크 오버레이 그리기
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        console.log(`렌더링할 마스크 개수: ${masks.length}`);
        
        for (let maskIdx = 0; maskIdx < masks.length; maskIdx++) {
          const maskData = masks[maskIdx];
          const { mask, color } = maskData;
          const rgb = hexToRgb(color);
          if (!rgb) {
            console.warn(`마스크 ${maskIdx}: 색상 변환 실패`);
            continue;
          }

          console.log(`마스크 ${maskIdx}: 크기=${mask.length}, 예상 크기=${canvas.width * canvas.height}, 색상=${color}`);

          // 마스크는 이미 원본 이미지 크기로 변환되어 있어야 함
          if (mask.length !== canvas.width * canvas.height) {
            console.warn(`마스크 ${maskIdx}: 크기 불일치. 실제=${mask.length}, 예상=${canvas.width * canvas.height}`);
          }

          let maskPixelCount = 0;
          // 마스크는 이미 원본 이미지 크기로 변환되어 있음
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = y * canvas.width + x;
              if (idx >= mask.length) continue;

              const maskValue = mask[idx];
              if (maskValue > 128) {
                maskPixelCount++;
                const pixelIdx = (y * canvas.width + x) * 4;
                
                // 마스크 색상 블렌딩
                data[pixelIdx] = Math.round(data[pixelIdx] * (1 - maskOpacity) + rgb.r * maskOpacity);
                data[pixelIdx + 1] = Math.round(data[pixelIdx + 1] * (1 - maskOpacity) + rgb.g * maskOpacity);
                data[pixelIdx + 2] = Math.round(data[pixelIdx + 2] * (1 - maskOpacity) + rgb.b * maskOpacity);
              }
            }
          }
          console.log(`마스크 ${maskIdx}: 렌더링된 픽셀 수=${maskPixelCount}`);
        }

        ctx.putImageData(imageData, 0, 0);

        // 경계선 그리기
        if (showBoundaries) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 2;

          for (const maskData of masks) {
            const { mask } = maskData;

            // 경계 찾기
            for (let y = 1; y < canvas.height - 1; y++) {
              for (let x = 1; x < canvas.width - 1; x++) {
                const maskIdx = y * canvas.width + x;
                if (maskIdx >= mask.length) continue;

                const currentValue = mask[maskIdx] > 128 ? 1 : 0;
                if (currentValue === 0) continue;

                // 4방향 체크
                const neighbors = [
                  mask[(y - 1) * canvas.width + x] > 128 ? 1 : 0,
                  mask[(y + 1) * canvas.width + x] > 128 ? 1 : 0,
                  mask[y * canvas.width + (x - 1)] > 128 ? 1 : 0,
                  mask[y * canvas.width + (x + 1)] > 128 ? 1 : 0,
                ];

                const isBoundary = neighbors.some(n => n !== currentValue);

                if (isBoundary) {
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                  ctx.fillRect(x, y, 1, 1);
                }
              }
            }
          }
        }

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

/**
 * 클래스명에 따른 색상 매핑
 */
const CLASS_COLORS: { [key: string]: string } = {
  person: '#ff69b4',
  bicycle: '#4169e1',
  car: '#4169e1',
  motorcycle: '#4169e1',
  bus: '#4169e1',
  truck: '#4169e1',
  traffic_light: '#ffd700',
  stop_sign: '#ff0000',
  parking_meter: '#ffd700',
  bench: '#9370db',
  backpack: '#ff69b4',
  handbag: '#ff69b4',
  suitcase: '#ff69b4',
};

export function getClassColor(className: string): string {
  return CLASS_COLORS[className.toLowerCase()] || '#808080';
}

