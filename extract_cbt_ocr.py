import fitz
import os
import subprocess

pdf_path = r'd:\App\Dukigo\scan\ElectricExam2016.pdf'
out_dir = r'd:\App\Dukigo\tmp_imgs\round2_cont'
txt_out = r'd:\App\Dukigo\tmp\round2_cbt_ocr.txt'

os.makedirs(out_dir, exist_ok=True)
doc = fitz.open(pdf_path)

with open(txt_out, 'w', encoding='utf-8') as f:
    for p in range(68, 85): # Pages 69 to 85
        print(f"Processing page {p+1}...")
        page = doc[p]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_path = os.path.join(out_dir, f'p{p+1}.png')
        pix.save(img_path)
        
        # Run tesseract
        try:
            result = subprocess.run(
                ['tesseract', img_path, 'stdout', '-l', 'kor+eng'],
                capture_output=True, text=True, encoding='utf-8', check=True
            )
            f.write(f"\n\n--- Page {p+1} ---\n\n")
            f.write(result.stdout)
        except Exception as e:
            print(f"Error on page {p+1}: {e}")

print("OCR complete.")
