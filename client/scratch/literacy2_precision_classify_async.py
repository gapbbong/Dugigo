import json
import os
import asyncio
import google.generativeai as genai
from tqdm.asyncio import tqdm

# API 키 설정
with open(r'E:\Quiz-extraction\keys.txt', 'r') as f:
    KEYS = [line.strip() for line in f if line.strip()]

# 과목별 데이터 경로
SUBJECT = "컴퓨터활용능력 2급"
INPUT_PATH = r'E:\DugiGo\client\src\data\컴퓨터활용능력 2급\Literacy2_MASTER_DB.json'
OUTPUT_PATH = r'E:\DugiGo\client\src\data\컴퓨터활용능력 2급\Literacy2_MASTER_DB.json'

# 모델 설정
MODEL_NAME = "models/gemini-3-flash-preview"
MAX_CONCURRENT_REQUESTS = 2 
BATCH_SIZE = 25 # 컴활은 문항이 많으므로 배치를 조금 더 크게 잡습니다.

# 컴활 2급 분류 체계
TAXONOMY = {
    "[1과목] 컴퓨터 일반": [
        "Windows OS 설정",
        "컴퓨터 하드웨어",
        "소프트웨어 및 자료",
        "네트워크 및 인터넷",
        "멀티미디어 기술",
        "정보 보안 및 ICT"
    ],
    "[2과목] 스프레드시트 일반": [
        "워크시트 관리",
        "셀 서식 및 편집",
        "수식 및 함수",
        "데이터 분석",
        "차트 활용",
        "매크로 및 인쇄"
    ]
}

TAXONOMY_TEXT = ""
for main, subs in TAXONOMY.items():
    TAXONOMY_TEXT += f"- {main}: {', '.join(subs)}\n"

async def classify_batch(model, batch, sem):
    async with sem:
        questions_text = ""
        for i, q in enumerate(batch):
            questions_text += f"[{i+1}] {q['question']}\n(해설: {q.get('explanation', '')[:100]}...)\n\n"

        prompt = f"""
당신은 국가기술자격 '컴퓨터활용능력 2급' 교육 전문가입니다. 
제공된 {len(batch)}개의 문항을 다음 분류 체계에 따라 가장 적절한 '대단원'과 '소단원'으로 분류하세요.

[분류 체계]
{TAXONOMY_TEXT}

[분류 지침]
1. 문항이 '컴퓨터 일반' 관련이면 [1과목], '엑셀/스프레드시트' 관련이면 [2과목]으로 분류하세요.
2. 출력 형식은 반드시 JSON 배열 형태여야 하며, 각 요소는 {{"index": 번호, "main": "대단원", "sub": "소단원"}} 포맷이어야 합니다.
3. 다른 설명 없이 오직 JSON만 출력하세요.

[분항 리스트]
{questions_text}
"""
        try:
            response = await model.generate_content_async(prompt)
            res_text = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(res_text)
        except Exception:
            return None

async def main():
    genai.configure(api_key=KEYS[0])
    model = genai.GenerativeModel(MODEL_NAME)
    sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found.")
        return

    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        full_data = json.load(f)
        
    # 데이터 구조 유연하게 처리
    if isinstance(full_data, dict):
        data = full_data.get('questions', [])
    else:
        data = full_data

    if not isinstance(data, list):
        print(f"Error: Unexpected data format in {INPUT_PATH}.")
        return

    print(f"컴활 2급 총 {len(data)}개의 문항을 분류합니다. (배치 크기: {BATCH_SIZE})")

    batches = [data[i:i + BATCH_SIZE] for i in range(0, len(data), BATCH_SIZE)]
    tasks = [classify_batch(model, batch, sem) for batch in batches]

    all_results = await tqdm.gather(*tasks)

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

    # 원래 구조 유지하며 저장
    if isinstance(full_data, dict) and 'questions' in full_data:
        full_data['questions'] = data
    else:
        full_data = data

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(full_data, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Computer Literacy Level 2: {count}/{len(data)} questions updated.")

if __name__ == "__main__":
    import sys, io
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
    asyncio.run(main())
