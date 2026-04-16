import re
import json

def run():
    with open('d:/App/Dukigo/tmp/round2_ocr.txt', 'r', encoding='utf-8') as f:
        text = f.read()
        
    questions = []
    
    # Pre-clean text a bit
    text = re.sub(r'--- Page \d+ ---', '', text)
    
    for i in range(1, 61):
        q_num_str = f"{i:02d}"
        # Look for the question number e.g., "01 " or "01. " or "01\n"
        start_pattern = r'\b' + q_num_str + r'[\s\.]'
        start_match = re.search(start_pattern, text)
        
        if not start_match:
            print(f"Missing question {i}")
            continue
            
        # Find next question
        next_num_str = f"{i+1:02d}"
        end_pattern = r'\b' + next_num_str + r'[\s\.]'
        end_match = re.search(end_pattern, text[start_match.end():])
        
        chunk_end = start_match.end() + end_match.start() if end_match else len(text)
        chunk = text[start_match.end():chunk_end]
        
        # Clean the chunk
        q_lines = [l.strip() for l in chunk.split('\n') if l.strip()]
        
        # Heuristic: the first few lines are the question, then options (usually (1) (2) (3) (4) or @ @ @ @)
        q_text = ""
        options = []
        
        parsing_options = False
        opt_markers = ['(1)', '(2)', '(3)', '(4)', '①', '②', '③', '④', '@', '0']
        
        for line in q_lines:
            is_opt = False
            for marker in opt_markers:
                if line.startswith(marker):
                    options.append(line[len(marker):].strip())
                    parsing_options = True
                    is_opt = True
                    break
            
            if not parsing_options and not is_opt:
                q_text += line + " "
                
        # Fill missing options
        while len(options) < 4:
            options.append("보기 텍스트 오류 - 수동 확인 요망")
            
        subject = ""
        if i <= 20: subject = "전기이론"
        elif i <= 40: subject = "전기기기"
        else: subject = "전기설비"
        
        questions.append({
            "id": f"2016_02_{i:02d}",
            "year": 2016,
            "round": "02",
            "question_num": i,
            "subject": subject,
            "question": q_text.strip(),
            "options": options[:4] if len(options) >= 4 else options,
            "answer": 1,
            "explanation": "해설 수동 확인 요망",
            "level": "중"
        })
        
    main_json = 'd:/App/Dukigo/client/src/data/2016_02_questions.json'
    with open(main_json, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
        
    print(f"Extracted {len(questions)} questions from OCR and overwritten {main_json}")
    
if __name__ == "__main__":
    run()
