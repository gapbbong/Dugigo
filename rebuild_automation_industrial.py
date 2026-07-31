import os
import sys
import json
import re
import time
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

SRC_JSON = r'e:\Quiz-extraction-raw\자동화설비(구생산자동화) 산업기사 필기 기출\자동화설비_기출문제_마스터.json'
DEST_DATA_DIR = r'e:\DugiGo\client\src\data\자동화설비산업기사'
PUBLIC_IMG_DIR = r'e:\DugiGo\client\public\images\subjects\자동화설비산업기사'
ENV_PATH = r'e:\DugiGo\client\.env.local'

def load_api_keys():
    if not os.path.exists(ENV_PATH):
        return []
    with open(ENV_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'GEMINI_API_KEYS\s*=\s*(.+)', content)
    if not match:
        return []
    return [k.strip() for k in match.group(1).split(',') if k.strip()]

API_KEYS = load_api_keys()
KEY_INDEX = 0

def call_gemini(prompt, response_schema=None, retries=3):
    global KEY_INDEX
    if not API_KEYS:
        return None
    
    for _ in range(retries):
        key = API_KEYS[KEY_INDEX % len(API_KEYS)]
        KEY_INDEX += 1
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={key}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        if response_schema:
            payload["generationConfig"] = {
                "responseMimeType": "application/json",
                "responseSchema": response_schema
            }
            
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                text = result['candidates'][0]['content']['parts'][0]['text']
                if response_schema:
                    return json.loads(text)
                return text
        except Exception as e:
            time.sleep(1)
    return None

TYPO_MAP = {
    '호름선도': '흐름선도',
    '력마디': '출력마디',
    '그루가 램': '프로그램',
    '를린': '틀린',
    '제결 베어링': '저널 베어링',
}

RULES = {
    '01. 제어공학 기초 및 전달함수': [
        r'전달\s*함수', r'블록\s*선도', r'신호\s*흐름', r'라플라스', r'임피던스', r'메이슨', r'흐름선도',
        r'입력\s*마디', r'출력\s*마디', r'피드백', r'루프', r'게인', r'선형계', r'극점', r'영점', r'루프이득'
    ],
    '02. 시간/주파수 해석 및 안정도': [
        r'시간\s*응답', r'주파수\s*응답', r'특성\s*방정식', r'정상\s*상태', r'라우드', r'루스', r'나이키스트',
        r'보드\s*선도', r'과도\s*응답', r'안정도', r'이득\s*여유', r'위상\s*여유', r'감쇄비', r'감쇠', r'고유\s*진동수',
        r'응답\s*시간', r'데시벨', r'근궤적'
    ],
    '03. 시퀀스 및 PLC 제어': [
        r'PLC', r'래더', r'릴레이', r'접점', r'논리\s*게이트', r'논리\s*회로', r'불\s*대수', r'진리표',
        r'드\s*모르간', r'니모닉', r'스텝', r'AND', r'OR', r'NAND', r'NOR', r'XOR', r'카운터', r'타이머',
        r'순서\s*제어', r'무접점', r'유접점', r'플립플롭', r'시퀀스'
    ],
    '04. 센서 및 계측 기기': [
        r'센서', r'리밋\s*스위치', r'포토', r'서보\s*모터', r'스태커', r'UART', r'AD\s*변환', r'DA\s*변환',
        r'열전대', r'측온', r'스트레인', r'인코더', r'디지털', r'아날로그', r'계측', r'측정', r'온도계', r'압력계'
    ],
    '05. 체결 및 결합용 기계요소': [
        r'나사', r'볼트', r'너트', r'피치', r'리드', r'키\(', r'키가', r'키의', r'반달키', r'평행키', r'깃털키',
        r'핀', r'코터', r'리벳', r'용접', r'이음', r'체결', r'응력', r'인장', r'전단', r'안전율', r'하중'
    ],
    '06. 축 및 전동 기계요소': [
        r'베어링', r'기어', r'치차', r'축', r'저널', r'커플링', r'클러치', r'벨트', r'풀리', r'V벨트',
        r'체인', r'스프로킷', r'마찰차', r'모듈', r'잇수', r'동력\s*전달', r'감속기'
    ],
    '07. 완충/제동 요소 및 기계제도': [
        r'스프링', r'브레이크', r'완충', r'플라이휠', r'투상법', r'단면도', r'치수', r'거칠기', r'끼워맞춤',
        r'공차', r'기하공차', r'재료\s*기호', r'제도', r'도면', r'척도', r'해칭'
    ],
    '08. 공유압 기초 및 동력원': [
        r'작동유', r'점도', r'캐비테이션', r'공동현상', r'압축기', r'컴프레서', r'유압\s*펌프', r'펌프',
        r'유압\s*모터', r'실린더', r'유압유', r'압축\s*공기', r'파스칼', r'베르누이', r'밀도'
    ],
    '09. 공유압 제어 밸브': [
        r'밸브', r'릴리프', r'감압', r'유량\s*제어', r'방향\s*제어', r'압력\s*제어', r'셔틀', r'체크',
        r'오리피스', r'교축', r'스로틀', r'포트', r'카운터\s*밸런스'
    ],
    '10. 공유압 회로 및 부속기기': [
        r'어큐뮬레이터', r'축압기', r'필터', r'여과기', r'냉각기', r'탱크', r'배관', r'드레인', r'루브리케이터',
        r'미터\s*인', r'미터\s*아웃', r'출구\s*제어', r'입구\s*제어', r'브리드\s*오프', r'부속\s*장치', r'건조기'
    ]
}

def classify_question(subject_name, text):
    if '1과목' in subject_name:
        possible = ['01. 제어공학 기초 및 전달함수', '02. 시간/주파수 해석 및 안정도', '03. 시퀀스 및 PLC 제어', '04. 센서 및 계측 기기']
    elif '2과목' in subject_name:
        possible = ['05. 체결 및 결합용 기계요소', '06. 축 및 전동 기계요소', '07. 완충/제동 요소 및 기계제도']
    elif '3과목' in subject_name:
        possible = ['08. 공유압 기초 및 동력원', '09. 공유압 제어 밸브', '10. 공유압 회로 및 부속기기']
    else:
        possible = list(RULES.keys())

    for unit in possible:
        for pattern in RULES[unit]:
            if re.search(pattern, text, re.IGNORECASE):
                return unit
    return possible[0]

def main():
    print("=== Rebuilding Automation Equipment Industrial Engineer Questions ===")
    os.makedirs(DEST_DATA_DIR, exist_ok=True)
    
    with open(SRC_JSON, 'r', encoding='utf-8') as f:
        raw_items = json.load(f)

    print(f"Loaded {len(raw_items)} raw items.")

    rebuilt_items = []
    
    for idx, item in enumerate(raw_items):
        qno = item.get('question_no', idx + 1)
        eround = item.get('exam_round', 1)
        subj_name = item.get('subject_name', '1과목 자동제어')
        
        qtext = item.get('question_text', '').strip()
        choices = item.get('options', [])
        ans = int(item.get('correct_answer', 1))
        exp = item.get('explanation', '').strip()
        
        # 1. Apply Typo Correction
        for k, v in TYPO_MAP.items():
            qtext = qtext.replace(k, v)
            exp = exp.replace(k, v)
            choices = [c.replace(k, v) for c in choices]

        # 2. Fix Image Path
        img_name = None
        if item.get('image_url'):
            img_name = os.path.basename(item.get('image_url'))
        elif item.get('metadata', {}).get('image_path'):
            img_name = os.path.basename(item.get('metadata').get('image_path'))
            
        full_img_path = None
        if img_name:
            local_img = os.path.join(PUBLIC_IMG_DIR, img_name)
            if os.path.exists(local_img):
                full_img_path = f"/images/subjects/자동화설비산업기사/{img_name}"

        # 3. Fix Broken Choices / Placeholders if needed
        is_broken_choice = False
        if len(choices) != 4 or any(c in ['단,', '이때', '작용하는', '베어링', '위의', '다음'] for c in choices):
            is_broken_choice = True
        elif any('[보기' in str(c) for c in choices):
            is_broken_choice = True

        if is_broken_choice:
            # Fallback choice reconstruction if choices broken
            if full_img_path:
                choices = ["[보기 1 (그림 참조)]", "[보기 2 (그림 참조)]", "[보기 3 (그림 참조)]", "[보기 4 (그림 참조)]"]
            else:
                choices = ["보기 ①", "보기 ②", "보기 ③", "보기 ④"]

        # 4. Fill missing explanation if empty
        if not exp or len(exp.strip()) == 0:
            exp = f"본 문항은 {subj_name} 기출 핵심 개념을 묻는 문제로, 정답은 {ans}번입니다."

        # 5. Classify Sub-Unit
        full_text = f"{qtext} {exp} {' '.join(choices)}"
        sub_unit = classify_question(subj_name, full_text)

        qid = f"ae_ind_2026_{eround}_{qno}"
        
        rebuilt = {
            "number": qno,
            "question": qtext,
            "choices": choices,
            "answer": ans if ans in [1,2,3,4] else 1,
            "explanation": exp,
            "question_img": full_img_path,
            "subject": "자동화설비산업기사",
            "id": qid,
            "round_info": f"자동화설비 산업기사 2026년 {eround}회",
            "year": 2026,
            "round": eround,
            "unit": sub_unit,
            "sub_unit": sub_unit,
            "frequency": 1
        }
        rebuilt_items.append(rebuilt)

    # Group into 10 Sub-unit files
    by_unit = {}
    for item in rebuilt_items:
        u = item['unit']
        if u not in by_unit:
            by_unit[u] = []
        by_unit[u].append(item)

    print("\nWriting Sub-unit JSON files:")
    for unit_name, unit_items in sorted(by_unit.items()):
        safe_filename = unit_name.replace('/', '_').replace('\\', '_')
        file_path = os.path.join(DEST_DATA_DIR, f"{safe_filename}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(unit_items, f, ensure_ascii=False, indent=2)
        print(f"  - {safe_filename}.json ({len(unit_items)} items)")

    # Write Master DB
    master_content = {
        "metadata": {
            "title": "자동화설비산업기사 MASTER DB",
            "total_questions": len(rebuilt_items),
            "sub_units_count": len(by_unit),
            "last_updated_at": "2026-07-28",
            "agent": "Antigravity Gatekeeper"
        },
        "questions": rebuilt_items
    }

    master_path = os.path.join(DEST_DATA_DIR, "Automation_Equipment_Industrial_MASTER_DB.json")
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(master_content, f, ensure_ascii=False, indent=2)
    print(f"\nWritten Master DB: {master_path} ({len(rebuilt_items)} items)")

if __name__ == '__main__':
    main()
