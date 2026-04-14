import re
import cloudscraper
import os
import json

def run():
    print("Reading CBT post HTML to find webhaesul link...")
    text = open('d:/App/Dukigo/tmp/cbt_cloudscraper.html', 'r', encoding='utf-8').read()
    links = set(re.findall(r'href=[\'\"](.*?)[\'\"]', text))
    
    webhaesul_links = [l for l in links if 'webhaesul' in l]
    if not webhaesul_links:
        print("No webhaesul link found.")
        return
        
    target_link = webhaesul_links[0]
    if not target_link.startswith('http'):
        if target_link.startswith('/'):
            target_link = 'https://www.comcbt.com' + target_link
        else:
            target_link = 'https://www.comcbt.com/' + target_link
            
    print(f"Target Link Acquired: {target_link}")
    
    print("Fetching the 60-question CBT exam with cloudscraper...")
    scraper = cloudscraper.create_scraper()
    response = scraper.get(target_link, timeout=30)
    response.raise_for_status()
    
    html = response.text
    out_path = 'd:/App/Dukigo/tmp/cbt_technician.html'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print(f"Successfully saved {len(html)} characters to {out_path}")
    
    # Now let's extract the text and save a raw text version
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    for br in soup.find_all(["br", "p", "div"]):
        br.replace_with("\n" + br.text + "\n")
        
    clean_text = soup.get_text('\n', strip=True)
    clean_text = clean_text.replace('\xa0', ' ')
    
    with open('d:/App/Dukigo/tmp/cbt_technician_text.txt', 'w', encoding='utf-8') as f:
        f.write(clean_text)
        
    print("Extraction complete. Ready for JSON parsing.")

if __name__ == "__main__":
    run()
