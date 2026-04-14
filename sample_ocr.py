import fitz
import os
import re
import subprocess

def sample_ocr():
    pdf_path = 'scan/ElectricExam2016.pdf'
    doc = fitz.open(pdf_path)
    
    # Sample pages to find round headers
    sample_pages = [0, 15, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110]
    
    if not os.path.exists('tmp_imgs'): os.makedirs('tmp_imgs')

    for p_idx in sample_pages:
        if p_idx >= len(doc): continue
        page = doc[p_idx]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_path = f'tmp_imgs/page_{p_idx+1}.png'
        pix.save(img_path)
        
        # Call tesseract directly
        try:
            result = subprocess.run(['tesseract', img_path, 'stdout', '-l', 'kor+eng'], 
                                   capture_output=True, text=True, encoding='utf-8')
            text = result.stdout
            print(f"\n--- Page {p_idx+1} OCR ---\n")
            print(text[:500])
            
            match = re.search(r'([1-4])\s*회', text)
            if match:
                 print(f"!!! Found Round {match.group(1)} on Page {p_idx+1}")
        except Exception as e:
            print(f"OCR failed for page {p_idx+1}: {e}")

if __name__ == "__main__":
    sample_ocr()
