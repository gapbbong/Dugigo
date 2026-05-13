import json

path = r'src/data/컴퓨터활용능력 2급/Literacy2_MASTER_DB.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
    if isinstance(data, dict):
        data = data.get('questions', [])

stats = {}
for q in data:
    key = f"{q.get('subject', 'Unknown')} | {q.get('sub_unit', 'Unknown')}"
    stats[key] = stats.get(key, 0) + 1

print("\n--- Computer Literacy Level 2 Statistics ---")
for k in sorted(stats.keys()):
    print(f"{k}: {stats[k]} questions")
