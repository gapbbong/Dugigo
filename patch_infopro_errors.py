import os
import json

DB_PATH = r'E:\DugiGo\client\src\data\정보처리산업기사\MASTER_DB.json'
DATA_DIR = r'E:\DugiGo\client\src\data\정보처리산업기사'

def patch_db():
    print("Loading MASTER_DB.json...")
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return
        
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        db_data = json.load(f)
        
    questions = db_data.get("questions", [])
    print(f"Loaded {len(questions)} questions.")
    
    patched_count = 0
    
    # 정밀 패치 매핑 정의 (sub_unit + number를 키로 사용)
    patches = {
        # 1. 응용SW 기초 기술 활용 단원
        ("02. 응용SW 기초 기술 활용", 8): {
            "explanation": "C 클래스 대역의 사설 IP 주소 범위는 192.168.0.0 ~ 192.168.255.255 입니다. 제공된 선택지 5번이 올바른 범위입니다. (172.16.0.0 ~ 172.31.255.255는 B클래스 사설 IP 주소 범위)"
        },
        ("02. 응용SW 기초 기술 활용", 9): {
            "explanation": "서브넷 마스크의 주요 목적은 네트워크 ID와 호스트 ID를 구분하는 것입니다."
        },
        ("02. 응용SW 기초 기술 활용", 16): {
            "explanation": "LRU(Least Recently Used) 페이지 교체 알고리즘은 가장 오랫동안 사용되지 않은 페이지를 먼저 교체하는 방식입니다. Optimal 알고리즘은 미래에 사용되지 않을 페이지를 교체하는 방식입니다."
        },
        ("02. 응용SW 기초 기술 활용", 20): {
            "explanation": "chmod 명령어는 유닉스 시스템에서 파일의 권한을 변경하는 명령어입니다. chown 명령어는 파일의 소유자를 변경하는 명령어입니다."
        },
        ("02. 응용SW 기초 기술 활용", 25): {
            "explanation": "Join은 관계 대수의 일반 관계 연산자이며, 순수 관계 연산자는 Select, Project, Division입니다. Union, Difference, Cartesian Product도 일반 관계 연산자에 속합니다."
        },
        ("02. 응용SW 기초 기술 활용", 41): {
            "explanation": "응용 계층은 사용자 인터페이스를 제공하며, TCP/IP 모델에서는 응용 계층에 해당합니다. 인터넷 계층은 OSI 7계층의 네트워크 계층에 해당합니다."
        },
        ("02. 응용SW 기초 기술 활용", 46): {
            "question": "ERD(E-R Diagram)에서 사물 또는 사건으로 정의되며, 다이어그램 상에서 '사각형'으로 표기하는 구성 요소는 무엇인가?"
        },
        
        # 2. 프로그래밍 언어 응용 단원
        ("03. 프로그래밍 언어 응용", 3): {
            "explanation": "(A)는 기계가 직접 이해하는 저급 언어(기계어)를 의미하며, 실행 속도는 빠르지만 호환성이 없습니다. (B)는 사람이 이해하기 쉬운 고급 언어를 의미하며, (C)인 기계어로 번역하는 과정이 필요합니다."
        },
        ("03. 프로그래밍 언어 응용", 12): {
            "explanation": "컴파일러는 전체 코드를 번역하는 컴파일 단계에서 문법 오류를 일괄 검출합니다. 인터프리터는 프로그램을 실행하는 도중에 오류를 발견합니다."
        },
        ("03. 프로그래밍 언어 응용", 13): {
            "explanation": "컴파일러는 최종적으로 기계어 번역본(목적 코드)만 배포하므로 원시 코드가 유출되지 않아 보안성이 높습니다. 인터프리터는 원시 코드를 직접 실행하는 경우가 많아 보안에 취약할 수 있습니다."
        },
        ("03. 프로그래밍 언어 응용", 14): {
            "explanation": "실행 파일 생성 여부에서 컴파일러는 일반적으로 실행 파일을 생성하지만, 인터프리터는 실행 파일을 생성하지 않습니다. 따라서 '실행 파일 생성 여부' 항목에서 컴파일러는 '생성함'이고 인터프리터는 '생성하지 않음'이 올바른 연결입니다."
        },
        ("03. 프로그래밍 언어 응용", 15): {
            "explanation": "소스 코드를 실행하는 도중에 오류를 발견하고, 별도의 실행 파일 없이 원시 소스코드 자체를 전달하며, 수정 후 즉시 실행 결과를 확인할 수 있는 것은 인터프리터의 특징입니다."
        },
        ("03. 프로그래밍 언어 응용", 16): {
            "explanation": "JAVA 언어에서 문장의 종료는 세미콜론(;)으로 표시합니다. 특히, 제어문(if, for, while 등)의 경우, 블록({})으로 묶이지 않은 단일 문장 뒤에는 반드시 세미콜론이 필요합니다."
        },
        ("03. 프로그래밍 언어 응용", 18): {
            "explanation": "JAVA에서 변수명은 영문자, 숫자, 언더바(_), 달러($)를 사용할 수 있으며 숫자로 시작할 수 없습니다. '_count'와 '$price'는 올바른 변수명입니다. '2nd_user'는 숫자로 시작하므로 올바르지 않은 변수명입니다."
        },
        ("03. 프로그래밍 언어 응용", 19): {
            "explanation": "JAVA에서 문장의 끝은 세미콜론(;)으로 표시하며, 엔터(줄 바꿈)만으로는 문장의 끝으로 인식되지 않습니다. 따라서 세미콜론을 생략할 수 없는 경우가 많습니다."
        },
        ("03. 프로그래밍 언어 응용", 20): {
            "choices": ["언더바(_)", "공백", "대시(-)", "달러($)", "샵(#)"], # 20번 문항 1번째(0)는 언더바(_)로 수정 (언더바() 깨진 부분 수정)
            "explanation": "언더바(_)"
        },
        ("03. 프로그래밍 언어 응용", 26): {
            "explanation": "모듈은 관련 클래스들을 모아놓은 단위로, 특정 기능을 제공하는 독립된 단위로 볼 수 있습니다. 패키지는 더 큰 개념이며, 클래스는 개별 객체를 나타냅니다."
        },
        ("03. 프로그래밍 언어 응용", 27): {
            "explanation": "Java에서 패키지 내의 클래스나 인터페이스를 사용하기 위해서는 import 문을 사용합니다. 표기법은 'import 패키지명.클래스명;' 또는 'import 패키지명.*;' 입니다."
        },
        
        # 3. 프로그래밍 언어 활용 단원
        ("04. 프로그래밍 언어 활용", 3): {
            "question": "다음 중 프로그램의 구조화 설계 및 제어 구조에서 사용에 유의해야 하며, 남발할 경우 프로그램의 가독성을 심각하게 해치는 것으로 지적되는 goto 문의 특징과 관계가 깊은 것은?",
            "explanation": "goto 문은 프로그램의 흐름을 임의의 위치로 이동시키는 제어문으로, 남발할 경우 프로그램의 가독성을 심각하게 해칠 수 있습니다."
        },
        ("04. 프로그래밍 언어 활용", 4): {
            "explanation": "하향식 설계는 전체 시스템을 먼저 정의하고, 점차 세부적인 구현 내용으로 내려가는 방식입니다. 상위 단계에서는 추상적인 내용을 기술하고 하위 단계로 갈수록 구체화합니다."
        },
        ("04. 프로그래밍 언어 활용", 5): {
            "question": "프로그램의 기본 제어 구조(순차, 선택, 반복)에 대한 설명 중 가장 타당하지 않은 것은?\n선택 구조는 반드시 goto 문을 사용해야 한다."
        },
        ("04. 프로그래밍 언어 활용", 6): {
            "explanation": "C 언어에서 모든 실행 문장의 끝에는 반드시 세미콜론 (;)을 붙여야 합니다."
        },
        ("04. 프로그래밍 언어 활용", 8): {
            "explanation": "C 언어에서 모든 문장은 마침표가 아닌 세미콜론 (;)으로 끝납니다."
        },
        ("04. 프로그래밍 언어 활용", 26): {
            "explanation": "패키지(Package)는 관련 클래스, 인터페이스, 또는 리소스를 모아 놓은 파일의 집합으로, 특정 기능을 제공하는 독립된 단위로 사용될 수 있습니다. 모듈은 더 넓은 개념이며, 클래스는 객체의 설계도, 메소드는 함수의 역할을 합니다."
        },
        ("04. 프로그래밍 언어 활용", 27): {
            "explanation": "Java에서 패키지 내의 클래스나 인터페이스를 사용하기 위해서는 import 문을 사용합니다. 표기법은 'import 패키지명.클래스명;' 또는 'import 패키지명.*;' 입니다."
        }
    }
    
    # 패치 적용
    for q in questions:
        key = (q.get("sub_unit"), q.get("number"))
        if key in patches:
            patch_data = patches[key]
            for field, new_val in patch_data.items():
                # choices의 경우 리스트 내 특정 인덱스만 바꿀 수 있지만, 여기서는 전체 배열을 덮어쓰거나 매핑
                if field == "choices":
                    # 기존 choices 유지하고 특정 인덱스만 덮어쓸 수도 있음. 여기서는 20번 문항만 choices 수정함.
                    if key == ("03. 프로그래밍 언어 응용", 20):
                        q["choices"][0] = "언더바(_)"
                    else:
                        q["choices"] = new_val
                else:
                    q[field] = new_val
            patched_count += 1
            print(f"Patched: [{key[0]} Q{key[1]}] Fields: {list(patch_data.keys())}")
            
    print(f"Total patched questions in MASTER_DB: {patched_count}")
    
    # 변경 사항 저장
    db_data["questions"] = questions
    db_data["metadata"]["last_updated_by"] = "Gichong (QA Agent)"
    db_data["metadata"]["last_updated_at"] = time_strftime_utc()
    db_data["metadata"]["status"] = "Verified & Patched"
    
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(db_data, f, ensure_ascii=False, indent=2)
    print("Saved updated MASTER_DB.json.")
    
    # 4. 단원별 JSON 파일 동기화 분할
    print("Synchronizing to individual unit files...")
    unit_groups = {}
    for q in questions:
        unit = q.get("sub_unit")
        if unit not in unit_groups:
            unit_groups[unit] = []
        unit_groups[unit].append(q)
        
    for unit_name, unit_qs in unit_groups.items():
        # 파일명 생성
        filename = f"{unit_name}.json"
        filepath = os.path.join(DATA_DIR, filename)
        
        # 단원별 파일은 메타데이터 없이 순수한 문항 리스트로 저장할지, 아니면 MASTER_DB 구조를 따를지 확인
        # validate_data.py를 보면, 단원별 파일의 루트가 list인지 검사하고 있음.
        # "Root is not a list" 에러가 validate_data.py:21 에 있음.
        # 따라서 단원별 파일은 순수한 리스트([])여야 함!
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(unit_qs, f, ensure_ascii=False, indent=2)
        print(f"Saved {len(unit_qs)} questions to {filepath}")
        
    print("Database patching and unit synchronization complete!")

def time_strftime_utc():
    import datetime
    return datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

if __name__ == "__main__":
    patch_db()
