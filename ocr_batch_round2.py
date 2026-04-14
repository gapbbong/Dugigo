import subprocess
import os

def ocr_batch():
    img_dir = 'd:/App/Dukigo/tmp_imgs/round2'
    out_file = 'd:/App/Dukigo/tmp/round2_ocr.txt'
    os.makedirs('d:/App/Dukigo/tmp', exist_ok=True)
    
    with open(out_file, 'w', encoding='utf-8') as f:
        for p in range(51, 71):
            img_path = f'{img_dir}/p{p}.png'
            if not os.path.exists(img_path):
                print(f"Skipping Page {p} (Not Found)")
                continue
            print(f"OCRing Page {p}...")
            res = subprocess.run(['tesseract', img_path, 'stdout', '-l', 'kor'], capture_output=True, text=True, encoding='utf-8')
            f.write(f"\n--- Page {p} ---\n")
            f.write(res.stdout)
            
    print("Batch OCR complete.")

if __name__ == "__main__":
    ocr_batch()
