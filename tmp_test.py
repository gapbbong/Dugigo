import fitz
import subprocess

doc = fitz.open('d:/App/Dukigo/scan/전기기기.pdf')
page = doc.load_page(0)
image_list = page.get_images(full=True)
if image_list:
    base_image = doc.extract_image(image_list[0][0])
    with open('tmp_test.png', 'wb') as f:
        f.write(base_image['image'])
    result = subprocess.run(['tesseract', 'tmp_test.png', 'stdout', '-l', 'kor+eng'], capture_output=True, text=True, encoding='utf-8', errors='ignore')
    # Print the first 500 characters
    print("--- OCR Result ---")
    print(result.stdout[:500])
