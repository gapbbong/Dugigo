import os
import json
import re
import urllib.request
import urllib.error
import time

DB_PATH = r'E:\DugiGo\client\src\data\정보처리산업기사\MASTER_DB.json'
REPORT_PATH = r'E:\DugiGo\infopro_typo_audit.md'

def load_api_keys():
    env_path = r'E:\DugiGo\client\.env.local'
    if not os.path.exists(env_path):
        raise FileNotFoundError(f".env.local not found at {env_path}")
    
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'GEMINI_API_KEYS\s*=\s*(.+)', content)
    if not match:
        raise ValueError("GEMINI_API_KEYS not found in .env.local")
    
    keys = [k.strip() for k in match.group(1).split(',') if k.strip()]
    if not keys:
        raise ValueError("No keys found in GEMINI_API_KEYS")
    return keys

def check_chunk_spell(api_key, questions_chunk):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={api_key}"
    
    formatted_questions = []
    for q in questions_chunk:
        formatted_questions.append({
            "number": q["number"],
            "question": q["question"],
            "choices": q["choices"],
            "explanation": q.get("explanation", "")
        })
        
    prompt = f"""너는 대한민국 국가기술자격시험(정보처리산업기사 등) 필기시험 문항의 오타 및 맞춤법을 정밀 검수하는 전문 QA 에이전트이다.
다음 제공된 시험 문항 데이터의 오타, 맞춤법 오류, 잘못 표기된 컴퓨터 전공 기술 용어(예: SQL, DDL, MVC 등 영문 철자나 한글 표기 오류), 한글 깨짐 흔적, 부적절한 특수 기호 등을 철저히 검사해라.

주의 사항:
- 띄어쓰기는 문맥을 크게 해치지 않는 이상 너무 지엽적이므로 무시하고, 오타, 깨진 글자(예: 걁, `` 같은 흔적), 맞춤법 파괴, 전공 용어 오류 등 심각한 오타 위주로 잡아내라.
- 원본 텍스트에 오타가 없거나 정상적인 문장이면 수정 대상에 넣지 마라.
- 문항의 번호, 정답 값(answer), 선택지 구조는 절대로 임의로 변경하지 말고 오직 텍스트 수정만 제안하라.
- 수정 결과는 반드시 제공된 JSON 스키마를 엄격히 준수하여 응답해라.

검수할 문항 데이터:
{json.dumps(formatted_questions, ensure_ascii=False, indent=2)}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "results": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "number": { "type": "INTEGER" },
                                "type": { "type": "STRING", "enum": ["question", "choices", "explanation"] },
                                "choice_index": { "type": "INTEGER", "description": "type이 choices일 때 몇 번째 선택지인지 (0-indexed). 해당 없음 -1" },
                                "original": { "type": "STRING", "description": "오타가 있는 부분의 원본 텍스트" },
                                "fixed": { "type": "STRING", "description": "수정된 최종 텍스트" },
                                "reason": { "type": "STRING", "description": "오류 사유와 수정 내용 요약" }
                            },
                            "required": ["number", "type", "original", "fixed", "reason"]
                        }
                    }
                },
                "required": ["results"]
            }
        }
    }
    
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req) as res:
                res_body = res.read().decode('utf-8')
                data = json.loads(res_body)
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8')
            print(f"Attempt {attempt+1} - HTTP Error {e.code}: {e.reason}\n{err_msg}")
            if e.code == 429 or e.code == 503:
                time.sleep(15)
                continue
            break
        except Exception as e:
            print(f"Attempt {attempt+1} - Error: {str(e)}")
            time.sleep(2)
            continue
    return None

def rule_based_checks(questions):
    issues = []
    
    # 1. 선택지 중복 검사
    for q in questions:
        choices = q.get("choices", [])
        cleaned_choices = [c.strip().replace(" ", "") for c in choices]
        if len(cleaned_choices) != len(set(cleaned_choices)):
            seen = set()
            dupes = []
            for c in choices:
                c_clean = c.strip().replace(" ", "")
                if c_clean in seen:
                    if c not in dupes:
                        dupes.append(c)
                seen.add(c_clean)
            issues.append({
                "number": q["number"],
                "type": "duplicate_choices",
                "choices": choices,
                "duplicates": dupes,
                "reason": f"선택지 중 중복된 항목이 존재합니다: {', '.join(dupes)}"
            })
            
    # 2. 문항 중복 검사 (경고용)
    seen_questions = {}
    for q in questions:
        q_text = q.get("question", "").strip().replace(" ", "")
        if not q_text:
            continue
        if q_text in seen_questions:
            seen_questions[q_text].append(q["number"])
        else:
            seen_questions[q_text] = [q["number"]]
            
    duplicate_q_groups = {q_text: nums for q_text, nums in seen_questions.items() if len(nums) > 1}
    for q_text, nums in duplicate_q_groups.items():
        # 첫 번째 문제 지문 미리보기
        preview = q_text[:30] + "..." if len(q_text) > 30 else q_text
        issues.append({
            "numbers": nums,
            "type": "duplicate_question",
            "preview": preview,
            "reason": f"문항 지문이 거의 동일한 중복 문항들입니다: 번호 {nums}. (지침에 따라 삭제하지 않고 보존합니다)"
        })
        
    return issues

def main():
    print("Loading MASTER_DB.json...")
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return
        
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        db_data = json.load(f)
        
    questions = db_data.get("questions", [])
    print(f"Loaded {len(questions)} questions.")
    
    # 1. 규칙 기반 검사 수행
    print("Running rule-based checks (Duplicate choices / Duplicate questions)...")
    rule_issues = rule_based_checks(questions)
    
    # 2. API 기반 맞춤법 및 오타 검사 수행
    print("Loading API Keys...")
    try:
        api_keys = load_api_keys()
    except Exception as e:
        print(f"Failed to load API Keys: {e}")
        return
        
    print(f"Loaded {len(api_keys)} API keys. Running spelling check via Gemini 2.5 Flash Lite...")
    spell_issues = []
    chunk_size = 10
    total_q = len(questions)
    
    for chunk_idx, i in enumerate(range(0, total_q, chunk_size)):
        chunk = questions[i:i+chunk_size]
        print(f"Checking questions {chunk[0]['number']} to {chunk[-1]['number']} ({chunk_idx + 1}/{ (total_q + chunk_size - 1)//chunk_size })...")
        
        # 라운드 로빈 방식으로 키 선택
        api_key = api_keys[chunk_idx % len(api_keys)]
        
        result = check_chunk_spell(api_key, chunk)
        
        # 호출 실패 시 다른 키로 재시도
        if result is None and len(api_keys) > 1:
            for retry_offset in range(1, len(api_keys)):
                alt_key = api_keys[(chunk_idx + retry_offset) % len(api_keys)]
                print(f"Retrying chunk {chunk[0]['number']}-{chunk[-1]['number']} with alternative API key...")
                result = check_chunk_spell(alt_key, chunk)
                if result is not None:
                    break
        
        if result and "results" in result:
            for item in result["results"]:
                spell_issues.append(item)
        else:
            print(f"Warning: Failed to check spelling for chunk {chunk[0]['number']}-{chunk[-1]['number']}")
        
        time.sleep(4) # API Rate Limit 방지용 딜레이
        
    # 3. 리포트 생성
    print("Generating report...")
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write("# 🕵️‍♂️ 정보처리산업기사 152문항 QA 검수 결과 리포트\n\n")
        f.write(f"- **검수 시각**: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"- **검수 대상**: `MASTER_DB.json` ({len(questions)}개 문항)\n")
        f.write(f"- **검수 방법**: 규칙 기반 중복 검사 + Gemini 2.5 Flash Lite 활용 정밀 오타 검출\n\n")
        
        # 3.1 선택지 중복
        f.write("## 1. 🚨 선택지 중복 오류 (수정 대상)\n\n")
        dupe_choices = [x for x in rule_issues if x["type"] == "duplicate_choices"]
        if dupe_choices:
            f.write("| 문항 번호 | 중복 선택지 내용 | 전체 선택지 구성 | 조치 계획 |\n")
            f.write("| --- | --- | --- | --- |\n")
            for dc in dupe_choices:
                choices_str = ", ".join([f"{idx+1}) {c}" for idx, c in enumerate(dc["choices"])])
                f.write(f"| {dc['number']} | {', '.join(dc['duplicates'])} | {choices_str} | 수동 또는 PDF 원본 대조 후 수정 필요 |\n")
        else:
            f.write("✅ 중복된 선택지가 발견되지 않았습니다. 깨끗합니다!\n")
        f.write("\n")
        
        # 3.2 문항 중복 (경고 및 유지 보존)
        f.write("## 2. ⚠️ 지문 중복 문항 (보존 대상)\n\n")
        f.write("> [!NOTE]\n")
        f.write("> 사용자 요청에 따라 지문이 중복되더라도 문항을 삭제하지 않고 보존합니다. 아래는 중복 문항 리스트입니다.\n\n")
        
        dupe_questions = [x for x in rule_issues if x["type"] == "duplicate_question"]
        if dupe_questions:
            f.write("| 중복 그룹 (문항 번호) | 지문 미리보기 | 이유 |\n")
            f.write("| --- | --- | --- |\n")
            for dq in dupe_questions:
                f.write(f"| {dq['numbers']} | {dq['preview']} | 지문 유사/동일. 삭제 없이 유지. |\n")
        else:
            f.write("✅ 중복된 지문의 문항이 발견되지 않았습니다.\n")
        f.write("\n")
        
        # 3.3 맞춤법 및 오타 검출
        f.write("## 3. ✍️ 오타 및 맞춤법 검출 내역 (수정 제안)\n\n")
        if spell_issues:
            f.write("| 문항 번호 | 위치 | 원본 텍스트 | 수정 제안 텍스트 | 수정 사유 및 검토의견 |\n")
            f.write("| --- | --- | --- | --- | --- |\n")
            for si in spell_issues:
                # 개행 문자 제거하여 마크다운 테이블 깨짐 방지
                orig = si['original'].replace('\n', ' <br> ')
                fixed = si['fixed'].replace('\n', ' <br> ')
                loc = f"{si['type']}"
                if si['type'] == 'choices' and si.get('choice_index', -1) != -1:
                    loc += f"[{si['choice_index'] + 1}번 선택지]"
                f.write(f"| {si['number']} | {loc} | {orig} | {fixed} | {si['reason']} |\n")
        else:
            f.write("✅ 탐지된 오타나 맞춤법 오류가 없습니다.\n")
            
    print(f"QA audit completed. Report saved to {REPORT_PATH}")
    
if __name__ == "__main__":
    main()
