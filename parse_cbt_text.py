import re
import json
import os

def run():
    text_path = 'd:/App/Dukigo/tmp/cbt_text.txt'
    if not os.path.exists(text_path):
        print("File not found")
        return
        
    with open(text_path, 'r', encoding='utf-8') as f:
        text = f.read()

    questions = []
    
    # regex to find questions. 
    # Example format: 
    # 21. 송전선로의 안정을 향상시키는 대책이 아닌 것은?
    # ① 직렬 리액턴스를 크게 한다.
    # ② 속응 제동 저항기를 설치한다.
    # ...
    
    for i in range(21, 101):
        # find the start of the question
        start_pattern = f"\\b{i}\\.\\s"
        start_match = re.search(start_pattern, text)
        if not start_match:
            print(f"Could not find question {i}")
            continue
            
        # find the start of the *next* question to limit the search area
        end_pattern = f"\\b{i+1}\\.\\s"
        end_match = re.search(end_pattern, text[start_match.end():])
        
        chunk_end = start_match.end() + end_match.start() if end_match else len(text)
        chunk = text[start_match.end():chunk_end]
        
        # Now parse the chunk
        # It contains the question text, 4 options (usually ①, ②, ③, ④ or 1, 2, 3, 4)
        # We need to extract them.
        lines = [line.strip() for line in chunk.split('\n') if line.strip()]
        
        q_text = ""
        options = []
        
        # Very rough parsing
        option_markers = ['①', '②', '③', '④', '1.', '2.', '3.', '4.']
        
        parsing_options = False
        for line in lines:
            is_option = False
            for marker in option_markers:
                if line.startswith(marker):
                    options.append(line[len(marker):].strip())
                    parsing_options = True
                    is_option = True
                    break
            
            if not parsing_options and not is_option:
                q_text += line + " "
                
        # Subject mapping
        subject = ""
        if 21 <= i <= 40: subject = "전력공학"
        elif 41 <= i <= 60: subject = "전기기기"
        elif 61 <= i <= 80: subject = "회로이론 및 제어공학"
        elif 81 <= i <= 100: subject = "전기설비기술기준 및 판단기준"
        
        q_obj = {
            "id": f"2016_02_{i:02d}",
            "year": 2016,
            "round": "02",
            "question_num": i,
            "subject": subject,
            "question": q_text.strip(),
            "options": options[:4] if len(options) >= 4 else options,
            "answer": 1, # Placeholder, CBT usually puts answers at the bottom or separate
            "explanation": "",
            "level": "중"
        }
        questions.append(q_obj)

    out_path = 'd:/App/Dukigo/tmp/parsed_questions.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully parsed {len(questions)} questions.")
    
if __name__ == "__main__":
    run()
