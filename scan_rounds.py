import fitz
import os
import subprocess
import re

def scan_rounds():
    doc = fitz.open('scan/ElectricExam2016.pdf')
    os.makedirs('tmp_imgs', exist_ok=True)
    
    # Check every 10 pages first to be fast, but then narrow down
    for p in range(0, 118, 10):
        pix = doc[p].get_pixmap(matrix=fitz.Matrix(1, 1)) # lower res is fine for header
        img_path = f'tmp_imgs/scan_{p+1}.png'
        pix.save(img_path)
        
        try:
            res = subprocess.run(['tesseract', img_path, 'stdout', '-l', 'kor+eng'], capture_output=True, text=True, encoding='utf-8')
            text = res.stdout
            print(f"\n--- Page {p+1} ---\n", text[:300].replace('\n', ' '))
            
            m = re.search(r'([1-4])\s*회', text)
            if m:
                print(f"!!! Page {p+1}: Found potential Round {m.group(1)}")
        except:
            print(f"Page {p+1}: Error")

if __name__ == "__main__":
    scan_rounds()
