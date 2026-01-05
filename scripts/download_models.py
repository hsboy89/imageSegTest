"""
YOLOv8-seg 모델 다운로드 스크립트
"""
import os
import urllib.request
from pathlib import Path

# 모델 디렉토리 생성
models_dir = Path("public/models")
models_dir.mkdir(parents=True, exist_ok=True)

# YOLOv8-seg 모델 다운로드 URL (경량 버전)
model_urls = {
    "yolov8n-seg.onnx": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n-seg.onnx"
}

print("모델 다운로드를 시작합니다...")

for model_name, url in model_urls.items():
    model_path = models_dir / model_name
    if model_path.exists():
        print(f"{model_name} 파일이 이미 존재합니다. 건너뜁니다.")
        continue
    
    print(f"{model_name} 다운로드 중... ({url})")
    try:
        urllib.request.urlretrieve(url, model_path)
        print(f"✓ {model_name} 다운로드 완료!")
        file_size = model_path.stat().st_size / (1024 * 1024)  # MB
        print(f"  파일 크기: {file_size:.2f} MB")
    except Exception as e:
        print(f"✗ {model_name} 다운로드 실패: {e}")
        print(f"  직접 다운로드: {url}")

print("\n다운로드 완료!")
print(f"모델 파일 위치: {models_dir.absolute()}")

