import json

path = r'src/data/승강기기능사/MASTER_DB.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
    questions = data.get('questions', data)

missing_images = []
keywords = ["그림", "도면", "회로도", "보기와 같이", "다음과 같은"]

for q in questions:
    text = (q.get('question', '') + ' ' + q.get('explanation', '')).lower()
    has_image_keyword = any(kw in text for kw in keywords)
    has_no_image_field = not q.get('question_img') and not q.get('image')
    
    # 예외: 해설에만 그림이 있는 경우는 제외하고 지문에 그림이 있다고 명시된 경우 위주로 찾음
    if has_image_keyword and has_no_image_field:
        # 지문에 명시적으로 "그림"이 있는 경우만 필터링 (정확도 향상)
        if any(kw in q.get('question', '') for kw in keywords):
            missing_images.append({
                "id": f"{q.get('year')}-{q.get('round')}-{q.get('number')}",
                "question": q.get('question', '')[:50] + "...",
                "page": q.get('page'),
                "pdf": q.get('pdf_file')
            })

print(f"\n--- Missing Image Report (승강기기능사) ---")
print(f"총 {len(missing_images)}개의 의심 문항이 발견되었습니다.")
for m in missing_images:
    print(f"[{m['id']}] (Page {m['page']}, {m['pdf']}) : {m['question']}")
