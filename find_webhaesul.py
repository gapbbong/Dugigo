import re

def run():
    text = open('d:/App/Dukigo/tmp/cbt_cloudscraper.html', 'r', encoding='utf-8').read()
    links = set(re.findall(r'href=[\'\"](.*?)[\'\"]', text))
    
    # We are looking for something like https://www.comcbt.com/xe/webhaesul/XXXXXX
    webhaesul_links = [l for l in links if 'webhaesul' in l]
    
    # Sometimes it's relative like /xe/webhaesul/XXXX
    for l in webhaesul_links:
        print(f"FOUND: {l}")

if __name__ == "__main__":
    run()
