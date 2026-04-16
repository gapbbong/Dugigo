import fitz
import re

def find_info():
    doc = fitz.open('scan/ElectricExam2016.pdf')
    print(f"Total Pages: {len(doc)}")
    
    rounds = {}
    q10_2_found = -1
    
    for i in range(len(doc)):
        text = doc[i].get_text()
        
        if i < 40: # Check more pages for headers
            print(f"\n--- Page {i+1} ---\n", text[:300])
        
        # More flexible round header search
        match = re.search(r'([1-4])\s*회', text)
        if match and i < 118: # Just a sanity check
             pass # Will handle below
            
        if "자성체" in text and "감자력" in text:
            q10_2_found = i + 1
            print(f"Round 2 Question 10 POTENTIAL found on Page {i+1}")
            print(text.replace('\n', ' '))
            
    return rounds, q10_2_found

if __name__ == "__main__":
    find_info()
