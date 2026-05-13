import fitz  # PyMuPDF
import json
import os

# 경로 설정
PDF_PATH = r'E:\Quiz-extraction-raw\data\승강기기능사\scan\Elevator_11_16.pdf'
JSON_PATH = r'E:\DugiGo\client\src\data\승강기기능사\MASTER_DB.json'
OUTPUT_DIR = r'E:\DugiGo\client\public\images\승강기기능사'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def repair_image_2016_01_05():
    # 1. PDF 열기
    doc = fitz.open(PDF_PATH)
    page_num = 62  # JSON의 63페이지는 인덱스로는 62일 가능성이 큼
    page = doc[page_num]
    
    # 2. 문항 5번 위치 찾기 및 크롭 (수동 좌표 설정 또는 검색)
    # "5." 또는 "레일의 규격" 텍스트를 찾아 그 주변을 땁니다.
    text_instances = page.search_for("레일의 규격")
    if not text_instances:
        print("문항 텍스트를 찾을 수 없습니다. 페이지를 다시 확인하세요.")
        return

    # 대략적인 그림 영역 (지문 바로 아래)
    inst = text_instances[0]
    rect = fitz.Rect(inst.x0, inst.y1 + 10, inst.x1 + 300, inst.y1 + 200) # 가로 300, 세로 190 정도 영역
    
    # 이미지 저장
    pix = page.get_pixmap(clip=rect, matrix=fitz.Matrix(2, 2)) # 고해상도
    img_filename = "Elevator_2016_01_05.png"
    img_path = os.path.join(OUTPUT_DIR, img_filename)
    pix.save(img_path)
    print(f"이미지 추출 완료: {img_path}")

    # 3. JSON 업데이트
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
    repair_image_2016_01_05()
