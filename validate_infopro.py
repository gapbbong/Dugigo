import os
import json
import re

DATA_DIR = r'E:\DugiGo\client\src\data\정보처리산업기사'
DB_PATH = r'E:\DugiGo\client\src\data\정보처리산업기사\MASTER_DB.json'

def validate_db():
    errors = []
    
    # 1. MASTER_DB.json 검증
    if not os.path.exists(DB_PATH):
        errors.append(f"[ERROR] MASTER_DB.json not found at {DB_PATH}")
        return errors
        
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        try:
            db_data = json.load(f)
        except json.JSONDecodeError as e:
            errors.append(f"[ERROR] MASTER_DB.json parse failed: {str(e)}")
            return errors
            
    questions = db_data.get("questions", [])
    if not questions:
        errors.append("[ERROR] No questions found in MASTER_DB.json")
        
    print(f"Verifying {len(questions)} questions in MASTER_DB...")
    
    # 2. 개별 문항 무결성 체크
    for idx, q in enumerate(questions):
        num = q.get("number")
        sub_unit = q.get("sub_unit", "Unknown")
        ref_str = f"[{sub_unit} Q{num}]"
        
        if num is None:
            errors.append(f"[ERROR] Index {idx} in Master DB: Missing 'number'")
            continue
            
        if not q.get("question"):
            errors.append(f"[ERROR] {ref_str}: Empty question text")
            
        choices = q.get("choices", [])
        if not choices:
            errors.append(f"[ERROR] {ref_str}: Missing or empty choices")
        elif len(choices) not in [4, 5]:
            errors.append(f"[ERROR] {ref_str}: Expected 4 or 5 choices, got {len(choices)}")
            
        # 선택지 내용 중복 검사
        cleaned_choices = [c.strip().replace(" ", "") for c in choices]
        if len(cleaned_choices) != len(set(cleaned_choices)):
            errors.append(f"[WARNING] {ref_str}: Contains duplicate options")
            
        ans = q.get("answer")
        if ans is None:
            errors.append(f"[ERROR] {ref_str}: Missing 'answer'")
        elif not isinstance(ans, int):
            errors.append(f"[ERROR] {ref_str}: Answer is not an integer: {ans}")
        elif not (1 <= ans <= len(choices)):
            errors.append(f"[ERROR] {ref_str}: Invalid answer value {ans} for {len(choices)} choices")
            
        # LaTeX 달러 짝 매칭 검사
        q_text = q.get("question", "")
        if q_text.count('$') % 2 != 0:
            errors.append(f"[WARNING] {ref_str}: Mismatched LaTeX dollars ($) in question")
            
        exp_text = q.get("explanation", "")
        if exp_text.count('$') % 2 != 0:
            errors.append(f"[WARNING] {ref_str}: Mismatched LaTeX dollars ($) in explanation")
            
    # 3. 단원별 파일 동기화 및 번호 연속성 체크
    unit_files = [
        "01. 애플리케이션 테스트 수행.json",
        "02. 응용SW 기초 기술 활용.json",
        "03. 프로그래밍 언어 응용.json",
        "04. 프로그래밍 언어 활용.json"
    ]
    
    for filename in unit_files:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            errors.append(f"[ERROR] Unit file {filename} is missing.")
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                unit_data = json.load(f)
            except json.JSONDecodeError as e:
                errors.append(f"[ERROR] Unit file {filename} parse failed: {str(e)}")
                continue
                
        if not isinstance(unit_data, list):
            errors.append(f"[ERROR] Unit file {filename}: Root is not a list")
            continue
            
        # 번호 연속성 체크
        nums = [q.get("number") for q in unit_data if q.get("number") is not None]
        expected_nums = list(range(1, len(unit_data) + 1))
        if nums != expected_nums:
            errors.append(f"[ERROR] Unit file {filename}: Question numbers are not sequential. Got {nums}, expected {expected_nums}")
            
    return errors

def main():
    errors = validate_db()
    if errors:
        print(f"\n--- Validation Failed with {len(errors)} issue(s) ---")
        for err in errors:
            print(err)
    else:
        print("\n[SUCCESS] All validation checks passed! DB is robust and ready.")

if __name__ == "__main__":
    main()
