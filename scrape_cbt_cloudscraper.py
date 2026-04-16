import cloudscraper
from bs4 import BeautifulSoup
import sys

def run():
    print("Initializing cloudscraper...")
    scraper = cloudscraper.create_scraper()
    
    url = "https://www.comcbt.com/xe/b/g1/424161"
    print(f"Fetching URL: {url}")
    
    try:
        response = scraper.get(url, timeout=30)
        response.raise_for_status()
        
        html = response.text
        out_path = 'd:/App/Dukigo/tmp/cbt_cloudscraper.html'
        
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html)
            
        print(f"Successfully saved {len(html)} characters to {out_path}")
        
    except Exception as e:
        print(f"Error fetching page: {e}", file=sys.stderr)

if __name__ == "__main__":
    run()
