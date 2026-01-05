import JSZip from 'jszip';
import type { ImageData, DetectedClass } from '@/types';

export async function exportMaskResult(
  imageData: ImageData,
  detectedClasses: DetectedClass[]
) {
  const zip = new JSZip();

  // TODO: 실제 마스크 이미지 생성 및 개별 객체 추출
  // 현재는 원본 이미지만 ZIP에 추가
  const response = await fetch(imageData.original);
  const blob = await response.blob();
  zip.file('original.png', blob);

  // ZIP 파일 다운로드
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'visionedge-export.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportIndividualObject(
  imageData: ImageData,
  className: string,
  maskData: ImageData
) {
  // TODO: 개별 객체를 투명 배경 PNG로 추출
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.src = imageData.original;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  // TODO: 마스크 적용 및 배경 제거
  // ctx.globalCompositeOperation = 'destination-in';
  // mask 적용 로직

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${className}-extracted.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

