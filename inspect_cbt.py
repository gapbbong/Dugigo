import re
from bs4 import BeautifulSoup

def run():
    html = open('d:/App/Dukigo/tmp/cbt_cloudscraper.html', 'r', encoding='utf-8').read()
    soup = BeautifulSoup(html, 'html.parser')
    
    # Replace <br>, <div>, <p> with newlines
    for br in soup.find_all(["br", "p", "div"]):
        br.replace_with("\n" + br.text + "\n")
        
    text = soup.get_text('\n', strip=True)
    
    # Let's find question 21 and 22
    match = re.search(r'(21\.\s.*?23\.)', text, re.DOTALL)
    if match:
        print(match.group(1))
    else:
        print("Couldn't find 21-23")
        # Let's just print surrounding context of 21. 
        idx = text.find("21.")
        if idx != -1:
            print(text[max(0, idx-50):idx+500])
        else:
            print("21. not found at all")
            
run()
