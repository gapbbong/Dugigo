import fitz
import os

def extract():
    pdf = 'd:/App/Dukigo/scan/ElectricExam2016.pdf'
    out_dir = 'd:/App/Dukigo/tmp_imgs/round2'
    os.makedirs(out_dir, exist_ok=True)
    
    doc = fitz.open(pdf)
    for p in range(50, 70):
        page = doc[p]
        img_list = page.get_images()
        if img_list:
            xref = img_list[0][0]
            base = doc.extract_image(xref)
            image_path = os.path.join(out_dir, f'p{p+1}.png')
            with open(image_path, 'wb') as f:
                f.write(base['image'])
            print(f"Extracted Page {p+1}")
            
if __name__ == "__main__":
    extract()
