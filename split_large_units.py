import os
import sys
import json
import re
import glob

sys.stdout.reconfigure(encoding='utf-8')

DEST_DATA_DIR = r'e:\DugiGo\client\src\data\자동화설비산업기사'
SRC_JSON = r'e:\Quiz-extraction-raw\자동화설비(구생산자동화) 산업기사 필기 기출\자동화설비_기출문제_마스터.json'
PUBLIC_IMG_DIR = r'e:\DugiGo\client\public\images\subjects\자동화설비산업기사'

TYPO_MAP = {
    '호름선도': '흐름선도',
    '력마디': '출력마디',
    '그루가 램': '프로그램',
    '를린': '틀린',
    '제결 베어링': '저널 베어링',
}

# Fine-grained 18 Sub-units Rules
RULES_18 = {
    # 과목 1: 자동제어
    '01. 제어계 개념 및 기본 요소': [
        r'피드백\s*제어', r'제어계', r'제어\s*요소', r'개루프', r'폐루프', r'조절계', r'조작량', r'제어량', r'목표값', r'자동\s*제어'
    ],
    '02. 블록선도 및 신호흐름선도': [
        r'블록\s*선도', r'신호\s*흐름', r'흐름선도', r'메이슨', r'입력\s*마디', r'출력\s*마디', r'루프\s*이득', r'마디'
    ],
    '03. 라플라스 변환 및 전달함수': [
        r'전달\s*함수', r'라플라스', r'임피던스', r'극점', r'영점', r'선형계', r'전환\s*함수', r'상태\s*방정식'
    ],
    '04. 시간_주파수 해석 및 안정도': [
        r'시간\s*응답', r'주파수\s*응답', r'특성\s*방정식', r'정상\s*상태', r'라우드', r'루스', r'나이키스트',
        r'보드\s*선도', r'과도\s*응답', r'안정도', r'이득\s*여유', r'위상\s*여유', r'감쇄비', r'고유\s*진동수', r'데시벨', r'근궤적'
    ],
    '05. 시퀀스 및 PLC 제어': [
        r'PLC', r'래더', r'릴레이', r'접점', r'논리\s*게이트', r'논리\s*회로', r'불\s*대수', r'진리표',
        r'드\s*모르간', r'니모닉', r'스텝', r'AND', r'OR', r'NAND', r'NOR', r'XOR', r'카운터', r'타이머', r'시퀀스'
    ],
    '06. 센서 및 계측 기기': [
        r'센서', r'리밋\s*스위치', r'포토', r'서보\s*모터', r'스태커', r'UART', r'AD\s*변환', r'DA\s*변환',
        r'열전대', r'측온', r'스트레인', r'인코더', r'디지털', r'아날로그', r'계측', r'측정'
    ],

    # 과목 2: 기계 요소 설계
    '07. 나사 및 볼트_너트 설계': [
        r'나사', r'볼트', r'너트', r'피치', r'리드', r'나삿산', r'체결력', r'자립'
    ],
    '08. 키_핀_코터 결합 요소': [
        r'키\(', r'키가', r'키의', r'반달키', r'평행키', r'깃털키', r'경사키', r'핀', r'코터'
    ],
    '09. 리벳 및 용접 이음': [
        r'리벳', r'용접', r'이음', r'체결', r'응력', r'인장', r'전단', r'안전율', r'하중'
    ],
    '10. 축 및 전동 기계요소': [
        r'베어링', r'기어', r'치차', r'축', r'저널', r'커플링', r'클러치', r'벨트', r'풀리', r'V벨트',
        r'체인', r'스프로킷', r'마찰차', r'모듈', r'잇수', r'동력\s*전달', r'감속기'
    ],
    '11. 완충 및 제동 장치': [
        r'스프링', r'브레이크', r'완충', r'플라이휠', r'완충기'
    ],
    '12. 투상법 및 기계제도 통칙': [
        r'투상법', r'단면도', r'제도', r'도면', r'척도', r'해칭', r'선의\s*종류'
    ],
    '13. 표면거칠기 및 공차_끼워맞춤': [
        r'치수', r'거칠기', r'끼워맞춤', r'공차', r'기하공차', r'재료\s*기호', r'표면\s*거칠기'
    ],

    # 과목 3: 공유압
    '14. 공유압 유체 역학 및 작동유': [
        r'작동유', r'점도', r'캐비테이션', r'공동현상', r'유압유', r'압축\s*공기', r'파스칼', r'베르누이', r'밀도', r'유체'
    ],
    '15. 유압 펌프 및 공기 압축기': [
        r'압축기', r'컴프레서', r'유압\s*펌프', r'펌프', r'토출량', r'기어\s*펌프', r'베인\s*펌프', r'피스톤\s*펌프'
    ],
    '16. 공유압 액추에이터': [
        r'유압\s*모터', r'실린더', r'액추에이터', r'유압\s*실린더', r'공압\s*실린더', r'요동\s*모터'
    ],
    '17. 공유압 제어 밸브': [
        r'밸브', r'릴리프', r'감압', r'유량\s*제어', r'방향\s*제어', r'압력\s*제어', r'셔틀', r'체크',
        r'오리피스', r'교축', r'스로틀', r'포트', r'카운터\s*밸런스'
    ],
    '18. 공유압 회로 및 부속기기': [
        r'어큐뮬레이터', r'축압기', r'필터', r'여과기', r'냉각기', r'탱크', r'배관', r'드레인', r'루브리케이터',
        r'미터\s*인', r'미터\s*아웃', r'출구\s*제어', r'입구\s*제어', r'브리드\s*오프', r'부속\s*장치', r'건조기'
    ]
}

def classify_18(subject_name, text):
    if '1과목' in subject_name:
        possible = [
            '01. 제어계 개념 및 기본 요소',
            '02. 블록선도 및 신호흐름선도',
            '03. 라플라스 변환 및 전달함수',
            '04. 시간_주파수 해석 및 안정도',
            '05. 시퀀스 및 PLC 제어',
            '06. 센서 및 계측 기기'
        ]
    elif '2과목' in subject_name:
        possible = [
            '07. 나사 및 볼트_너트 설계',
            '08. 키_핀_코터 결합 요소',
            '09. 리벳 및 용접 이음',
            '10. 축 및 전동 기계요소',
            '11. 완충 및 제동 장치',
            '12. 투상법 및 기계제도 통칙',
            '13. 표면거칠기 및 공차_끼워맞춤'
        ]
    elif '3과목' in subject_name:
        possible = [
            '14. 공유압 유체 역학 및 작동유',
            '15. 유압 펌프 및 공기 압축기',
            '16. 공유압 액추에이터',
            '17. 공유압 제어 밸브',
            '18. 공유압 회로 및 부속기기'
        ]
    else:
        possible = list(RULES_18.keys())

    for unit in possible:
        for pattern in RULES_18[unit]:
            if re.search(pattern, text, re.IGNORECASE):
                return unit
    return possible[0]

def main():
    print("=== Fine-Grained 18 Sub-units Splitting ===")
    
    # 1. Clean existing JSON files in target dir
    for f in glob.glob(os.path.join(DEST_DATA_DIR, '*.json')):
        os.remove(f)
    print("Cleaned old target files.")

    with open(SRC_JSON, 'r', encoding='utf-8') as f:
        raw_items = json.load(f)

    rebuilt_items = []
    
    for idx, item in enumerate(raw_items):
        qno = item.get('question_no', idx + 1)
        eround = item.get('exam_round', 1)
        subj_name = item.get('subject_name', '1과목 자동제어')
        
        qtext = item.get('question_text', '').strip()
        choices = item.get('options', [])
        ans = int(item.get('correct_answer', 1))
        exp = item.get('explanation', '').strip()
        
        for k, v in TYPO_MAP.items():
            qtext = qtext.replace(k, v)
            exp = exp.replace(k, v)
            choices = [c.replace(k, v) for c in choices]

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

        is_broken_choice = False
        if len(choices) != 4 or any(c in ['단,', '이때', '작용하는', '베어링', '위의', '다음'] for c in choices):
            is_broken_choice = True
        elif any('[보기' in str(c) for c in choices):
            is_broken_choice = True

        if is_broken_choice:
            if full_img_path:
                choices = ["[보기 1 (그림 참조)]", "[보기 2 (그림 참조)]", "[보기 3 (그림 참조)]", "[보기 4 (그림 참조)]"]
            else:
                choices = ["보기 ①", "보기 ②", "보기 ③", "보기 ④"]

        if not exp or len(exp.strip()) == 0:
            exp = f"본 문항은 {subj_name} 기출 핵심 개념을 묻는 문제로, 정답은 {ans}번입니다."

        full_text = f"{qtext} {exp} {' '.join(choices)}"
        sub_unit = classify_18(subj_name, full_text)

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

    # Balance items across sub-units if any file exceeds 100 items
    by_unit = {}
    for item in rebuilt_items:
        u = item['unit']
        if u not in by_unit:
            by_unit[u] = []
        by_unit[u].append(item)

    print("\nInitial 18 Sub-units Distribution:")
    for u, items in sorted(by_unit.items()):
        print(f"  - {u}: {len(items)} items")

    # If any unit still > 100, do sub-chunking
    final_by_unit = {}
    for unit_name, items in sorted(by_unit.items()):
        if len(items) > 100:
            # Chunk into parts <= 90
            chunk_size = 85
            total = len(items)
            part = 1
            for i in range(0, total, chunk_size):
                sub_chunk = items[i:i + chunk_size]
                part_name = f"{unit_name} ({part}부)"
                for q in sub_chunk:
                    q['unit'] = part_name
                    q['sub_unit'] = part_name
                final_by_unit[part_name] = sub_chunk
                part += 1
        else:
            final_by_unit[unit_name] = items

    print("\nFinal Output Files (< 100 items per file guaranteed):")
    final_master_items = []
    for unit_name, unit_items in sorted(final_by_unit.items()):
        safe_filename = unit_name.replace('/', '_').replace('\\', '_')
        file_path = os.path.join(DEST_DATA_DIR, f"{safe_filename}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(unit_items, f, ensure_ascii=False, indent=2)
        print(f"  - {safe_filename}.json ({len(unit_items)} items)")
        final_master_items.extend(unit_items)

    master_content = {
        "metadata": {
            "title": "자동화설비산업기사 MASTER DB",
            "total_questions": len(final_master_items),
            "sub_units_count": len(final_by_unit),
            "last_updated_at": "2026-07-31",
            "agent": "Antigravity Gatekeeper"
        },
        "questions": final_master_items
    }

    master_path = os.path.join(DEST_DATA_DIR, "Automation_Equipment_Industrial_MASTER_DB.json")
    with open(master_path, 'w', encoding='utf-8') as f:
        json.dump(master_content, f, ensure_ascii=False, indent=2)
    print(f"\nWritten Master DB: {master_path} ({len(final_master_items)} items)")

if __name__ == '__main__':
    main()
