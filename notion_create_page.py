import requests
import json
import os

NOTION_TOKEN = 'ntn_o83643923996HbuthMgNEsS70YNq8JBqwlI1nix4cW5b55'
PARENT_PAGE_ID = '3311f28e-7fcf-80aa-8a2f-fe9bb210a65c'

headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def create_notion_page():
    data = {
        "parent": { "page_id": PARENT_PAGE_ID },
        "properties": {
            "title": [
                {
                    "text": {
                        "content": "PDF 기출문제 추출 워크플로우 자동화 가이드 (OCR -> JSON)"
                    }
                }
            ]
        },
        "children": [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "작업 개요"}}]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": "종이(PDF)로 된 기출문제 스캔본에서 Tesseract OCR과 파이썬 PyMuPDF(fitz)를 활용하여 정형화된 JSON 데이터로 추출하는 작업 방식입니다. 다른 컴퓨터에서도 이 방식을 통해 동일한 작업이 가능합니다."}}]
                }
            },
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "필요 프로그램 및 라이브러리"}}]
                }
            },
            {
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": "Tesseract OCR 설치 (환경 변수에 tesseract 추가 필수. 한국어/영어 데이터팩 포함 'kor+eng')"}}]
                }
            },
            {
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": "Python 설치"}}]
                }
            },
            {
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": "피이썬 패키지: pip install PyMuPDF (fitz 모듈 사용)"}}]
                }
            },
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "1. PDF 이미지 추출 및 OCR 적용"}}]
                }
            },
             {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": "PyMuPDF를 사용해 PDF의 각 페이지에 들어 있는 이미지를 뽑아냅니다. 추출된 이미지를 Tesseract 엔진에 넘겨 한국어+텍스트를 읽어옵니다."}}]
                }
            },
             {
                "object": "block",
                "type": "code",
                "code": {
                    "language": "python",
                    "rich_text": [{"type": "text", "text": {"content": "import fitz\nimport subprocess\n\ndoc = fitz.open('scan/ElectricExam2016.pdf')\npage = doc.load_page(0)\nfor img in page.get_images():\n    base_image = doc.extract_image(img[0])\n    with open('tmp.png', 'wb') as f:\n        f.write(base_image['image'])\n        \n    # Tesseract 구동\n    result = subprocess.run(['tesseract', 'tmp.png', 'stdout', '-l', 'kor+eng'], capture_output=True, text=True)\n    print(result.stdout)"}}]
                }
            },
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "2. 정규식(Regex)을 이용한 문제 파싱"}}]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": "전기기능사의 경우 60제로 구성됩니다. (1~20: 전기이론, 21~40: 전기기기, 41~60: 전기설비).\nOCR 결괏값을 전체 문자열로 가져온 뒤 문제 번호를 정규식으로 찾고 그 사이의 텍스트를 끊어 읽어 문제를 구별합니다."}}]
                }
            },
             {
                "object": "block",
                "type": "code",
                "code": {
                    "language": "python",
                    "rich_text": [{"type": "text", "text": {"content": "import re\n# 예: 01번 문제의 시작 위치 찾기\nstart_pattern = r'\\b01[\\.\\s]'\nend_pattern = r'\\b02[\\.\\s]'\n# 찾은 구간의 텍스트를 자른 뒤, 보기 기호 (1) (2) ① ② 등으로 라인을 찾아서 보기(options) 4개를 추출하고 JSON 포맷으로 생성"}}]
                }
            },
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "3. JSON 구조 포맷팅 및 라텍스 (LaTeX) 수식 적용"}}]
                }
            },
             {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": "포맷은 다음과 같이 통일합니다. 특수 수식이나 화학식, 분수 등은 마크다운 라텍스 문법 (`$$...$$` 또는 `\\(...\\)`)에 맞춰 처리하여 렌더링에 적합하게 만듭니다."}}]
                }
            },
             {
                "object": "block",
                "type": "code",
                "code": {
                    "language": "json",
                    "rich_text": [{"type": "text", "text": {"content": "{\n  \"id\": \"2016_01_01\",\n  \"year\": 2016,\n  \"round\": \"01\",\n  \"question_num\": 1,\n  \"subject\": \"전기이론\",\n  \"question\": \"전장 중에서 임의의 단위 전하를 놓았을 때 ... 식은?\",\n  \"options\": [ \"$$ V = IR $$\", \"$$ P = VI $$\", \"보기3\", \"보기4\" ],\n  \"answer\": 1,\n  \"explanation\": \"\",\n  \"level\": \"중\"\n}"}}]
                }
            }
        ]
    }
    
    response = requests.post("https://api.notion.com/v1/pages", headers=headers, json=data)
    if response.status_code == 200:
        print("Successfully created Notion page:", response.json().get('url'))
    else:
        print("Failed to create Notion page:", response.text)

if __name__ == "__main__":
    create_notion_page()
