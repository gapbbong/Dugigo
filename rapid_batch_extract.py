import json
import os
import fitz # PyMuPDF
import subprocess
import re

def fix_round2():
    path = 'd:/App/Dukigo/client/src/data/2016_02_questions.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    existing_nums = {q['question_num'] for q in data}
    missing = [i for i in range(1, 61) if i not in existing_nums]
    
    for m in missing:
        subject = "전기이론" if m <= 20 else "전기기기" if m <= 40 else "전기설비"
        data.append({
            "id": f"2016_02_{m:02d}",
            "year": 2016, "round": "02", "question_num": m,
            "subject": subject, "question": "OCR 누락 - 수동 확인 요망",
            "options": ["보기1", "보기2", "보기3", "보기4"],
            "answer": 1, "explanation": "", "level": "중"
        })
        
    data.sort(key=lambda x: x['question_num'])
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Fixed 2016_02 missing questions:", missing)

def extract_and_ocr(start_page, end_page, round_num):
    pdf_path = 'd:/App/Dukigo/scan/ElectricExam2016.pdf'
    doc = fitz.open(pdf_path)
    
    ocr_text = ""
    for page_num in range(start_page - 1, end_page):
        page = doc.load_page(page_num)
        image_list = page.get_images(full=True)
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            ext = base_image["ext"]
            img_path = f"d:/App/Dukigo/tmp/p{page_num+1}.{ext}"
            with open(img_path, "wb") as f:
                f.write(image_bytes)
                
            cmd = ['tesseract', img_path, 'stdout', '-l', 'kor+eng']
            result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
            ocr_text += f"\n--- Page {page_num+1} ---\n{result.stdout}\n"
    return ocr_text

def parse_to_json(text, round_num):
    questions = []
    text = re.sub(r'--- Page \d+ ---', '', text)
    
    for i in range(1, 61):
        q_num_str = f"{i:02d}"
        start_pattern = r'\b' + q_num_str + r'[\s\.>]'
        start_match = re.search(start_pattern, text)
        
        subject = "전기이론" if i <= 20 else "전기기기" if i <= 40 else "전기설비"
        q_text = "OCR 파싱 실패 - 수동 확인 요망"
        options = ["보기1", "보기2", "보기3", "보기4"]
        
        if start_match:
            next_num_str = f"{i+1:02d}"
            end_pattern = r'\b' + next_num_str + r'[\s\.>]'
            end_match = re.search(end_pattern, text[start_match.end():])
            chunk_end = start_match.end() + end_match.start() if end_match else len(text)
            chunk = text[start_match.end():chunk_end]
            
            q_lines = [l.strip() for l in chunk.split('\n') if l.strip()]
            temp_q_text = ""
            temp_options = []
            parsing_options = False
            opt_markers = ['(1)', '(2)', '(3)', '(4)', '①', '②', '③', '④', '@', '0', '1.', '2.', '3.', '4.']
            
            for line in q_lines:
                is_opt = False
                for marker in opt_markers:
                    if line.startswith(marker):
                        temp_options.append(line[len(marker):].strip())
                        parsing_options = True
                        is_opt = True
                        break
                if not parsing_options and not is_opt:
                    temp_q_text += line + " "
                    
            if temp_q_text.strip():
                q_text = temp_q_text.strip()
            if len(temp_options) == 4:
                options = temp_options
            elif len(temp_options) > 0:
                options = (temp_options + ["누락 보기"] * 4)[:4]
                
        questions.append({
            "id": f"2016_{round_num:02d}_{i:02d}",
            "year": 2016, "round": f"{round_num:02d}", "question_num": i,
            "subject": subject, "question": q_text,
            "options": options, "answer": 1, "explanation": "", "level": "중"
        })
        
    path = f'd:/App/Dukigo/client/src/data/2016_{round_num:02d}_questions.json'
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print(f"Generated {path} with 60 questions.")

def run():
    print("Fixing Round 2...")
    fix_round2()
    
    print("Extracting Round 3 (Page 83-100)...")
    text3 = extract_and_ocr(83, 100, 3)
    parse_to_json(text3, 3)
    
    print("Extracting Round 4 (Page 101-118)...")
    text4 = extract_and_ocr(101, 118, 4)
    parse_to_json(text4, 4)
    
    print("ALL DONE!")

if __name__ == "__main__":
    run()
