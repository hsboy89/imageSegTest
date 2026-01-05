import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VisionEdge - Real-time Browser-based Image Segmentation',
  description: '서버 없이 브라우저에서 직접 실행되는 실시간 이미지 분할 도구',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

