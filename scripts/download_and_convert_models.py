"""
YOLOv8-seg 모델 다운로드 및 ONNX 변환 스크립트
Ultralytics YOLOv8을 사용하여 모델을 ONNX 형식으로 변환합니다.
"""
import os
import sys
from pathlib import Path

# 모델 디렉토리 생성
models_dir = Path("public/models")
models_dir.mkdir(parents=True, exist_ok=True)

print("YOLOv8-seg 모델을 ONNX 형식으로 변환합니다...")
print("Ultralytics 라이브러리가 필요합니다.")

try:
    from ultralytics import YOLO
    print("✓ Ultralytics 라이브러리 확인 완료")
except ImportError:
    print("✗ Ultralytics 라이브러리가 설치되어 있지 않습니다.")
    print("다음 명령어로 설치해주세요:")
    print("  pip install ultralytics")
    sys.exit(1)

# 모델 변환
print("\nYOLOv8n-seg 모델 다운로드 및 변환 중...")
try:
    # YOLOv8-seg 모델 로드 (자동으로 다운로드됨)
    model = YOLO('yolov8n-seg.pt')  # nano 버전 (가장 작음)
    
    # ONNX 형식으로 변환
    model.export(format='onnx', imgsz=640, simplify=True, opset=12)
    
    # 변환된 파일을 models 디렉토리로 이동
    onnx_file = Path('yolov8n-seg.onnx')
    if onnx_file.exists():
        import shutil
        target_file = models_dir / 'yolov8n-seg.onnx'
        shutil.move(str(onnx_file), str(target_file))
        print(f"✓ 모델 변환 완료: {target_file}")
        file_size = target_file.stat().st_size / (1024 * 1024)  # MB
        print(f"  파일 크기: {file_size:.2f} MB")
    else:
        print("✗ ONNX 파일 생성 실패")
        sys.exit(1)
        
except Exception as e:
    print(f"✗ 모델 변환 실패: {e}")
    print("\n수동으로 변환하려면:")
    print("  python -c \"from ultralytics import YOLO; model = YOLO('yolov8n-seg.pt'); model.export(format='onnx')\"")
    sys.exit(1)

print("\n다운로드 및 변환 완료!")
print(f"모델 파일 위치: {models_dir.absolute() / 'yolov8n-seg.onnx'}")

