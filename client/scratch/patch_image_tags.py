import json
import re

path = r'src/data/승강기기능사/MASTER_DB.json'
img_regex = re.compile(r'<img[^>]+src=[\"\']([^\"\']+)[\"\'][^>]*>')

with open(path, 'r', encoding='utf-8') as f:
    full_data = json.load(f)
    questions = full_data.get('questions', full_data)

count = 0
for q in questions:
    if 'question' in q:
        match = img_regex.search(q['question'])
        if match:
            # 1. 이미지 경로 추출
            img_src = match.group(1)
            # 2. 필드 업데이트 (기존 경로가 없을 때만 혹은 덮어쓰기)
            q['question_img'] = img_src
            # 3. 텍스트에서 태그 제거 및 정제
            q['question'] = img_regex.sub('', q['question']).strip()
            count += 1

with open(path, 'w', encoding='utf-8') as f:
    json.dump(full_data, f, indent=2, ensure_ascii=False)

print(f"--- Step 1: Image Tag Patch Report ---")
print(f"총 {count}개의 문항에서 이미지 태그를 필드로 이주시켰습니다.")
