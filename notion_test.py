import requests
import json
import sys

# Ensure stdout uses UTF-8 to prevent encoding errors
sys.stdout.reconfigure(encoding='utf-8')

NOTION_TOKEN = 'ntn_o83643923996HbuthMgNEsS70YNq8JBqwlI1nix4cW5b55'
headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# 1. Search for accessible pages/databases
response = requests.post("https://api.notion.com/v1/search", headers=headers, json={"query": ""})
search_results = response.json()
print("Search Results:")
for r in search_results.get('results', []):
    title = "Unknown"
    if r['object'] == 'page':
        props = r.get('properties', {})
        for prop_name, prop_val in props.items():
            if prop_val.get('type') == 'title':
                try: title = prop_val['title'][0]['plain_text']
                except: pass
    elif r['object'] == 'database':
        try: title = r['title'][0]['plain_text']
        except: pass
    print(f"[{r['object']}] {title} (ID: {r['id']})")
