import fitz  # PyMuPDF
import json
import os

# 경로 설정
PDF_PATH = r'E:\Quiz-extraction-raw\data\승강기기능사\scan\Elevator_11_16.pdf'
JSON_PATH = r'E:\DugiGo\client\src\data\승강기기능사\MASTER_DB.json'
OUTPUT_DIR = r'E:\DugiGo\client\public\images\승강기기능사'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def repair_image_2016_01_05_v2():
    doc = fitz.open(PDF_PATH)
    page_num = 62  # PDF 인덱스 62 (63페이지)
    page = doc[page_num]
    
    # 5번 문항 이미지 영역 정밀 크롭 (x0, y0, x1, y1)
    # 우측 6번 문항이 섞이지 않도록 가로폭을 325로 조정
    rect = fitz.Rect(50, 150, 325, 430) 
    
    # 고해상도 추출 (300 DPI 정도)
    zoom = 3
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(clip=rect, matrix=mat)
    
    img_filename = "Elevator_2016_01_05.png"
    img_path = os.path.join(OUTPUT_DIR, img_filename)
    pix.save(img_path)
    print(f"이미지 추출 완료: {img_path}")

    # JSON 업데이트
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        full_data = json.load(f)
        data = full_data.get('questions', full_data)

    found = False
    for q in data:
        if q.get('year') == '2016' and q.get('round') == '01' and q.get('number') == '05':
            q['question_img'] = f"/images/승강기기능사/{img_filename}"
            found = True
            break
    
    if found:
        with open(JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(full_data, f, indent=2, ensure_ascii=False)
        print("JSON 데이터 업데이트 완료!")
    else:
        print("JSON에서 해당 문항을 찾지 못했습니다.")

if __name__ == "__main__":
    repair_image_2016_01_05_v2()
