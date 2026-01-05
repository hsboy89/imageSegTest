from PIL import Image, ImageDraw
import os

# 800x600 크기의 테스트 이미지 생성
img = Image.new('RGB', (800, 600), color=(240, 240, 240))
draw = ImageDraw.Draw(img)

# 배경에 그리드 패턴 추가
for i in range(0, 800, 40):
    draw.line([(i, 0), (i, 600)], fill=(220, 220, 220), width=1)
for i in range(0, 600, 40):
    draw.line([(0, i), (800, i)], fill=(220, 220, 220), width=1)

# 사람 1 (왼쪽)
# 머리
draw.ellipse([100, 100, 200, 200], fill=(255, 220, 177), outline='black', width=3)
# 몸통
draw.rectangle([130, 200, 170, 450], fill=(70, 130, 180), outline='black', width=3)
# 팔
draw.rectangle([80, 200, 130, 350], fill=(70, 130, 180), outline='black', width=3)
draw.rectangle([170, 200, 220, 350], fill=(70, 130, 180), outline='black', width=3)
# 다리
draw.rectangle([130, 450, 150, 580], fill='black', outline='black', width=3)
draw.rectangle([150, 450, 170, 580], fill='black', outline='black', width=3)
# 눈
draw.ellipse([130, 140, 145, 155], fill='black')
draw.ellipse([155, 140, 170, 155], fill='black')
# 입
draw.arc([130, 170, 170, 190], start=0, end=180, fill='black', width=3)

# 사람 2 (중앙)
# 머리
draw.ellipse([350, 150, 450, 250], fill=(255, 220, 177), outline='black', width=3)
# 몸통
draw.rectangle([380, 250, 420, 500], fill=(139, 69, 19), outline='black', width=3)
# 팔
draw.rectangle([330, 250, 380, 400], fill=(139, 69, 19), outline='black', width=3)
draw.rectangle([420, 250, 470, 400], fill=(139, 69, 19), outline='black', width=3)
# 다리
draw.rectangle([380, 500, 400, 580], fill='black', outline='black', width=3)
draw.rectangle([400, 500, 420, 580], fill='black', outline='black', width=3)
# 눈
draw.ellipse([375, 180, 390, 195], fill='black')
draw.ellipse([410, 180, 425, 195], fill='black')
# 입
draw.arc([375, 200, 425, 220], start=0, end=180, fill='black', width=3)

# 사람 3 (오른쪽)
# 머리
draw.ellipse([600, 120, 700, 220], fill=(255, 220, 177), outline='black', width=3)
# 몸통
draw.rectangle([630, 220, 670, 470], fill=(34, 139, 34), outline='black', width=3)
# 팔
draw.rectangle([580, 220, 630, 370], fill=(34, 139, 34), outline='black', width=3)
draw.rectangle([670, 220, 720, 370], fill=(34, 139, 34), outline='black', width=3)
# 다리
draw.rectangle([630, 470, 650, 580], fill='black', outline='black', width=3)
draw.rectangle([650, 470, 670, 580], fill='black', outline='black', width=3)
# 눈
draw.ellipse([625, 160, 640, 175], fill='black')
draw.ellipse([660, 160, 675, 175], fill='black')
# 입
draw.arc([625, 185, 675, 205], start=0, end=180, fill='black', width=3)

# 바탕화면 경로
desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
output_path = os.path.join(desktop, '3.png')

img.save(output_path)
print(f'테스트 이미지 생성 완료: {output_path}')
print(f'이미지 크기: {img.size}')

