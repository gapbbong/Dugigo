import sys
import os
import fitz

def setup_new_exam(pdf_path, exam_code):
    if not os.path.exists(pdf_path):
        print(f"[{exam_code}] Error: Cannot find PDF file: {pdf_path}")
        return

    # 1. 디렉토리 구조 생성
    pages_dir = os.path.join("client", "public", "images", "exams", exam_code, "pages")
    crops_dir = os.path.join("client", "public", "images", "crops", exam_code)
    data_path = os.path.join("client", "src", "data", f"{exam_code}_questions.json")
    
    os.makedirs(pages_dir, exist_ok=True)
    os.makedirs(crops_dir, exist_ok=True)
    
    print(f"[{exam_code}] Directories created:")
    print(f" - {pages_dir}")
    print(f" - {crops_dir}")

    # 2. PDF를 고해상도 이미지(PNG)로 변환
    print(f"[{exam_code}] Converting PDF '{pdf_path}' to Images... Please wait.")
    doc = fitz.open(pdf_path)
    
    zoom_x, zoom_y = 2.0, 2.0
    mat = fitz.Matrix(zoom_x, zoom_y)
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(matrix=mat)
        
        image_filename = f"page_{page_num + 1}.png"
        image_filepath = os.path.join(pages_dir, image_filename)
        pix.save(image_filepath)
        
    print(f"[{exam_code}] Total {len(doc)} pages extracted and saved to '{pages_dir}'.")

    # 3. AI 변환용 프롬프트 생성 (사용자가 복사할 수 있도록)
    prompt_text = f"""[Dukigo AI Parsing Command]
첨부한 {len(doc)}장의 시험 문제 이미지를 확인하여 모든 문항을 아래의 JSON 배열 형식으로 추출해주세요.

<규칙>
1. 파일 전체를 감싸는 속성 없이 그냥 바로 배열 `[` 로 시작해야 합니다.
2. 문항 안의 수식과 기호는 완벽한 LaTeX 형식($ $)으로 작성하세요. (예: $E=mc^2$)
3. "회로", "그림 참고", "도면" 등의 내용이 문제에 있으면 크롭 도구를 쓸 것이므로 그대로 남겨주세요.

<출력 JSON 템플릿>
[
  {{
    "id": "{exam_code}_01",
    "year": 2026,
    "round": "01",
    "question_num": 1,
    "question": "문제 텍스트 (그림 참고)",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "answer": 0,
    "explanation": "이 문제의 해설 설명란.",
    "level": "상",
    "image": null
  }}
]
"""
    prompt_path = f"{exam_code}_AI_prompt.txt"
    with open(prompt_path, "w", encoding="utf-8") as f:
        f.write(prompt_text)
        
    print(f"[{exam_code}] Prompt text file created: '{prompt_path}'")
    
    # 4. 빈 JSON 파일 셋업
    if not os.path.exists(data_path):
        with open(data_path, "w", encoding="utf-8") as f:
            f.write("[\n  // AI output here.\n]")
            
    print(f"[{exam_code}] You should paste the AI output into '{data_path}' and run the Crop Studio!")
    print("\n[{exam_code}] Setup complete for new examination!")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python setup_exam.py <PDF_PATH> <EXAM_CODE>")
        print("Example: python setup_exam.py scan/ElectricExam2019.pdf Electric2019")
        sys.exit(1)
        
    setup_new_exam(sys.argv[1], sys.argv[2])
