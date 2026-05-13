import json
import os
import asyncio
import google.generativeai as genai
from tqdm.asyncio import tqdm

# API 키 설정
with open(r'E:\Quiz-extraction\keys.txt', 'r') as f:
    KEYS = [line.strip() for line in f if line.strip()]

# 과목별 데이터 경로
SUBJECT = "승강기기능사"
INPUT_PATH = r'E:\DugiGo\client\src\data\승강기기능사\MASTER_DB.json'
OUTPUT_PATH = r'E:\DugiGo\client\src\data\승강기기능사\MASTER_DB.json'

# 모델 설정
MODEL_NAME = "models/gemini-3-flash-preview" # 최신 고효율 모델 사용
MAX_CONCURRENT_REQUESTS = 2 # API 부하를 줄이기 위해 동시 요청 수 제한
BATCH_SIZE = 20 # 한 번에 더 많은 문항을 묶어 호출 횟수 최소화

# 승강기기능사 분류 체계 (대단원: 중단원 리스트)
TAXONOMY = {
    "승강기개론": [
        "승강기의 종류 및 원리", 
        "주요 장치(카, 권상기, 제어반)", 
        "유압 승강기 기초",
        "에스컬레이터 기초"
    ],
    "승강기보수": [
        "자체점검 및 유지관리",
        "주요 부품의 보수 및 교체",
        "고장 진단 및 조치",
        "검사 기준 및 법규"
    ],
    "기계전기기초": [
        "기계 요소 및 역학 기초",
        "전기 이론 및 회로 기초",
        "제어 시스템 및 측정"
    ],
    "안전관리": [
        "승강기 운행 안전",
        "사고 사례 및 비상 조치",
        "소방 및 작업 안전"
    ]
}

# 분류 체계 텍스트화
TAXONOMY_TEXT = ""
for main, subs in TAXONOMY.items():
    TAXONOMY_TEXT += f"- {main}: {', '.join(subs)}\n"

async def classify_batch(model, batch, sem):
    async with sem:
        # 문항 데이터 텍스트화
        questions_text = ""
        for i, q in enumerate(batch):
            questions_text += f"[{i+1}] {q['question']}\n(해설: {q.get('explanation', '')[:100]}...)\n\n"

        prompt = f"""
당신은 국가기술자격 '승강기기능사' 교육 전문가입니다. 
제공된 {len(batch)}개의 문항을 다음 분류 체계에 따라 가장 적절한 '대단원'과 '중단원'으로 분류하세요.

[분류 체계]
{TAXONOMY_TEXT}

[분류 지침]
1. 각 문항에 대해 '대단원'과 '중단원'을 리스트에서 선택하세요.
2. 출력 형식은 반드시 JSON 배열 형태여야 하며, 각 요소는 {{"index": 번호, "main": "대단원", "sub": "중단원"}} 포맷이어야 합니다.
3. 다른 설명 없이 오직 JSON만 출력하세요.

[분항 리스트]
{questions_text}
"""
        try:
            response = await model.generate_content_async(prompt)
            # JSON 응답 정제
            res_text = response.text.replace('```json', '').replace('```', '').strip()
            results = json.loads(res_text)
            return results
        except Exception as e:
            print(f"Error in batch: {e}")
            return None

async def main():
    # 모델 초기화
    genai.configure(api_key=KEYS[0])
    model = genai.GenerativeModel(MODEL_NAME)
    sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

    # 데이터 로드
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found.")
        return

    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        full_data = json.load(f)
        data = full_data.get('questions', full_data) # questions 키가 있으면 가져오고 없으면 전체 사용

    if not isinstance(data, list):
        print(f"Error: Unexpected data format in {INPUT_PATH}. Expected a list or {{'questions': [...]}}.")
        return

    print(f"총 {len(data)}개의 문항을 분류합니다. (배치 크기: {BATCH_SIZE})")

    # 배치 생성
    batches = [data[i:i + BATCH_SIZE] for i in range(0, len(data), BATCH_SIZE)]
    
    tasks = []
    for batch in batches:
        tasks.append(classify_batch(model, batch, sem))

    # 병렬 실행 및 결과 수집
    all_results = await tqdm.gather(*tasks)

    # 결과 매핑
    count = 0
    for i, batch_res in enumerate(all_results):
        if batch_res:
            for res in batch_res:
                idx = res.get('index')
                if idx and (i * BATCH_SIZE + idx - 1) < len(data):
                    q = data[i * BATCH_SIZE + idx - 1]
                    q['subject'] = res.get('main', '기타')
                    q['sub_unit'] = res.get('sub', '기타')
                    count += 1

    # 파일 저장 (백업 생성 후)
    backup_path = INPUT_PATH + ".bak"
    if not os.path.exists(backup_path):
        import shutil
        shutil.copy2(INPUT_PATH, backup_path)
        print(f"Backup created: {backup_path}")

    # 최종 결과물 다시 객체 구조로 감싸기 (원래 구조 유지)
    if 'questions' in full_data:
        full_data['questions'] = data
    else:
        full_data = data

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(full_data, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Classification complete: {count}/{len(data)} questions updated.")
    
    # 통계 출력
    stats = {}
    for q in data:
        key = f"[{q.get('subject', 'Unknown')}] {q.get('sub_unit', 'Unknown')}"
        stats[key] = stats.get(key, 0) + 1
    
    print("\n--- Statistics ---")
    for key in sorted(stats.keys()):
        try:
            print(f"{key}: {stats[key]} questions")
        except:
            print(f"Encoding error printing stats for a key")

if __name__ == "__main__":
    import sys
    import io
    # 윈도우 인코딩 대응
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding='utf-8')
    asyncio.run(main())
