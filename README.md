# VisionEdge - Real-time Browser-based Image Segmentation

브라우저에서 직접 실행되는 실시간 이미지 분할 도구

## 특징

- 🚀 **Zero-Latency**: 서버 통신 없이 브라우저에서 직접 추론
- 🎯 **High Precision**: Meta SAM 또는 YOLOv8-seg 기반 정밀한 마스킹
- 📦 **Smart Export**: 개별 객체 다운로드 및 배경 제거 기능
- ⚡ **Real-time**: 마우스 호버 시 실시간 객체 하이라이트

## 기술 스택

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **AI Engine**: ONNX Runtime Web
- **Model**: MobileSAM / YOLOv8-seg

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)를 열어 확인하세요.

## 사용법

1. 이미지 업로드 (드래그 앤 드롭 또는 클립보드 붙여넣기)
2. 모델 선택 (속도 우선 / 정확도 우선)
3. 객체 탐색 (마우스 호버로 실시간 하이라이트)
4. 객체 선택 및 추출 (개별 다운로드 또는 ZIP 파일)

## 모델 설정

**중요**: 실제 이미지 세그멘테이션을 사용하려면 ONNX 모델 파일이 필요합니다.

### 모델 파일 준비

1. **YOLOv8-seg 모델**:
   - [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)에서 모델을 ONNX 형식으로 변환
   - 또는 [ONNX Model Zoo](https://github.com/onnx/models)에서 모델 다운로드
   
2. **MobileSAM 모델**:
   - [MobileSAM GitHub](https://github.com/ChaoningZhang/MobileSAM)에서 ONNX 모델 다운로드

3. 모델 파일을 `public/models/` 디렉토리에 배치:
   ```
   public/models/
   ├── yolov8-seg.onnx
   └── mobilesam.onnx
   ```

### 현재 상태

현재는 실제 모델 파일이 없어 시뮬레이션으로 동작합니다. 실제 세그멘테이션을 사용하려면 위 모델 파일을 추가하세요.

## 라이선스

MIT

