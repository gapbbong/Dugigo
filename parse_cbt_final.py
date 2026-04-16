import re
import json
import os

def run():
    text_path = 'd:/App/Dukigo/tmp/cbt_text.txt'
    with open(text_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Normalize weird spaces
    text = text.replace('\xa0', ' ')
    
    questions = []
    
    for i in range(21, 101):
        # Find start of current question and next question
        start_pattern = f"\\b{i}\\.\\s"
        start_match = re.search(start_pattern, text)
        if not start_match:
            continue
            
        end_pattern = f"\\b{i+1}\\.\\s"
        end_match = re.search(end_pattern, text[start_match.end():])
        chunk_end = start_match.end() + end_match.start() if end_match else len(text)
        chunk = text[start_match.end():chunk_end]
        
        # Now we parse the chunk. 
        # Format usually: {question_text} 1. {opt1} 2. {opt2} 3. {opt3} 4. {opt4} 정답 : [{ans}] 정답률 : {rate}% <문제 해설>{explanation}
        
        # 1. Extract Answer
        ans_match = re.search(r'정답\s*:\s*\[(\d+)\]', chunk)
        ans = int(ans_match.group(1)) if ans_match else 1
        
        # 2. Extract Explanation
        exp_match = re.search(r'<문제 해설>(.*?)(?:\[해설작성자|\[추가 해설|$)', chunk, re.DOTALL)
        exp = exp_match.group(1).strip() if exp_match else ""
        
        # Remove answer and explanation part from chunk to just leave Question and Options
        q_chunk = chunk
        if ans_match:
            q_chunk = chunk[:ans_match.start()]
            
        # 3. Extract Options
        # Options are indicated by "1. ", "2. ", "3. ", "4. " or "①", "②", "③", "④"
        # We split by these markers
        opt_matches = list(re.finditer(r'(?:[1-4]\.|[①-④])\s', q_chunk))
        
        options = []
        if len(opt_matches) >= 4:
            q_text = q_chunk[:opt_matches[0].start()].strip()
            for j in range(len(opt_matches)):
                opt_start = opt_matches[j].end()
                opt_end = opt_matches[j+1].start() if j+1 < len(opt_matches) else len(q_chunk)
                options.append(q_chunk[opt_start:opt_end].strip())
        else:
            q_text = q_chunk.strip()
            options = ["", "", "", ""] # fallback
            
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
            "question": q_text,
            "options": options[:4],
            "answer": ans,
            "explanation": exp,
            "level": "중"
        }
        questions.append(q_obj)

    # Now append to the main JSON
    main_json = 'd:/App/Dukigo/client/src/data/2016_02_questions.json'
    with open(main_json, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Remove any existing Q21-100 to avoid duplicates
    data = [q for q in data if q['question_num'] <= 20]
    data.extend(questions)
    
    with open(main_json, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully processed {len(questions)} questions. Total in JSON: {len(data)}")

if __name__ == "__main__":
    run()
