import os
import json
import re

DATA_DIR = r'e:\DugiGo\client\src\data'

def validate_json_files():
    files = [f for f in os.listdir(DATA_DIR) if f.endswith('_questions.json')]
    report = []

    for file_name in files:
        file_path = os.path.join(DATA_DIR, file_name)
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                report.append(f"[ERROR] {file_name}: Invalid JSON format - {str(e)}")
                continue

        if not isinstance(data, list):
            report.append(f"[ERROR] {file_name}: Root is not a list")
            continue

        q_nums = []
        q_texts = set()
        
        for i, q in enumerate(data):
            q_num = q.get('question_num')
            q_id = q.get('id')
            q_text = q.get('question', '')
            options = q.get('options', [])
            answer = q.get('answer')
            explanation = q.get('explanation', '')

            # Basic checks
            if q_num is None:
                report.append(f"[ERROR] {file_name} Index {i}: Missing question_num")
            else:
                q_nums.append(q_num)

            if not q_id:
                report.append(f"[WARNING] {file_name} Q{q_num}: Missing id")

            if not q_text:
                report.append(f"[ERROR] {file_name} Q{q_num}: Empty question text")
            
            if q_text in q_texts:
                report.append(f"[WARNING] {file_name} Q{q_num}: Duplicate question text found")
            q_texts.add(q_text)

            if len(options) != 4:
                report.append(f"[ERROR] {file_name} Q{q_num}: Expected 4 options, got {len(options)}")
            
            if not (1 <= answer <= 4) if isinstance(answer, int) else False:
                report.append(f"[ERROR] {file_name} Q{q_num}: Invalid answer value: {answer}")

            if not explanation:
                report.append(f"[WARNING] {file_name} Q{q_num}: Empty explanation")

            # Option prefix check (1., 2., etc)
            prefixes = []
            for j, opt in enumerate(options):
                match = re.match(r'^(\d)[\.번\s]', str(opt))
                if match:
                    prefixes.append(int(match.group(1)))
            
            if prefixes:
                if len(prefixes) != 4:
                    report.append(f"[WARNING] {file_name} Q{q_num}: Inconsistent option prefixes: {prefixes}")
                elif prefixes != [1, 2, 3, 4]:
                    report.append(f"[ERROR] {file_name} Q{q_num}: Option prefixes are out of order: {prefixes}")

            # LaTeX check (basic)
            if '$' in q_text:
                dollars = q_text.count('$')
                if dollars % 2 != 0:
                    report.append(f"[WARNING] {file_name} Q{q_num}: Mismatched LaTeX dollars ($) in question")
            
            if '$' in explanation:
                dollars = explanation.count('$')
                if dollars % 2 != 0:
                    report.append(f"[WARNING] {file_name} Q{q_num}: Mismatched LaTeX dollars ($) in explanation")

        # Sequence check
        if q_nums:
            expected_nums = list(range(1, len(data) + 1))
            if q_nums != expected_nums:
                missing = set(expected_nums) - set(q_nums)
                extra = set(q_nums) - set(expected_nums)
                report.append(f"[ERROR] {file_name}: Sequence mismatch. Missing: {missing}, Extra/Dup: {extra}")

    return report

if __name__ == "__main__":
    results = validate_json_files()
    for line in results:
        print(line)
    if not results:
        print("All checks passed!")
